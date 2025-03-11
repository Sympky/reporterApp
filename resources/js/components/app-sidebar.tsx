import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem, type NavItemChild, type NavItemGrandChild } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Bug, Folder, LayoutGrid, Package, UsersIcon, FileTextIcon } from 'lucide-react';
import AppLogo from './app-logo';
import { useEffect, useState } from 'react';
import axios from 'axios';

// Define types for the clients and projects data
type Client = {
    id: number;
    name: string;
    projects: Array<{
        id: number;
        name: string;
    }>;
};

export function AppSidebar() {
    const [clients, setClients] = useState<Client[]>([]);

    // Fetch clients with their projects when component mounts
    useEffect(() => {
        axios.get('/api/latest-clients')
            .then(response => {
                setClients(response.data);
            })
            .catch(error => {
                console.error('Error fetching clients:', error);
            });
    }, []);

    // Create hierarchical structure for clients and their projects
    const getClientsNavItem = (): NavItem => {
        // Create child items for each client
        const clientItems: NavItemChild[] = clients.map(client => {
            // Only create children for clients that have projects
            const hasProjects = client.projects && client.projects.length > 0;
            
            // Map projects to grandchild items
            const projectItems: NavItemGrandChild[] = hasProjects 
                ? client.projects.map(project => ({
                    id: project.id,
                    title: project.name,
                    url: `/projects/${project.id}`
                  }))
                : [];
            
            // Return client as a child item with its projects as grandchildren
            return {
                id: client.id,
                title: client.name,
                url: `/clients/${client.id}`,
                children: projectItems,
                isExpanded: false
            };
        });

        // Add "+ Add Client" as the first item and "Show More" as the last item
        const allClientItems: NavItemChild[] = [
            {
                id: 0, // Use 0 as a special ID for the add client item
                title: "+ Add Client",
                url: "/clients?action=create", // Special URL with query parameter to trigger add client dialog
                isExpanded: false
            },
            ...clientItems,
            {
                id: -1, // Use -1 as a special ID for the show more item
                title: "Show More",
                url: "/clients", // Link to all clients page
                isExpanded: false
            }
        ];

        // Return the main Clients nav item with clients as children
        return {
            title: 'Clients',
            url: '/clients',
            icon: UsersIcon,
            children: allClientItems,
            isExpanded: false
        };
    };

    // Base navigation items that don't need special handling
    const baseNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: LayoutGrid,
        },
        {
            title: 'Projects',
            url: '/projects',
            icon: Package,
        },
        {
            title: 'Vulnerabilities',
            url: '/vulnerabilities',
            icon: Bug,
        },
        {
            title: 'Vulnerability Templates',
            url: '/vulnerability-templates',
            icon: Bug,
        },
        {
            title: 'Reports',
            url: '/reports',
            icon: FileTextIcon,
            children: [
                {
                    id: 1,
                    title: 'All Reports',
                    url: '/reports',
                },
                {
                    id: 2,
                    title: 'New Report',
                    url: '/reports/create',
                },
                {
                    id: 3,
                    title: 'Report Templates',
                    url: '/report-templates',
                },
            ],
        },
    ];

    // Create the main navigation items dynamically
    const mainNavItems: NavItem[] = [
        baseNavItems[0], // Dashboard
        getClientsNavItem(), // Clients with hierarchical dropdown
        ...baseNavItems.slice(1) // Rest of the items
    ];

    const footerNavItems: NavItem[] = [
        {
            title: 'Repository',
            url: 'https://github.com/Sympky/reporterApp',
            icon: Folder,
        },
        {
            title: 'Methodologies',
            url: '/methodologies',
            icon: BookOpen,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
