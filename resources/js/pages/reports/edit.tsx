import { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon, TrashIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface Methodology {
  id: number;
  title: string;
  content: string;
  pivot?: {
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
  pivot?: {
    order: number;
    include_evidence: boolean;
  };
}

interface Report {
  id: number;
  name: string;
  executive_summary: string | null;
  methodologies: Methodology[];
  findings: Vulnerability[];
}

interface Props {
  report: Report;
  methodologies: Methodology[];
  vulnerabilities: Vulnerability[];
}

export default function Edit({ report, methodologies, vulnerabilities }: Props) {
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedMethodologies, setSelectedMethodologies] = useState<number[]>([]);
  const [selectedFindings, setSelectedFindings] = useState<{
    vulnerability_id: number;
    include_evidence: boolean;
  }[]>([]);
  
  const { data, setData, put, processing, errors } = useForm({
    name: report.name,
    executive_summary: report.executive_summary || '',
    methodologies: [] as number[],
    findings: [] as { vulnerability_id: number; include_evidence: boolean }[],
  });

  // Initialize selected methodologies and findings from the report
  useEffect(() => {
    const initialMethodologies = report.methodologies
      .sort((a, b) => (a.pivot?.order || 0) - (b.pivot?.order || 0))
      .map(methodology => methodology.id);
    
    setSelectedMethodologies(initialMethodologies);
    setData('methodologies', initialMethodologies);

    const initialFindings = report.findings
      .sort((a, b) => (a.pivot?.order || 0) - (b.pivot?.order || 0))
      .map(finding => ({
        vulnerability_id: finding.id,
        include_evidence: finding.pivot?.include_evidence || false,
      }));
    
    setSelectedFindings(initialFindings);
    setData('findings', initialFindings);
  }, [report]);

  const handleSelectMethodology = (id: number) => {
    const updatedSelection = selectedMethodologies.includes(id)
      ? selectedMethodologies.filter((methodId) => methodId !== id)
      : [...selectedMethodologies, id];
    
    setSelectedMethodologies(updatedSelection);
    setData('methodologies', updatedSelection);
  };

  const handleSelectFinding = (vulnerability: Vulnerability) => {
    const existingIndex = selectedFindings.findIndex(
      (finding) => finding.vulnerability_id === vulnerability.id
    );

    let updatedFindings;
    
    if (existingIndex >= 0) {
      // If already selected, remove it
      updatedFindings = selectedFindings.filter(
        (finding) => finding.vulnerability_id !== vulnerability.id
      );
    } else {
      // Otherwise add it
      const includeEvidence = vulnerability.pivot?.include_evidence || true;
      updatedFindings = [
        ...selectedFindings,
        { vulnerability_id: vulnerability.id, include_evidence: includeEvidence }
      ];
    }
    
    setSelectedFindings(updatedFindings);
    setData('findings', updatedFindings);
  };

  const toggleEvidenceInclusion = (vulnerabilityId: number) => {
    const updatedFindings = selectedFindings.map(finding => {
      if (finding.vulnerability_id === vulnerabilityId) {
        return { ...finding, include_evidence: !finding.include_evidence };
      }
      return finding;
    });
    
    setSelectedFindings(updatedFindings);
    setData('findings', updatedFindings);
  };

  const moveItem = (array: any[], index: number, direction: 'up' | 'down'): any[] => {
    if (array.length <= 1) return array;
    
    const newArray = [...array];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= array.length) return array;
    
    [newArray[index], newArray[newIndex]] = [newArray[newIndex], newArray[index]];
    return newArray;
  };

  const moveFinding = (index: number, direction: 'up' | 'down') => {
    const updatedFindings = moveItem(selectedFindings, index, direction);
    setSelectedFindings(updatedFindings);
    setData('findings', updatedFindings);
  };

  const moveMethodology = (index: number, direction: 'up' | 'down') => {
    const updatedMethodologies = moveItem(selectedMethodologies, index, direction);
    setSelectedMethodologies(updatedMethodologies);
    setData('methodologies', updatedMethodologies);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('reports.update', report.id));
  };

  const getSeverityBadge = (severity: string) => {
    const lowerSeverity = severity.toLowerCase();
    
    // Using Tailwind's arbitrary values for custom colors
    return (
      <span className={`
        inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
        ${lowerSeverity === 'critical' ? 'bg-red-500 text-white' : ''}
        ${lowerSeverity === 'high' ? 'bg-orange-500 text-white' : ''}
        ${lowerSeverity === 'medium' ? 'bg-yellow-500 text-white' : ''}
        ${lowerSeverity === 'low' ? 'bg-green-500 text-black' : ''}
        ${lowerSeverity === 'info' ? 'bg-blue-500 text-black' : ''}
        ${!['critical', 'high', 'medium', 'low', 'info'].includes(lowerSeverity) ? 'bg-gray-500 text-white' : ''}
      `}>
        {severity.toUpperCase()}
      </span>
    );
  };

  const isVulnerabilitySelected = (id: number) => {
    return selectedFindings.some(finding => finding.vulnerability_id === id);
  };

  const getFindingIncludeEvidence = (id: number) => {
    const finding = selectedFindings.find(finding => finding.vulnerability_id === id);
    return finding ? finding.include_evidence : true;
  };

  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Reports',
      href: '/reports',
    },
    {
      title: report.name,
      href: `/reports/${report.id}`,
    },
    {
      title: 'Edit',
      href: `/reports/${report.id}/edit`,
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit Report: ${report.name}`} />
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Link href={route('reports.show', report.id)} className="flex items-center text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to report
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Edit Report</h1>
          <p className="text-gray-500">Modify the report details and contents</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Report Information</CardTitle>
              <CardDescription>
                Update the report details and configure what to include.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Report Name</Label>
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Enter a name for this report"
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="summary">Executive Summary</TabsTrigger>
                    <TabsTrigger value="methodologies">Methodologies</TabsTrigger>
                    <TabsTrigger value="findings">Findings</TabsTrigger>
                  </TabsList>
                  
                  {/* Executive Summary Tab */}
                  <TabsContent value="summary" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="executive_summary">Executive Summary</Label>
                      <Textarea
                        id="executive_summary"
                        value={data.executive_summary}
                        onChange={(e) => setData('executive_summary', e.target.value)}
                        placeholder="Enter an executive summary for the report..."
                        className="min-h-[200px]"
                      />
                      {errors.executive_summary && (
                        <p className="text-sm text-red-500">{errors.executive_summary}</p>
                      )}
                    </div>
                  </TabsContent>
                  
                  {/* Methodologies Tab */}
                  <TabsContent value="methodologies" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium">Select Methodologies</h3>
                        <p className="text-xs text-gray-500">{selectedMethodologies.length} selected</p>
                      </div>
                      
                      {methodologies.length === 0 ? (
                        <div className="text-center py-6 border rounded-md">
                          <p className="text-gray-500">No methodologies available</p>
                          <p className="text-sm text-gray-400 mt-1">Please create methodologies first</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {methodologies.map((methodology) => (
                            <div 
                              key={methodology.id} 
                              className={`p-4 border rounded-md transition-colors ${
                                selectedMethodologies.includes(methodology.id) 
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-gray-200'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start">
                                  <Checkbox 
                                    id={`methodology-${methodology.id}`}
                                    checked={selectedMethodologies.includes(methodology.id)}
                                    onCheckedChange={() => handleSelectMethodology(methodology.id)}
                                    className="mt-1"
                                  />
                                  <div className="ml-3">
                                    <Label htmlFor={`methodology-${methodology.id}`} className="font-medium cursor-pointer">
                                      {methodology.title}
                                    </Label>
                                    <p className="text-sm text-gray-500 mt-1">{methodology.content.substring(0, 100)}...</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedMethodologies.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-sm font-medium mb-3">Methodology Order</h3>
                          <div className="space-y-2 border rounded-md p-3">
                            {selectedMethodologies.map((methodologyId, index) => {
                              const methodology = methodologies.find(m => m.id === methodologyId);
                              if (!methodology) return null;
                              
                              return (
                                <div key={methodologyId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                  <span className="text-gray-800">{index + 1}. {methodology.title}</span>
                                  <div className="flex space-x-1">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      type="button"
                                      onClick={() => moveMethodology(index, 'up')}
                                      disabled={index === 0}
                                      className="h-8 w-8 p-0"
                                    >
                                      <ChevronUpIcon className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      type="button"
                                      onClick={() => moveMethodology(index, 'down')}
                                      disabled={index === selectedMethodologies.length - 1}
                                      className="h-8 w-8 p-0"
                                    >
                                      <ChevronDownIcon className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      type="button"
                                      onClick={() => handleSelectMethodology(methodologyId)}
                                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  {/* Findings Tab */}
                  <TabsContent value="findings" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium">Select Vulnerabilities as Findings</h3>
                        <p className="text-xs text-gray-500">{selectedFindings.length} selected</p>
                      </div>
                      
                      {vulnerabilities.length === 0 ? (
                        <div className="text-center py-6 border rounded-md">
                          <p className="text-gray-500">No vulnerabilities available for this project</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {vulnerabilities.map((vulnerability) => (
                            <div 
                              key={vulnerability.id} 
                              className={`p-4 border rounded-md transition-colors ${
                                isVulnerabilitySelected(vulnerability.id) 
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-gray-200'
                              }`}
                            >
                              <div className="flex items-start">
                                <Checkbox 
                                  id={`vulnerability-${vulnerability.id}`}
                                  checked={isVulnerabilitySelected(vulnerability.id)}
                                  onCheckedChange={() => handleSelectFinding(vulnerability)}
                                  className="mt-1"
                                />
                                <div className="ml-3 flex-1">
                                  <div className="flex justify-between">
                                    <Label htmlFor={`vulnerability-${vulnerability.id}`} className="font-medium cursor-pointer">
                                      {vulnerability.name}
                                    </Label>
                                    {getSeverityBadge(vulnerability.severity)}
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">{vulnerability.description.substring(0, 100)}...</p>
                                  
                                  {isVulnerabilitySelected(vulnerability.id) && vulnerability.files.length > 0 && (
                                    <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                                      <div className="flex items-center">
                                        <Checkbox 
                                          id={`evidence-${vulnerability.id}`}
                                          checked={getFindingIncludeEvidence(vulnerability.id)}
                                          onCheckedChange={() => toggleEvidenceInclusion(vulnerability.id)}
                                        />
                                        <Label htmlFor={`evidence-${vulnerability.id}`} className="ml-2 cursor-pointer text-black">
                                          Include evidence ({vulnerability.files.length} files)
                                        </Label>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedFindings.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-sm font-medium mb-3">Finding Order</h3>
                          <div className="space-y-2 border rounded-md p-3">
                            {selectedFindings.map((finding, index) => {
                              const vulnerability = vulnerabilities.find(v => v.id === finding.vulnerability_id);
                              if (!vulnerability) return null;
                              
                              return (
                                <div key={finding.vulnerability_id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-800">{index + 1}.</span>
                                    <span className="text-gray-800">{vulnerability.name}</span>
                                    {getSeverityBadge(vulnerability.severity)}
                                    {finding.include_evidence && vulnerability.files.length > 0 && (
                                      <Badge variant="outline" className="text-xs text-gray-800">
                                        Evidence included
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex space-x-1">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      type="button"
                                      onClick={() => moveFinding(index, 'up')}
                                      disabled={index === 0}
                                      className="h-8 w-8 p-0"
                                    >
                                      <ChevronUpIcon className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      type="button"
                                      onClick={() => moveFinding(index, 'down')}
                                      disabled={index === selectedFindings.length - 1}
                                      className="h-8 w-8 p-0"
                                    >
                                      <ChevronDownIcon className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      type="button"
                                      onClick={() => handleSelectFinding(vulnerability)}
                                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href={route('reports.show', report.id)}>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={processing || !data.name}
                className="flex items-center"
              >
                <CheckIcon className="mr-2 h-4 w-4" />
                Update Report
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AppLayout>
  );
} 