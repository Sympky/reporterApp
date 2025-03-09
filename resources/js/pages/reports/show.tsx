import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftIcon, DownloadIcon, PencilIcon, RefreshCwIcon, Clipboard, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface Methodology {
  id: number;
  title: string;
  content: string;
  pivot: {
    order: number;
  };
}

interface FileAttachment {
  id: number;
  original_name: string;
  file_path: string;
}

interface Vulnerability {
  id: number;
  name: string;
  severity: string;
  description: string;
  impact: string;
  recommendations: string;
  files: FileAttachment[];
  pivot: {
    order: number;
    include_evidence: boolean;
  };
}

interface Report {
  id: number;
  name: string;
  client: {
    id: number;
    name: string;
  };
  project: {
    id: number;
    name: string;
  };
  reportTemplate: {
    id: number;
    name: string;
  };
  status: string;
  executive_summary: string;
  generated_file_path: string | null;
  file_exists?: boolean;
  created_at: string;
  methodologies: Methodology[];
  findings: Vulnerability[];
  created_by: {
    id: number;
    name: string;
  };
}

export default function Show({ report }: { report: Report }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { csrf_token } = usePage().props as any;
  
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Reports',
      href: '/reports',
    },
    {
      title: report?.name || 'Report Details',
      href: `/reports/${report?.id || ''}`,
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'generated':
        return <Badge variant="secondary">Generated</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleRegenerate = () => {
    if (!report?.id) return;
    
    setRegenerating(true);
    router.post(route('reports.regenerate', report.id), {}, {
      onSuccess: () => setRegenerating(false),
      onError: () => setRegenerating(false),
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeverityBadge = (severity: string) => {
    const severityColors: Record<string, string> = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
      info: 'bg-blue-500',
    };

    const bgColor = severityColors[severity.toLowerCase()] || 'bg-gray-500';
    
    return (
      <Badge className={`${bgColor} text-white`}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  // Function to handle file download
  const downloadReport = () => {
    if (!report?.id) return;
    
    // Open in a new window which will force download
    window.open(`/reports/${report.id}/download`, '_blank');
  };

  // If report is not fully loaded, show a loading state
  if (!report || !report.client || !report.project || !report.reportTemplate) {
    return (
      <AppLayout breadcrumbs={[{ title: 'Reports', href: '/reports' }]}>
        <Head title="Loading Report..." />
        <div className="container mx-auto py-6">
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Loading report data...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Report: ${report.name}`} />
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Link href={route('reports.index')} className="flex items-center text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to reports
          </Link>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">{report.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-gray-600">
                Created on {new Date(report.created_at).toLocaleDateString()} by {report.created_by?.name || 'Unknown'}
              </p>
              {getStatusBadge(report.status)}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {report.file_exists && (
              <Button 
                variant="primary" 
                className="flex items-center"
                onClick={downloadReport}
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                Download Report
              </Button>
            )}
            <Button 
              variant="outline" 
              className="flex items-center"
              onClick={handleRegenerate}
              disabled={regenerating}
            >
              <RefreshCwIcon className={`w-4 h-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
            <Link href={route('reports.edit', report.id)}>
              <Button className="flex items-center">
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit Report
              </Button>
            </Link>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Report Summary</CardTitle>
            <CardDescription>
              Basic information about this report
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Client</dt>
                <dd className="text-lg">{report.client.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Project</dt>
                <dd className="text-lg">{report.project.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Template</dt>
                <dd className="text-lg">{report.reportTemplate.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="text-lg">{getStatusBadge(report.status)}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Executive Summary</dt>
                <dd className="mt-1 text-base whitespace-pre-wrap border p-3 rounded-md bg-gray-50">
                  {report.executive_summary || 'No executive summary provided.'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Methodologies</CardTitle>
              <CardDescription>
                Testing methodologies included in this report
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report.methodologies && report.methodologies.length > 0 ? (
                <div className="space-y-4">
                  {report.methodologies.map((methodology) => (
                    <div key={methodology.id} className="border rounded-md p-4">
                      <h3 className="font-medium text-lg">{methodology.title}</h3>
                      <p className="mt-2 text-sm whitespace-pre-wrap">{methodology.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No methodologies included in this report.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Findings</CardTitle>
              <CardDescription>
                Vulnerabilities included in this report
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report.findings && report.findings.length > 0 ? (
                <div className="space-y-4">
                  {report.findings.map((finding) => (
                    <div key={finding.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-lg">{finding.name}</h3>
                        {getSeverityBadge(finding.severity)}
                      </div>
                      
                      <div className="mt-2 space-y-2">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Description</h4>
                          <p className="text-sm whitespace-pre-wrap">{finding.description}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Impact</h4>
                          <p className="text-sm whitespace-pre-wrap">{finding.impact}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Recommendations</h4>
                          <p className="text-sm whitespace-pre-wrap">{finding.recommendations}</p>
                        </div>
                        
                        {finding.files && finding.files.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Evidence Files</h4>
                            <ul className="list-disc list-inside text-sm">
                              {finding.files.map(file => (
                                <li key={file.id}>{file.original_name}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No findings included in this report.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {report.generated_file_path ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <div>
                <h3 className="text-green-800 font-medium">Report file available</h3>
                <p className="text-green-700 text-sm">
                  A report file has been generated. You can download it using the download button above.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex">
              <RefreshCwIcon className="h-5 w-5 text-yellow-500 mr-2" />
              <div>
                <h3 className="text-yellow-800 font-medium">Report file not generated</h3>
                <p className="text-yellow-700 text-sm">
                  The report file hasn't been generated yet or generation failed. Click the "Regenerate" button to create the report file.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
} 