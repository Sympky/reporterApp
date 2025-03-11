import { DataTable } from '@/components/data-table';
import AppLayout from '@/layouts/app-layout';
import { useForm, usePage } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusIcon, PencilIcon, TrashIcon, ArrowRightCircleIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { templateColumns } from '@/components/templateColumns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { type BreadcrumbItem } from '@/types';
import axios from 'axios';

// Type definition for Template (already defined in templateColumns.tsx)
type Template = {
  id: number;
  name: string;
  description: string;
  severity: string;
  cvss: number | null;
  cve: string;
  remediation: string | null;
  impact: string | null;
  references: string | null;
  tags: string | null;
};

// Type definition for the page props
interface PageProps {
  templates?: Template[];
  projects?: {
    id: number;
    name: string;
    client_name: string;
  }[];
}

// EditTemplateDialog component
export function EditTemplateDialog({ template }: { template: Template }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const { data, setData, put, errors } = useForm({
    id: template.id,
    name: template.name,
    description: template.description,
    severity: template.severity,
    cvss: template.cvss?.toString() || '',
    cve: template.cve || '',
    recommendations: template.remediation || '',
    impact: template.impact || '',
    references: template.references || '',
    tags: template.tags || '[]',
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

    put(`/vulnerability-templates/${template.id}`, {
      onSuccess: () => {
        setIsSubmitting(false);
        setIsOpen(false);
        toast.success('Template updated successfully!');
      },
      onError: (err) => {
        setIsSubmitting(false);
        if (typeof err === 'string') {
          setError(err);
        } else {
          setError('An error occurred while updating the template.');
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
            <DialogTitle>Edit Vulnerability Template</DialogTitle>
            <DialogDescription>Update vulnerability template details</DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="cve">CVE ID</Label>
              <Input
                id="cve"
                value={data.cve}
                onChange={handleChange}
              />
              {errors.cve && <p className="text-red-500 text-sm">{errors.cve}</p>}
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
              <Label htmlFor="impact">Impact</Label>
              <textarea
                id="impact"
                value={data.impact}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.impact && <p className="text-red-500 text-sm">{errors.impact}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="references">References</Label>
              <Input
                id="references"
                value={data.references}
                onChange={handleChange}
                placeholder="URL or reference information"
              />
              {errors.references && <p className="text-red-500 text-sm">{errors.references}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={typeof data.tags === 'string' && data.tags.startsWith('[') ? 
                  JSON.parse(data.tags).join(', ') : 
                  data.tags}
                onChange={(e) => {
                  // Convert comma-separated string to JSON array
                  const tagsArray = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                  setData('tags', JSON.stringify(tagsArray));
                }}
                placeholder="Example: sql-injection, xss, authentication"
              />
              {errors.tags && <p className="text-red-500 text-sm">{errors.tags}</p>}
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

// DeleteTemplateButton component
export function DeleteTemplateButton({ template }: { template: Template }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setIsSubmitting(true);
    setError(null);

    fetch(`/api/vulnerability-templates/${template.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to delete template');
        }
        setIsSubmitting(false);
        setIsOpen(false);
        toast.success('Template deleted successfully!');
        window.location.reload();
      })
      .catch((err) => {
        setIsSubmitting(false);
        setError(err.message || 'An error occurred while deleting the template.');
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
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{template.name}"?
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

// ApplyTemplateButton component
export function ApplyTemplateButton({ template }: { template: Template }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const { data, setData, post, errors, reset } = useForm({
    template_id: template.id,
    project_id: '',
    discovered_at: new Date().toISOString().split('T')[0],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    post('/vulnerability-templates/apply', {
      onSuccess: () => {
        setIsSubmitting(false);
        setIsOpen(false);
        reset();
        toast.success('Template applied to project successfully!');
      },
      onError: (err) => {
        setIsSubmitting(false);
        if (typeof err === 'string') {
          setError(err);
        } else {
          setError('An error occurred while applying the template.');
        }
      },
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 text-green-500"
      >
        <ArrowRightCircleIcon className="h-4 w-4" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Apply Template to Project</DialogTitle>
            <DialogDescription>
              Apply "{template.name}" to a specific project
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project_id">Select Project</Label>
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
              <Label htmlFor="discovered_at">Discovery Date</Label>
              <Input
                id="discovered_at"
                type="date"
                value={data.discovered_at}
                onChange={handleChange}
              />
              {errors.discovered_at && <p className="text-red-500 text-sm">{errors.discovered_at}</p>}
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
                {isSubmitting ? 'Applying...' : 'Apply Template'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// CreateTemplateDialog component
export function CreateTemplateDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const { data, setData, post, errors, reset } = useForm({
    name: '',
    description: '',
    severity: 'medium',
    cvss: '',
    cve: '',
    recommendations: '',
    impact: '',
    references: '',
    tags: '[]',
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

    post('/vulnerability-templates', {
      onSuccess: () => {
        setIsSubmitting(false);
        setIsOpen(false);
        reset();
        toast.success('Template created successfully!');
      },
      onError: (err) => {
        setIsSubmitting(false);
        if (typeof err === 'string') {
          setError(err);
        } else {
          setError('An error occurred while creating the template.');
        }
      },
    });
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <PlusIcon className="h-4 w-4 mr-2" />
        Add Template
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Vulnerability Template</DialogTitle>
            <DialogDescription>Add a new reusable vulnerability template</DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="cve">CVE ID</Label>
              <Input
                id="cve"
                value={data.cve}
                onChange={handleChange}
              />
              {errors.cve && <p className="text-red-500 text-sm">{errors.cve}</p>}
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
              <Label htmlFor="impact">Impact</Label>
              <textarea
                id="impact"
                value={data.impact}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.impact && <p className="text-red-500 text-sm">{errors.impact}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="references">References</Label>
              <Input
                id="references"
                value={data.references}
                onChange={handleChange}
                placeholder="URL or reference information"
              />
              {errors.references && <p className="text-red-500 text-sm">{errors.references}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags_input"
                value={typeof data.tags === 'string' && data.tags.startsWith('[') ? 
                  JSON.parse(data.tags).join(', ') : 
                  data.tags}
                onChange={(e) => {
                  // Convert comma-separated string to JSON array
                  const tagsArray = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                  setData('tags', JSON.stringify(tagsArray));
                }}
                placeholder="Example: sql-injection, xss, authentication"
              />
              {errors.tags && <p className="text-red-500 text-sm">{errors.tags}</p>}
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
                {isSubmitting ? 'Creating...' : 'Create Template'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ImportTemplateDialog component
export function ImportTemplateDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const page = usePage<{
    flash: {
      success?: string;
      error?: string;
      import_results?: any;
    }
  }>();

  const { data, setData, post, processing, errors, reset } = useForm({
    file: null as File | null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setData('file', file);
      validateCsvHeaders(file);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setData('file', file);
      validateCsvHeaders(file);
    }
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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Helper function to validate CSV headers before upload
  const validateCsvHeaders = (file: File) => {
    // Only validate CSV files
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return;
    }

    // Reset any previous error
    setErrorDetails(null);

    const requiredHeaders = ['name', 'description', 'severity'];
    const reader = new FileReader();

    reader.onload = (event) => {
      if (!event.target?.result) return;
      
      try {
        // Get the first line which should contain headers
        const content = event.target.result as string;
        const lines = content.split(/\r\n|\n/);
        if (lines.length === 0) {
          setErrorDetails('CSV file appears to be empty. Please check the file.');
          return;
        }

        // Parse the header line
        const headerLine = lines[0];
        const headers = headerLine.split(',').map(h => h.trim().toLowerCase()
          .replace(/^["'](.*)["']$/, '$1')); // Remove quotes if present

        console.log('CSV Headers:', headers);

        // Check for required headers
        const missingHeaders = requiredHeaders.filter(required => {
          // Check for exact match
          if (headers.includes(required)) return false;
          
          // Check for variations
          const variations = {
            'name': ['title', 'header', 'vuln', 'vulnerability'],
            'description': ['desc', 'details', 'summary'],
            'severity': ['risk', 'level', 'impact', 'priority']
          };
          
          // Check if any variation of the required header exists
          return !(variations[required as keyof typeof variations]?.some(v => 
            headers.some(h => h.includes(v))
          ));
        });

        if (missingHeaders.length > 0) {
          setErrorDetails(`Your CSV appears to be missing these required headers: ${missingHeaders.join(', ')}.\n\nPlease ensure your CSV has headers for: name, description, and severity.\n\nThe headers found were: ${headers.join(', ')}`);
          return;
        }
        
        // All checks passed!
        console.log('CSV headers validation passed');
      } catch (err) {
        console.error('Error validating CSV:', err);
      }
    };

    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorDetails(null);

    if (!data.file) {
      toast.error('Please select a file to import.');
      return;
    }

    console.log("Submitting file:", data.file.name);
    
    // Get the CSRF token
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    
    // Create a FormData object for file upload
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('_token', csrfToken);
    
    // Set processing state
    setIsProcessing(true);
    
    // Use axios directly for file upload
    axios.post(route('vulnerability.templates.import'), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-CSRF-TOKEN': csrfToken,
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(response => {
      console.log('Import response:', response.data);
      setIsProcessing(false);
      
      const responseData = response.data;
      
      if (responseData && responseData.success === true) {
        setIsOpen(false);
        reset();
        toast.success(`Successfully imported ${responseData.imported} template(s).`);
        // Reload page to show the newly imported data
        window.location.reload();
      } else {
        // Show error message for API-level errors
        const message = responseData?.message || 'Import failed. Please check the file format.';
        toast.error(message);
        
        // Handle different types of errors
        handleImportErrors(responseData?.errors);
        
        // Keep dialog open to show error details
        setIsOpen(true);
      }
    })
    .catch(error => {
      console.error('Import error:', error);
      setIsProcessing(false);
      
      // Get any error message from the server
      let errorMessage = 'An error occurred while importing the templates.';
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setErrorDetails(`Error: ${errorMessage}`);
      setIsOpen(true); // Keep dialog open
    });
  };
  
  // Helper function to format error messages for display
  const handleImportErrors = (errors: any) => {
    if (!errors) return;
    
    console.error('Import validation errors:', errors);
    
    if (errors.required_headers && errors.found_headers) {
      // Handle header errors
      const requiredHeaders = errors.required_headers.join(', ');
      const foundHeaders = errors.normalized_found?.join(', ') || errors.found_headers.join(', ');
      
      setErrorDetails(`Your CSV file has incorrect headers.\nRequired: ${requiredHeaders}\nFound: ${foundHeaders}`);
    } else if (Array.isArray(errors) && errors.length > 0) {
      // Handle row-specific errors
      const formattedErrors = errors.map((rowError: any) => {
        const row = rowError.row;
        const errorDetails = rowError.errors;
        
        // Format different types of errors
        let errorMessages: string[] = [];
        
        if (errorDetails.general) {
          errorMessages = errorMessages.concat(errorDetails.general);
        }
        
        if (errorDetails.missing_field) {
          errorMessages = errorMessages.concat(errorDetails.missing_field);
        }
        
        if (errorDetails.severity) {
          errorMessages = errorMessages.concat(errorDetails.severity);
        }
        
        // Handle other validation errors
        Object.entries(errorDetails).forEach(([field, msgs]) => {
          if (!['general', 'missing_field', 'severity'].includes(field)) {
            if (Array.isArray(msgs)) {
              errorMessages = errorMessages.concat(msgs.map(msg => `${field}: ${msg}`));
            }
          }
        });
        
        return `Row ${row}: ${errorMessages.join(', ')}`;
      }).join('\n\n');
      
      setErrorDetails(
        `The following rows had errors:\n\n${formattedErrors}\n\n` +
        `Tip: Make sure all required fields are present in your CSV file. Check for proper formatting of fields like severity.`
      );
    } else {
      // Generic error display
      setErrorDetails(JSON.stringify(errors, null, 2));
    }
  };

  const downloadSampleTemplate = () => {
    window.location.href = route('vulnerability.templates.sample-template');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => {
          setIsOpen(true);
          setErrorDetails(null);
        }}>
          <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
          Import Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Templates</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file with vulnerability templates to import.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="hidden" 
            name="_token" 
            value={document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''}
          />
          <div className="space-y-2">
            <Label htmlFor="file">Template File (CSV, XLS, XLSX)</Label>
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
            <div className="mt-2 text-xs space-y-1">
              <p><strong>Required fields:</strong> <span className="font-mono">name, description, severity</span></p>
              <p><strong>Optional fields:</strong> <span className="font-mono">cvss, cve, recommendations, impact, references, tags</span></p>
            </div>
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
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? 'Importing...' : 'Import Templates'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
  {
    title: 'Vulnerability Templates',
    href: '/vulnerability-templates',
  },
];

// Main Templates Index Component
export default function TemplatesIndex() {
  const { templates = [] } = usePage().props as PageProps;
  
  // Create a wrapper component to populate the actions column
  const TemplateColumns = [...templateColumns];
  
  // Override the actions cell to use our actual components
  const actionsColumn = TemplateColumns.find(col => col.id === 'actions');
  if (actionsColumn) {
    actionsColumn.cell = ({ row }) => {
      const template = row.original;
      return (
        <div className="flex items-center space-x-2">
          <EditTemplateDialog template={template as unknown as Template} />
          <ApplyTemplateButton template={template as unknown as Template} />
          <DeleteTemplateButton template={template as unknown as Template} />
        </div>
      );
    };
  }
  
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Vulnerability Templates" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Vulnerability Templates</h1>
            <p className="text-muted-foreground">Reusable vulnerability templates that can be applied to any project</p>
          </div>
          <div className="flex space-x-2">
            <ImportTemplateDialog />
            <CreateTemplateDialog />
          </div>
        </div>
        
        <div className="border-sidebar-border/70 dark:border-sidebar-border relative overflow-hidden rounded-xl border">
          <DataTable columns={TemplateColumns} data={templates} />
        </div>
      </div>
    </AppLayout>
  );
} 