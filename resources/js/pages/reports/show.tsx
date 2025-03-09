import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
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
            {report.generated_file_path && (
              <Link href={route('reports.download', report.id)}>
                <Button variant="outline" className="flex items-center">
                  <DownloadIcon className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
              </Link>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Client</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-medium">{report.client.name}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Project</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-medium">{report.project.name}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Template</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-medium">{report.reportTemplate.name}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Report Contents</CardTitle>
            <CardDescription>
              {report.generated_file_path 
                ? 'View the contents that were used to generate this report.' 
                : 'Configure and generate a report file using this data.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="summary">Executive Summary</TabsTrigger>
                <TabsTrigger value="methodologies">Methodologies ({report.methodologies?.length || 0})</TabsTrigger>
                <TabsTrigger value="findings">Findings ({report.findings?.length || 0})</TabsTrigger>
              </TabsList>
              
              {/* Executive Summary Tab */}
              <TabsContent value="summary">
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-2 top-2"
                    onClick={() => copyToClipboard(report.executive_summary || '')}
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clipboard className="h-4 w-4" />
                    )}
                  </Button>
                  {report.executive_summary ? (
                    <div className="prose max-w-none p-4 border rounded-md">
                      <p className="whitespace-pre-line">{report.executive_summary}</p>
                    </div>
                  ) : (
                    <div className="p-4 border rounded-md text-gray-500 italic">
                      No executive summary provided.
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* Methodologies Tab */}
              <TabsContent value="methodologies">
                {!report.methodologies || report.methodologies.length === 0 ? (
                  <div className="text-center py-6 border rounded-md">
                    <p className="text-gray-500">No methodologies included in this report.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {report.methodologies
                      .sort((a, b) => (a.pivot?.order || 0) - (b.pivot?.order || 0))
                      .map((methodology) => (
                        <Card key={methodology.id}>
                          <CardHeader>
                            <CardTitle className="text-lg">{methodology.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="prose max-w-none">
                              <p className="whitespace-pre-line">{methodology.content}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </TabsContent>
              
              {/* Findings Tab */}
              <TabsContent value="findings">
                {!report.findings || report.findings.length === 0 ? (
                  <div className="text-center py-6 border rounded-md">
                    <p className="text-gray-500">No findings included in this report.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {report.findings
                      .sort((a, b) => (a.pivot?.order || 0) - (b.pivot?.order || 0))
                      .map((vulnerability) => (
                        <Card key={vulnerability.id}>
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">{vulnerability.name}</CardTitle>
                              {getSeverityBadge(vulnerability.severity)}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Description</h4>
                              <p className="text-gray-700 whitespace-pre-line">{vulnerability.description}</p>
                            </div>
                            
                            <Separator />
                            
                            <div>
                              <h4 className="font-medium mb-2">Impact</h4>
                              <p className="text-gray-700 whitespace-pre-line">{vulnerability.impact}</p>
                            </div>
                            
                            <Separator />
                            
                            <div>
                              <h4 className="font-medium mb-2">Recommendations</h4>
                              <p className="text-gray-700 whitespace-pre-line">{vulnerability.recommendations}</p>
                            </div>
                            
                            {vulnerability.files && vulnerability.files.length > 0 && vulnerability.pivot?.include_evidence && (
                              <>
                                <Separator />
                                
                                <div>
                                  <h4 className="font-medium mb-2">Evidence Files</h4>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>File Name</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {vulnerability.files.map((file) => (
                                        <TableRow key={file.id}>
                                          <TableCell>{file.original_name}</TableCell>
                                          <TableCell className="text-right">
                                            <Link href={route('files.download', file.id)}>
                                              <Button variant="outline" size="sm">
                                                <DownloadIcon className="h-4 w-4" />
                                                <span className="sr-only">Download</span>
                                              </Button>
                                            </Link>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
} 