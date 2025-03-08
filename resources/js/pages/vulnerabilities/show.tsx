import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type BreadcrumbItem } from '@/types';
import { ChevronLeft, PencilIcon } from 'lucide-react';
import NotesComponent from '@/components/notes-component';
import FileUploader from '@/components/file-uploader';

// Type definitions
type Vulnerability = {
  id: number;
  project_id: number;
  name: string;
  description: string | null;
  severity: string | null;
  cvss: number | null;
  cve: string | null;
  status: string | null;
  remediation_steps: string | null;
  proof_of_concept: string | null;
  affected_components: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  impact_score: string | null;
  likelihood_score: string | null;
  remediation_score: string | null;
};

type Project = {
  id: number;
  client_id: number;
  name: string;
};

type Client = {
  id: number;
  name: string;
};

interface PageProps {
  vulnerability: Vulnerability;
  project: Project;
  client: Client;
}

export default function ShowVulnerability({ vulnerability, project, client }: PageProps) {
  // Setup breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Vulnerabilities', href: '/vulnerabilities' },
    { title: vulnerability.name, href: `/vulnerabilities/${vulnerability.id}` },
  ];

  const getSeverityBadgeVariant = (severity: string | null) => {
    if (!severity) return 'outline';
    
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
      case 'info':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string | null) => {
    if (!status) return 'outline';
    
    switch (status.toLowerCase()) {
      case 'fixed':
        return 'success';
      case 'in progress':
        return 'warning';
      case 'open':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Vulnerability: ${vulnerability.name}`} />
      
      <div className="container py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/projects/${project.id}`}>
              <Button variant="outline" size="sm">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to Project
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{vulnerability.name}</h1>
            {vulnerability.severity && (
              <Badge variant={getSeverityBadgeVariant(vulnerability.severity)}>
                {vulnerability.severity}
              </Badge>
            )}
            {vulnerability.status && (
              <Badge variant={getStatusBadgeVariant(vulnerability.status)}>
                {vulnerability.status}
              </Badge>
            )}
          </div>
          
          <Link href={`/vulnerabilities/${vulnerability.id}/edit`}>
            <Button>
              <PencilIcon className="mr-1 h-4 w-4" />
              Edit Vulnerability
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Vulnerability Details</CardTitle>
                <CardDescription>
                  Details for vulnerability in {project.name} ({client.name})
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Description</h3>
                  <div className="mt-2 whitespace-pre-wrap">{vulnerability.description || 'No description provided'}</div>
                </div>
                
                {vulnerability.proof_of_concept && (
                  <div>
                    <h3 className="text-lg font-medium">Proof of Concept</h3>
                    <div className="mt-2 whitespace-pre-wrap">{vulnerability.proof_of_concept}</div>
                  </div>
                )}
                
                {vulnerability.affected_components && (
                  <div>
                    <h3 className="text-lg font-medium">Affected Components</h3>
                    <div className="mt-2 whitespace-pre-wrap">{vulnerability.affected_components}</div>
                  </div>
                )}
                
                {vulnerability.remediation_steps && (
                  <div>
                    <h3 className="text-lg font-medium">Remediation Steps</h3>
                    <div className="mt-2 whitespace-pre-wrap">{vulnerability.remediation_steps}</div>
                  </div>
                )}
                
                {vulnerability.notes && (
                  <div>
                    <h3 className="text-lg font-medium">Notes</h3>
                    <div className="mt-2 whitespace-pre-wrap">{vulnerability.notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              
              <CardContent>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Project</dt>
                    <dd className="mt-1">
                      <Link href={`/projects/${project.id}`} className="text-blue-600 hover:underline">
                        {project.name}
                      </Link>
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Client</dt>
                    <dd className="mt-1">
                      <Link href={`/clients/${client.id}`} className="text-blue-600 hover:underline">
                        {client.name}
                      </Link>
                    </dd>
                  </div>
                  
                  {vulnerability.impact_score && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Impact Score</dt>
                      <dd className="mt-1">
                        <Badge variant={getSeverityBadgeVariant(vulnerability.impact_score)}>
                          {vulnerability.impact_score}
                        </Badge>
                      </dd>
                    </div>
                  )}
                  
                  {vulnerability.likelihood_score && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Likelihood Score</dt>
                      <dd className="mt-1">
                        <Badge variant={getSeverityBadgeVariant(vulnerability.likelihood_score)}>
                          {vulnerability.likelihood_score}
                        </Badge>
                      </dd>
                    </div>
                  )}
                  
                  {vulnerability.remediation_score && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Remediation Score</dt>
                      <dd className="mt-1">
                        <Badge variant={getSeverityBadgeVariant(vulnerability.remediation_score)}>
                          {vulnerability.remediation_score}
                        </Badge>
                      </dd>
                    </div>
                  )}
                  
                  {vulnerability.cvss !== null && vulnerability.cvss !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">CVSS Score</dt>
                      <dd className="mt-1">{Number(vulnerability.cvss).toFixed(1)}</dd>
                    </div>
                  )}
                  
                  {vulnerability.cve && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">CVE Identifier</dt>
                      <dd className="mt-1">{vulnerability.cve}</dd>
                    </div>
                  )}
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                    <dd className="mt-1">{new Date(vulnerability.created_at).toLocaleString()}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</dt>
                    <dd className="mt-1">{new Date(vulnerability.updated_at).toLocaleString()}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="mt-6">
          <NotesComponent 
            notableType="vulnerability"
            notableId={vulnerability.id}
            title="Vulnerability Notes"
          />
        </div>
        
        <div className="mt-6">
          <FileUploader 
            fileableType="vulnerability"
            fileableId={vulnerability.id}
            title="Vulnerability Files"
            allowedFileTypes=".jpg,.jpeg,.png,.pdf,.txt,.doc,.docx,.xls,.xlsx,.zip,.rar"
          />
        </div>
      </div>
    </AppLayout>
  );
} 