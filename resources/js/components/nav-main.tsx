import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem, type NavItemChild, type NavItemGrandChild } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});
    const [expandedChildItems, setExpandedChildItems] = useState<{ [key: string]: boolean }>({});

    const toggleDropdown = (title: string) => {
        setExpandedItems(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };

    const toggleChildDropdown = (parentTitle: string, childId: number) => {
        const key = `${parentTitle}-${childId}`;
        setExpandedChildItems(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
        
        // Ensure parent stays expanded
        setExpandedItems(prev => ({
            ...prev,
            [parentTitle]: true
        }));
    };

    const isChildExpanded = (parentTitle: string, childId: number) => {
        const key = `${parentTitle}-${childId}`;
        return expandedChildItems[key] || false;
    };

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <div key={item.title}>
                        {item.children && item.children.length > 0 ? (
                            <>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        onClick={() => toggleDropdown(item.title)}
                                        isActive={item.url === page.url}
                                    >
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                        {expandedItems[item.title] ? 
                                            <ChevronDown className="ml-auto h-4 w-4" /> : 
                                            <ChevronRight className="ml-auto h-4 w-4" />
                                        }
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                
                                {expandedItems[item.title] && (
                                    <div className="ml-6 space-y-1 mt-1">
                                        {item.children.map((child: NavItemChild) => (
                                            <div key={child.id}>
                                                {child.children && child.children.length > 0 ? (
                                                    <>
                                                        <SidebarMenuItem>
                                                            <SidebarMenuButton
                                                                size="sm"
                                                                onClick={() => toggleChildDropdown(item.title, child.id)}
                                                                isActive={child.url === page.url}
                                                                className="text-sm py-1"
                                                            >
                                                                <span>{child.title}</span>
                                                                {isChildExpanded(item.title, child.id) ? 
                                                                    <ChevronDown className="ml-auto h-3 w-3" /> : 
                                                                    <ChevronRight className="ml-auto h-3 w-3" />
                                                                }
                                                            </SidebarMenuButton>
                                                        </SidebarMenuItem>

                                                        {isChildExpanded(item.title, child.id) && (
                                                            <div className="ml-4 space-y-1 mt-1">
                                                                {child.children.map((grandChild: NavItemGrandChild) => (
                                                                    <SidebarMenuItem key={grandChild.id}>
                                                                        <SidebarMenuButton
                                                                            asChild
                                                                            size="sm"
                                                                            isActive={grandChild.url === page.url}
                                                                            className="text-xs py-1"
                                                                        >
                                                                            <Link href={grandChild.url} prefetch>
                                                                                <span>{grandChild.title}</span>
                                                                            </Link>
                                                                        </SidebarMenuButton>
                                                                    </SidebarMenuItem>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <SidebarMenuItem>
                                                        <SidebarMenuButton
                                                            asChild
                                                            size="sm"
                                                            isActive={child.url === page.url}
                                                            className={`text-sm py-1 ${child.id === 0 ? 'font-medium text-primary hover:text-primary-dark' : ''}`}
                                                        >
                                                            <Link href={child.url} prefetch>
                                                                <span>{child.title}</span>
                                                            </Link>
                                                        </SidebarMenuButton>
                                                    </SidebarMenuItem>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={item.url === page.url}>
                                    <Link href={item.url} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )}
                    </div>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
