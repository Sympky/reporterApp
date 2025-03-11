import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { DataTable } from '@/components/data-table';
import { columns, Client } from '@/components/clientColumns';
import { projectColumns, Project } from '@/components/projectColumns';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard() {
    const [latestClients, setLatestClients] = useState<Client[]>([]);
    const [latestProjects, setLatestProjects] = useState<Project[]>([]);
    const [setCommonVulnerabilities] = useState([]);

    useEffect(() => {
        axios.get('/api/latest-clients').then(response => {
            setLatestClients(response.data);
        });

        axios.get('/api/latest-projects').then(response => {
            setLatestProjects(response.data);
        });

        axios.get('/api/common-vulnerabilities').then(response => {
            setCommonVulnerabilities(response.data);
        });
    }, [setCommonVulnerabilities]);

    // The following functions are placeholders for future implementation
    // They are commented out to avoid ESLint warnings
    /*
    const handleClientClick = () => {
        axios.get(`/api/clients/${clientId}/projects`)
            .then(() => {
                // Process the response data here
            })
            .catch(() => {
                // Handle errors appropriately
            });
    };

    const handleProjectClick = (projectId: number) => {
        axios.get(`/api/projects/${projectId}/vulnerabilities`)
            .then(response => {
                // Process the response data here
            })
            .catch(error => {
                // Handle errors appropriately
            });
    };

    const handleVulnerabilityClick = (vulnerabilityId: number) => {
        axios.get(`/api/vulnerabilities/${vulnerabilityId}`)
            .then(response => {
                // Process the response data here
            })
            .catch(error => {
                // Handle errors appropriately
            });
    };
    */

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col gap-4">
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative overflow-hidden rounded-xl border">
                        
                        <DataTable columns={columns} data={latestClients} />
                    </div>
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative overflow-hidden rounded-xl border">
                        
                        <DataTable columns={projectColumns} data={latestProjects} />
                    </div>
                </div>
                <div className="border-sidebar-border/70 dark:border-sidebar-border relative min-h-[100vh] flex-1 rounded-xl border md:min-h-min">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </AppLayout>
    );
}
