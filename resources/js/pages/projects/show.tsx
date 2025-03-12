import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { PlusIcon, EyeIcon, PencilIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { ColumnDef } from '@tanstack/react-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import NotesComponent from '@/components/notes-component';
import FileUploader from '@/components/file-uploader';
import { toast } from 'sonner';
import axios from 'axios';

// Define types for Project, Client, and Vulnerability
type Client = {
  id: number;
  name: string;
};

type Project = {
  id: number;
  client_id: number;
  name: string;
  description: string | null;
  status: string | null;
  due_date: string | null;
  notes: string | null;
  client: Client;
};

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
  impact_score: string | null;
  likelihood_score: string | null;
  remediation_score: string | null;
};

interface PageProps {
  project: Project;
  vulnerabilities: Vulnerability[];
  templates?: Vulnerability[];
}

// Define columns for the vulnerabilities table
const vulnerabilityColumns: ColumnDef<Vulnerability>[] = [
  {
    accessorKey: "name",
    header: "Vulnerability Name",
  },
  {
    accessorKey: "severity",
    header: "Severity",
    cell: ({ row }) => {
      const severity = row.getValue("severity") as string | null;
      return severity ? (
        <Badge 
          variant={
            severity === "Critical" ? "destructive" : 
            severity === "High" ? "destructive" : 
            severity === "Medium" ? "warning" : 
            severity === "Low" ? "outline" : 
            "outline"
          }
        >
          {severity}
        </Badge>
      ) : '-';
    },
  },
  {
    accessorKey: "cvss",
    header: "CVSS",
    cell: ({ row }) => {
      const cvss = row.getValue("cvss") as number | null;
      return cvss !== null && cvss !== undefined ? cvss.toFixed(1) : '-';
    },
  },
  {
    accessorKey: "cve",
    header: "CVE",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string | null;
      return status ? (
        <Badge 
          variant={
            status === "Fixed" ? "success" : 
            status === "In Progress" ? "warning" : 
            status === "Open" ? "destructive" : 
            "outline"
          }
        >
          {status}
        </Badge>
      ) : '-';
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const vulnerability = row.original;
      return (
        <div className="flex space-x-2">
          <Link href={`/vulnerabilities/${vulnerability.id}`}>
            <Button variant="outline" size="sm">
              <EyeIcon className="h-4 w-4 mr-1" />
              View
            </Button>
          </Link>
          <Link href={`/vulnerabilities/${vulnerability.id}/edit`}>
            <Button variant="outline" size="sm">
              <PencilIcon className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </Link>
        </div>
      );
    },
  },
];

// Add Vulnerability Dialog Component
function AddVulnerabilityDialog({ projectId, templates = [] }: { projectId: number, templates?: Vulnerability[] }) {
  const [open, setOpen] = useState(false);
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  const { data, setData, post, processing, errors, reset } = useForm({
    project_id: projectId,
    name: '',
    description: '',
    severity: 'low',
    cvss: '',
    cve: '',
    status: 'open',
    remediation_steps: '',
    proof_of_concept: '',
    affected_components: '',
    notes: '',
    impact: '',
    discovered_at: new Date().toISOString().split('T')[0],
    impact_score: '',
    likelihood_score: '',
    remediation_score: '',
  });

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    if (templateId) {
      // Find the selected template
      const template = templates.find(t => t.id.toString() === templateId);
      
      if (template) {
        // Validate required fields
        if (!template.name) {
          toast.error('Selected template is missing required field: name');
          return;
        }
        
        if (!template.description) {
          toast.error('Selected template is missing required field: description');
          return;
        }
        
        if (!template.severity) {
          toast.error('Selected template is missing required field: severity');
          return;
        }
        
        // Pre-fill form with template data
        setData({
          ...data,
          name: template.name,
          description: template.description || '',
          severity: template.severity || 'low',
          cvss: template.cvss ? template.cvss.toString() : '',
          cve: template.cve || '',
          remediation_steps: template.recommendations || '',
          notes: template.notes || '',
          impact: template.impact || '',
          discovered_at: data.discovered_at,
          impact_score: template.impact_score || '',
          likelihood_score: template.likelihood_score || '',
          remediation_score: template.remediation_score || '',
          affected_components: template.affected_resources || '',
          proof_of_concept: '',
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    post('/vulnerabilities', {
      onSuccess: () => {
        setOpen(false);
        reset();
        setSelectedTemplate('');
        setUseTemplate(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Vulnerability
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>Add New Vulnerability</DialogTitle>
          <DialogDescription>
            Add a vulnerability to this project. You can use a template or create a new one from scratch.
          </DialogDescription>
        </DialogHeader>
        
        {templates.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="use-template"
                checked={useTemplate}
                onChange={(e) => setUseTemplate(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="use-template">Use a vulnerability template</Label>
            </div>
            
            {useTemplate && (
              <div className="mt-3">
                <Label htmlFor="template-select">Select Template</Label>
                <select
                  id="template-select"
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">-- Select a template --</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="hidden" 
            name="_token" 
            value={document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''}
          />
          <input 
            type="hidden" 
            name="project_id" 
            value={projectId}
          />
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="name">Vulnerability Name</Label>
              <Input
                id="name"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                required
              />
              {errors.name && (
                <div className="text-sm text-red-500">{errors.name}</div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={data.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('description', e.target.value)}
                rows={3}
              />
              {errors.description && (
                <div className="text-sm text-red-500">{errors.description}</div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="severity">Severity</Label>
                <select
                  id="severity"
                  value={data.severity}
                  onChange={(e) => setData('severity', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                  <option value="info">Info</option>
                </select>
                {errors.severity && (
                  <div className="text-sm text-red-500">{errors.severity}</div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="cvss">CVSS Score</Label>
                <Input
                  id="cvss"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={data.cvss}
                  onChange={(e) => setData('cvss', e.target.value)}
                />
                {errors.cvss && (
                  <div className="text-sm text-red-500">{errors.cvss}</div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="cve">CVE (if applicable)</Label>
                <Input
                  id="cve"
                  value={data.cve}
                  onChange={(e) => setData('cve', e.target.value)}
                  placeholder="CVE-YYYY-NNNNN"
                />
                {errors.cve && (
                  <div className="text-sm text-red-500">{errors.cve}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={data.status}
                onChange={(e) => setData('status', e.target.value)}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="open">Open</option>
                <option value="in progress">In Progress</option>
                <option value="fixed">Fixed</option>
                <option value="won't fix">Won't Fix</option>
              </select>
              {errors.status && (
                <div className="text-sm text-red-500">{errors.status}</div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="impact_score">Impact Score</Label>
                <select
                  id="impact_score"
                  value={data.impact_score}
                  onChange={(e) => setData('impact_score', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">None</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                  <option value="info">Info</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="likelihood_score">Likelihood Score</Label>
                <select
                  id="likelihood_score"
                  value={data.likelihood_score}
                  onChange={(e) => setData('likelihood_score', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">None</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                  <option value="info">Info</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="remediation_score">Remediation Score</Label>
                <select
                  id="remediation_score"
                  value={data.remediation_score}
                  onChange={(e) => setData('remediation_score', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">None</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                  <option value="info">Info</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="affected_components">Affected Components</Label>
              <Textarea
                id="affected_components"
                value={data.affected_components}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('affected_components', e.target.value)}
                rows={3}
              />
              {errors.affected_components && (
                <div className="text-sm text-red-500">{errors.affected_components}</div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={data.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('notes', e.target.value)}
                rows={3}
                placeholder="Add any additional notes, observations, or reminders about this vulnerability"
              />
              {errors.notes && (
                <div className="text-sm text-red-500">{errors.notes}</div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="impact">Impact Description</Label>
              <Textarea
                id="impact"
                value={data.impact}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('impact', e.target.value)}
                rows={3}
                placeholder="Describe the business or technical impact of this vulnerability"
              />
              {errors.impact && (
                <div className="text-sm text-red-500">{errors.impact}</div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="remediation_steps">Remediation Steps</Label>
              <Textarea
                id="remediation_steps"
                value={data.remediation_steps}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('remediation_steps', e.target.value)}
                rows={3}
              />
              {errors.remediation_steps && (
                <div className="text-sm text-red-500">{errors.remediation_steps}</div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="proof_of_concept">Proof of Concept</Label>
              <Textarea
                id="proof_of_concept"
                value={data.proof_of_concept}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('proof_of_concept', e.target.value)}
                rows={3}
                placeholder="Steps to reproduce or proof of concept code"
              />
              {errors.proof_of_concept && (
                <div className="text-sm text-red-500">{errors.proof_of_concept}</div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                reset();
                setSelectedTemplate('');
                setUseTemplate(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={processing}>
              Save Vulnerability
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Import Vulnerability Dialog Component
function ImportVulnerabilityDialog({ projectId }: { projectId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
  const { data, setData, processing, errors, reset } = useForm({
    file: null as File | null,
    project_id: projectId,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setData('file', e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setData('file', e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorDetails(null);

    if (!data.file) {
      toast.error('Please select a file to import.');
      return;
    }

    console.log("Submitting file:", data.file.name);
    
    // Create FormData object for file upload
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('project_id', projectId.toString());
    
    // Get CSRF token from the meta tag
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    console.log("Using CSRF token:", csrfToken);
    
    // Use axios for the request
    axios.post(route('vulnerabilities.import'), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-CSRF-TOKEN': csrfToken,
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json'
      },
      withCredentials: true
    })
    .then(response => {
      console.log('Import response (success):', response.data);
      
      // Handle successful response
      const responseData = response.data;
      if (responseData && responseData.success === true) {
        setIsOpen(false);
        reset();
        toast.success(`Successfully imported ${responseData.imported} vulnerability/vulnerabilities.`);
        // Reload page to show the newly imported data
        window.location.reload();
      } else {
        // Show error message for API-level errors
        const message = responseData?.message || 'Import failed. Please check the file format.';
        toast.error(message);
        
        // Handle validation errors
        if (responseData?.errors) {
          console.error('Import validation errors:', responseData.errors);
          
          // Format a more helpful error message about headers
          if (responseData.errors.required_headers && responseData.errors.found_headers) {
            const requiredHeaders = responseData.errors.required_headers.join(', ');
            const foundHeaders = responseData.errors.normalized_found?.join(', ') || responseData.errors.found_headers.join(', ');
            
            const headerErrorMsg = `Your CSV file has incorrect headers.\nRequired: ${requiredHeaders}\nFound: ${foundHeaders}`;
            setErrorDetails(headerErrorMsg);
            
            toast.error('Your CSV file has incorrect headers - see error details in dialog', {
              duration: 10000, // Show for 10 seconds
            });
          } else {
            // Save generic error details for display
            setErrorDetails(JSON.stringify(responseData.errors, null, 2));
          }
        }
        
        // Keep dialog open to show error details
        setIsOpen(true);
      }
    })
    .catch(error => {
      console.error('Import error:', error);
      
      // Get any error message from the server
      let errorMessage = 'An error occurred while importing the vulnerabilities.';
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
      }
      
      toast.error(errorMessage);
      setErrorDetails(`Error: ${errorMessage}`);
      setIsOpen(true); // Keep dialog open
    });
  };

  const downloadSampleTemplate = () => {
    window.location.href = route('vulnerabilities.sample-template');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => {
          setIsOpen(true);
          setErrorDetails(null);
        }}>
          <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
          Import Vulnerabilities
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Vulnerabilities</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file with vulnerabilities to import into this project.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="hidden" 
            name="_token" 
            value={document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''}
          />
          <input 
            type="hidden" 
            name="project_id" 
            value={projectId}
          />
          <div className="space-y-2">
            <Label htmlFor="file">Vulnerability File (CSV, XLS, XLSX)</Label>
            <div
              className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer ${
                dragActive ? 'border-primary bg-primary/5' : 'border-input'
              }`}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                id="file"
                name="file"
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileChange}
                className="hidden"
              />
              <ArrowUpTrayIcon className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Drag and drop a file here, or click to browse
              </p>
              {data.file && (
                <p className="mt-2 text-sm font-medium text-primary">{data.file.name}</p>
              )}
            </div>
            {errors.file && <p className="text-red-500 text-sm">{errors.file}</p>}
          </div>
          
          {errorDetails && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <h4 className="text-sm font-medium text-red-800 mb-1">Error Details:</h4>
              <div className="text-xs font-mono overflow-auto max-h-32 whitespace-pre-wrap text-red-800">
                {errorDetails}
              </div>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground">
            <p>Make sure your file includes these headers:</p>
            <p className="font-mono text-xs mt-1">
              name, description, severity, cvss, cve, recommendations, impact, references, tags
            </p>
            <Button 
              type="button" 
              variant="link" 
              size="sm" 
              className="p-0 h-auto text-xs mt-1" 
              onClick={downloadSampleTemplate}
            >
              Download sample template
            </Button>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={processing}>
              {processing ? 'Importing...' : 'Import Vulnerabilities'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectShow({ project, vulnerabilities, templates = [] }: PageProps) {
  // Calculate vulnerability statistics
  const criticalCount = vulnerabilities.filter(v => v.severity === 'Critical').length;
  const highCount = vulnerabilities.filter(v => v.severity === 'High').length;
  const mediumCount = vulnerabilities.filter(v => v.severity === 'Medium').length;
  const lowCount = vulnerabilities.filter(v => v.severity === 'Low').length;
  const openCount = vulnerabilities.filter(v => v.status === 'Open').length;
  const fixedCount = vulnerabilities.filter(v => v.status === 'Fixed').length;

  // Format the due date
  const formattedDueDate = project.due_date 
    ? new Date(project.due_date).toLocaleDateString() 
    : 'No due date set';

  return (
    <AppLayout>
      <Head title={`Project: ${project.name}`} />

      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Link 
                href={`/clients/${project.client_id}`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {project.client.name}
              </Link>
              <span className="text-sm text-muted-foreground">/</span>
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Project details and vulnerabilities
            </div>
          </div>
          <div className="flex space-x-2">
            <Link href={`/projects/${project.id}/edit`}>
              <Button variant="outline">
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit Project
              </Button>
            </Link>
            <ImportVulnerabilityDialog projectId={project.id} />
            <AddVulnerabilityDialog projectId={project.id} templates={templates} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>Basic project details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="font-semibold text-sm">Client</div>
                <div>{project.client.name}</div>
              </div>
              <div>
                <div className="font-semibold text-sm">Description</div>
                <div>{project.description || 'No description provided'}</div>
              </div>
              <div>
                <div className="font-semibold text-sm">Status</div>
                <div>
                  {project.status ? (
                    <Badge 
                      variant={
                        project.status === "Completed" ? "success" : 
                        project.status === "In Progress" ? "warning" : 
                        project.status === "Not Started" ? "destructive" : 
                        "outline"
                      }
                    >
                      {project.status}
                    </Badge>
                  ) : 'Not set'}
                </div>
              </div>
              <div>
                <div className="font-semibold text-sm">Due Date</div>
                <div>{formattedDueDate}</div>
              </div>
              {project.notes && (
                <div>
                  <div className="font-semibold text-sm">Notes</div>
                  <div className="whitespace-pre-wrap">{project.notes}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vulnerability Summary</CardTitle>
              <CardDescription>Overview of project vulnerabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-3">
                  <div className="text-sm text-muted-foreground">Total Vulnerabilities</div>
                  <div className="text-2xl font-bold">{vulnerabilities.length}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-sm text-muted-foreground">Open Issues</div>
                  <div className="text-2xl font-bold">{openCount}</div>
                </div>
                <div className="rounded-lg border p-3 bg-red-50 dark:bg-red-950/20">
                  <div className="text-sm text-red-700 dark:text-red-400">Critical / High</div>
                  <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                    {criticalCount + highCount}
                  </div>
                </div>
                <div className="rounded-lg border p-3 bg-amber-50 dark:bg-amber-950/20">
                  <div className="text-sm text-amber-700 dark:text-amber-400">Medium</div>
                  <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                    {mediumCount}
                  </div>
                </div>
                <div className="rounded-lg border p-3 bg-blue-50 dark:bg-blue-950/20">
                  <div className="text-sm text-blue-700 dark:text-blue-400">Low</div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {lowCount}
                  </div>
                </div>
                <div className="rounded-lg border p-3 bg-green-50 dark:bg-green-950/20">
                  <div className="text-sm text-green-700 dark:text-green-400">Fixed</div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {fixedCount}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project Vulnerabilities</CardTitle>
            <CardDescription>All vulnerabilities for {project.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={vulnerabilityColumns} 
              data={vulnerabilities} 
              placeholder="No vulnerabilities found."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Additional notes about the project</CardDescription>
          </CardHeader>
          <CardContent>
            <NotesComponent 
              notableType="project"
              notableId={project.id}
              title="Project Notes"
            />
          </CardContent>
        </Card>

        <div className="mt-6">
          <FileUploader 
            fileableType="project"
            fileableId={project.id}
            title="Project Files"
          />
        </div>
      </div>
    </AppLayout>
  );
} 