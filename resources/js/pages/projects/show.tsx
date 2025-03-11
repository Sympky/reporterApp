import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { PlusIcon, EyeIcon, PencilIcon } from '@heroicons/react/24/outline';
import { ColumnDef } from '@tanstack/react-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import NotesComponent from '@/components/notes-component';
import FileUploader from '@/components/file-uploader';

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
        // Pre-fill form with template data
        setData({
          ...data,
          name: template.name,
          description: template.description || '',
          severity: template.severity ? template.severity.toLowerCase() : 'low',
          cvss: template.cvss ? template.cvss.toString() : '',
          remediation_steps: template.remediation_steps || '',
          notes: template.notes || '',
          discovered_at: data.discovered_at,
          impact_score: template.impact_score || '',
          likelihood_score: template.likelihood_score || '',
          remediation_score: template.remediation_score || '',
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