import { DataTable } from '@/components/data-table';
import AppLayout from '@/layouts/app-layout';
import { useForm, usePage } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { vulnerabilityColumns } from '@/components/vulnerabilityColumns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { type BreadcrumbItem } from '@/types';

// Type definition for Vulnerability
type Vulnerability = {
  id: number;
  project_id: number;
  project_name: string;
  client_name: string;
  client_id: number;
  name: string;
  description: string;
  severity: string;
  cvss: number | null;
  cve: string;
  remediation: string | null;
  discovered_at: string;
  impact_score?: string | null;
  likelihood_score?: string | null;
  remediation_score?: string | null;
  impact: string;
};

// Type definition for the page props
interface PageProps {
  vulnerabilities?: Vulnerability[];
  projects?: {
    id: number;
    name: string;
    client_name: string;
  }[];
  templates?: {
    id: number;
    name: string;
    description: string;
    severity: string;
    cvss: number | null;
    cve: string;
    recommendations: string | null;
    impact: string | null;
    impact_score: string | null;
    references: string | null;
    tags: string | null;
    likelihood_score?: string | null;
    remediation_score?: string | null;
  }[];
}

// EditVulnerabilityDialog component
export function EditVulnerabilityDialog({ vulnerability }: { vulnerability: Vulnerability }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Define the form data interface
  interface VulnerabilityEditFormData {
    id: number;
    project_id: string;
    name: string;
    description: string;
    severity: string;
    cvss: string;
    cve: string;
    recommendations: string;
    impact: string;
    discovered_at: string;
    impact_score: string;
    likelihood_score: string;
    remediation_score: string;
    [key: string]: string | number | boolean | null | undefined;
  }

  const { data, setData, put, errors } = useForm<VulnerabilityEditFormData>({
    id: vulnerability.id,
    project_id: vulnerability.project_id.toString(),
    name: vulnerability.name,
    description: vulnerability.description,
    severity: vulnerability.severity,
    cvss: vulnerability.cvss?.toString() || '',
    cve: vulnerability.cve,
    recommendations: vulnerability.remediation || '',
    impact: vulnerability.impact || '',
    discovered_at: vulnerability.discovered_at ? new Date(vulnerability.discovered_at).toISOString().split('T')[0] : '',
    impact_score: vulnerability.impact_score || '',
    likelihood_score: vulnerability.likelihood_score || '',
    remediation_score: vulnerability.remediation_score || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setData(id as keyof typeof data, value);
  };

  const handleSelectChange = (id: string, value: string) => {
    setData(id as keyof typeof data, value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    put(`/vulnerabilities/${vulnerability.id}`, {
      onSuccess: () => {
        setIsSubmitting(false);
        setIsOpen(false);
        toast.success('Vulnerability updated successfully!');
      },
      onError: (err) => {
        setIsSubmitting(false);
        if (typeof err === 'string') {
          setError(err);
        } else {
          setError('An error occurred while updating the vulnerability.');
        }
      },
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
      >
        <PencilIcon className="h-4 w-4" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Vulnerability</DialogTitle>
            <DialogDescription>Update vulnerability details</DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project_id">Project</Label>
              <Select
                value={data.project_id}
                onValueChange={(value) => handleSelectChange('project_id', value)}
              >
                <SelectTrigger id="project_id">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {(usePage().props as PageProps).projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name} ({project.client_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.project_id && <p className="text-red-500 text-sm">{errors.project_id}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Title</Label>
              <Input
                id="name"
                value={data.name}
                onChange={handleChange}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={data.description}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select
                  value={data.severity}
                  onValueChange={(value) => handleSelectChange('severity', value)}
                >
                  <SelectTrigger id="severity">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
                {errors.severity && <p className="text-red-500 text-sm">{errors.severity}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvss">CVSS Score (0-10)</Label>
                <Input
                  id="cvss"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={data.cvss}
                  onChange={handleChange}
                />
                {errors.cvss && <p className="text-red-500 text-sm">{errors.cvss}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="impact_score">Impact Score</Label>
                <Select
                  value={data.impact_score}
                  onValueChange={(value) => handleSelectChange('impact_score', value)}
                >
                  <SelectTrigger id="impact_score">
                    <SelectValue placeholder="Select impact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
                {errors.impact_score && <p className="text-red-500 text-sm">{errors.impact_score}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="likelihood_score">Likelihood Score</Label>
                <Select
                  value={data.likelihood_score}
                  onValueChange={(value) => handleSelectChange('likelihood_score', value)}
                >
                  <SelectTrigger id="likelihood_score">
                    <SelectValue placeholder="Select likelihood" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
                {errors.likelihood_score && <p className="text-red-500 text-sm">{errors.likelihood_score}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="remediation_score">Remediation Score</Label>
                <Select
                  value={data.remediation_score}
                  onValueChange={(value) => handleSelectChange('remediation_score', value)}
                >
                  <SelectTrigger id="remediation_score">
                    <SelectValue placeholder="Select remediation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
                {errors.remediation_score && <p className="text-red-500 text-sm">{errors.remediation_score}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cve">CVE ID</Label>
                <Input
                  id="cve"
                  value={data.cve}
                  onChange={handleChange}
                  placeholder="e.g., CVE-2021-44228"
                />
                {errors.cve && <p className="text-red-500 text-sm">{errors.cve}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="discovered_at">Found Date</Label>
                <Input
                  id="discovered_at"
                  type="date"
                  value={data.discovered_at}
                  onChange={handleChange}
                />
                {errors.discovered_at && <p className="text-red-500 text-sm">{errors.discovered_at}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommendations">Remediation</Label>
              <textarea
                id="recommendations"
                value={data.recommendations}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.recommendations && <p className="text-red-500 text-sm">{errors.recommendations}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="impact">Impact Description</Label>
              <textarea
                id="impact"
                value={data.impact}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Describe the business or technical impact of this vulnerability"
              />
              {errors.impact && <p className="text-red-500 text-sm">{errors.impact}</p>}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                ref={closeRef}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// DeleteVulnerabilityButton component
export function DeleteVulnerabilityButton({ vulnerability }: { vulnerability: Vulnerability }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setIsSubmitting(true);
    setError(null);

    fetch(`/api/vulnerabilities/${vulnerability.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to delete vulnerability');
        }
        setIsSubmitting(false);
        setIsOpen(false);
        toast.success('Vulnerability deleted successfully!');
        window.location.reload();
      })
      .catch((err) => {
        setIsSubmitting(false);
        setError(err.message || 'An error occurred while deleting the vulnerability.');
      });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 text-red-500"
      >
        <TrashIcon className="h-4 w-4" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Vulnerability</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{vulnerability.name}"?
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// CreateVulnerabilityDialog component
export function CreateVulnerabilityDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const page = usePage<{ props: PageProps }>();
  const pageProps = page.props as PageProps;
  const templates = pageProps.templates || [];

  // Define the form data interface
  interface VulnerabilityFormData {
    project_id: string;
    name: string;
    description: string;
    severity: string;
    cvss: string;
    cve: string;
    recommendations: string;
    impact: string;
    discovered_at: string;
    impact_score: string;
    likelihood_score: string;
    remediation_score: string;
    [key: string]: string | number | boolean | null | undefined;
  }

  const { data, setData, post, errors, reset } = useForm<VulnerabilityFormData>({
    project_id: '',
    name: '',
    description: '',
    severity: 'medium',
    cvss: '',
    cve: '',
    recommendations: '',
    impact: '',
    discovered_at: new Date().toISOString().split('T')[0],
    impact_score: '',
    likelihood_score: '',
    remediation_score: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setData(id as keyof typeof data, value);
  };

  const handleSelectChange = (id: string, value: string) => {
    setData(id as keyof typeof data, value);
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    setError(null); // Clear any existing errors
    
    if (templateId) {
      // Find the selected template
      const template = templates.find(t => t.id.toString() === templateId);
      
      if (template) {
        // Validate required fields
        if (!template.name) {
          setError('Selected template is missing required field: name');
          return;
        }
        
        if (!template.description) {
          setError('Selected template is missing required field: description');
          return;
        }
        
        if (!template.severity) {
          setError('Selected template is missing required field: severity');
          return;
        }
        
        // Pre-fill form with template data
        setData({
          ...data,
          name: template.name,
          description: template.description || '',
          severity: template.severity ? template.severity.toLowerCase() : 'low',
          cvss: template.cvss ? template.cvss.toString() : '',
          cve: template.cve || '',
          recommendations: template.recommendations || '',
          impact: template.impact || '',
          impact_score: template.impact_score || '',
          likelihood_score: template.likelihood_score || '',
          remediation_score: template.remediation_score || '',
          references: template.references || '',
          tags: template.tags || '[]',
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    post('/vulnerabilities', {
      onSuccess: () => {
        setIsSubmitting(false);
        setIsOpen(false);
        reset();
        setSelectedTemplate('');
        setUseTemplate(false);
        toast.success('Vulnerability created successfully!');
      },
      onError: (err) => {
        setIsSubmitting(false);
        if (typeof err === 'string') {
          setError(err);
        } else {
          setError('An error occurred while creating the vulnerability.');
        }
      },
    });
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <PlusIcon className="h-4 w-4 mr-2" />
        Add Vulnerability
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Vulnerability</DialogTitle>
            <DialogDescription>Add a new vulnerability</DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                    <Select
                      value={selectedTemplate}
                      onValueChange={(value) => handleTemplateChange(value)}
                    >
                      <SelectTrigger id="template-select">
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="project_id">Project</Label>
              <Select
                value={data.project_id}
                onValueChange={(value) => handleSelectChange('project_id', value)}
              >
                <SelectTrigger id="project_id">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {pageProps.projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name} ({project.client_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.project_id && <p className="text-red-500 text-sm">{errors.project_id}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Title</Label>
              <Input
                id="name"
                value={data.name}
                onChange={handleChange}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={data.description}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select
                  value={data.severity}
                  onValueChange={(value) => handleSelectChange('severity', value)}
                >
                  <SelectTrigger id="severity">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
                {errors.severity && <p className="text-red-500 text-sm">{errors.severity}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvss">CVSS Score (0-10)</Label>
                <Input
                  id="cvss"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={data.cvss}
                  onChange={handleChange}
                />
                {errors.cvss && <p className="text-red-500 text-sm">{errors.cvss}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="impact_score">Impact Score</Label>
                <Select
                  value={data.impact_score}
                  onValueChange={(value) => handleSelectChange('impact_score', value)}
                >
                  <SelectTrigger id="impact_score">
                    <SelectValue placeholder="Select impact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
                {errors.impact_score && <p className="text-red-500 text-sm">{errors.impact_score}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="likelihood_score">Likelihood Score</Label>
                <Select
                  value={data.likelihood_score}
                  onValueChange={(value) => handleSelectChange('likelihood_score', value)}
                >
                  <SelectTrigger id="likelihood_score">
                    <SelectValue placeholder="Select likelihood" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
                {errors.likelihood_score && <p className="text-red-500 text-sm">{errors.likelihood_score}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="remediation_score">Remediation Score</Label>
                <Select
                  value={data.remediation_score}
                  onValueChange={(value) => handleSelectChange('remediation_score', value)}
                >
                  <SelectTrigger id="remediation_score">
                    <SelectValue placeholder="Select remediation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
                {errors.remediation_score && <p className="text-red-500 text-sm">{errors.remediation_score}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cve">CVE ID</Label>
                <Input
                  id="cve"
                  value={data.cve}
                  onChange={handleChange}
                  placeholder="e.g., CVE-2021-44228"
                />
                {errors.cve && <p className="text-red-500 text-sm">{errors.cve}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="discovered_at">Found Date</Label>
                <Input
                  id="discovered_at"
                  type="date"
                  value={data.discovered_at}
                  onChange={handleChange}
                />
                {errors.discovered_at && <p className="text-red-500 text-sm">{errors.discovered_at}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommendations">Remediation</Label>
              <textarea
                id="recommendations"
                value={data.recommendations}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.recommendations && <p className="text-red-500 text-sm">{errors.recommendations}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="impact">Impact Description</Label>
              <textarea
                id="impact"
                value={data.impact}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Describe the business or technical impact of this vulnerability"
              />
              {errors.impact && <p className="text-red-500 text-sm">{errors.impact}</p>}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                ref={closeRef}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Vulnerability'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
  {
    title: 'Vulnerabilities',
    href: '/vulnerabilities',
  },
];

// Main Vulnerabilities Index Component
export default function VulnerabilitiesIndex() {
  const { vulnerabilities = [] } = usePage().props as PageProps;
  
  // Create a wrapper component to populate the actions column
  const VulnerabilityColumns = [...vulnerabilityColumns];
  
  // Override the actions cell to use our actual components
  const actionsColumn = VulnerabilityColumns.find(col => col.id === 'actions');
  if (actionsColumn) {
    actionsColumn.cell = ({ row }) => {
      const vulnerability = row.original;
      return (
        <div className="flex items-center space-x-2">
          <EditVulnerabilityDialog vulnerability={vulnerability as unknown as Vulnerability} />
          <DeleteVulnerabilityButton vulnerability={vulnerability as unknown as Vulnerability} />
        </div>
      );
    };
  }
  
  // Format vulnerabilities for the data table
  const formattedVulnerabilities = vulnerabilities.map(vulnerability => ({
    id: vulnerability.id,
    project_id: vulnerability.project_id,
    client_id: vulnerability.client_id,
    project_name: vulnerability.project_name,
    client_name: vulnerability.client_name,
    name: vulnerability.name,
    description: vulnerability.description,
    severity: vulnerability.severity,
    cve: vulnerability.cve,
    cvss: vulnerability.cvss,
    remediation: vulnerability.remediation,
    discovered_at: vulnerability.discovered_at,
    impact_score: vulnerability.impact_score,
    likelihood_score: vulnerability.likelihood_score,
    remediation_score: vulnerability.remediation_score,
    impact: vulnerability.impact,
  }));
  
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Vulnerabilities" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Vulnerabilities</h1>
          <CreateVulnerabilityDialog />
        </div>
        
        <div className="border-sidebar-border/70 dark:border-sidebar-border relative overflow-hidden rounded-xl border">
          <DataTable columns={VulnerabilityColumns} data={formattedVulnerabilities} />
        </div>
      </div>
    </AppLayout>
  );
} 