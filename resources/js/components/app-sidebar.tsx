import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem, type NavItemChild, type NavItemGrandChild } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Bug, Folder, LayoutGrid, Package, UsersIcon } from 'lucide-react';
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
    const [loading, setLoading] = useState(true);

    // Fetch clients with their projects when component mounts
    useEffect(() => {
        axios.get('/api/sidebar/clients-with-projects')
            .then(response => {
                setClients(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching clients:', error);
                setLoading(false);
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

        // Add "+ Add Client" as the first item
        const allClientItems: NavItemChild[] = [
            {
                id: 0, // Use 0 as a special ID for the add client item
                title: "+ Add Client",
                url: "/clients?action=create", // Special URL with query parameter to trigger add client dialog
                isExpanded: false
            },
            ...clientItems
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

    // Base navigation items
    const baseNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: LayoutGrid,
        },
        // {
        //     title: 'Projects',
        //     url: '/projects',
        //     icon: Package,
        // },
        // {
        //     title: 'Vulnerabilities',
        //     url: '/vulnerabilities',
        //     icon: Bug,
        // },
        {
            title: 'Vulnerability Templates',
            url: '/vulnerability-templates',
            icon: Bug,
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
            url: 'https://github.com/laravel/react-starter-kit',
            icon: Folder,
        },
        {
            title: 'Documentation',
            url: 'https://laravel.com/docs/starter-kits',
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
