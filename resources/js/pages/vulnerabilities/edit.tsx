import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FormEvent, useState } from 'react';
import { useEffect } from 'react';
import { type BreadcrumbItem } from '@/types';
import { ChevronLeft } from 'lucide-react';

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
  discovered_at?: string;
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

export default function EditVulnerability({ vulnerability, project, client }: PageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Setup breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Vulnerabilities', href: '/vulnerabilities' },
    { title: `Edit: ${vulnerability.name}`, href: `/vulnerabilities/${vulnerability.id}/edit` },
  ];

  // Setup form
  const { data, setData, errors, put } = useForm({
    project_id: vulnerability.project_id,
    name: vulnerability.name || '',
    description: vulnerability.description || '',
    severity: vulnerability.severity || 'low',
    cvss: vulnerability.cvss !== null ? String(vulnerability.cvss) : '',
    cve: vulnerability.cve || '',
    status: vulnerability.status || 'open',
    remediation_steps: vulnerability.remediation_steps || '',
    proof_of_concept: vulnerability.proof_of_concept || '',
    affected_components: vulnerability.affected_components || '',
    notes: vulnerability.notes || '',
    discovered_at: vulnerability.discovered_at 
      ? new Date(vulnerability.discovered_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
  });

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(name as any, value);
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setData(name as any, value);
  };

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    put(`/vulnerabilities/${vulnerability.id}`, {
      onSuccess: () => {
        setIsSubmitting(false);
        toast.success('Vulnerability updated successfully');
      },
      onError: () => {
        setIsSubmitting(false);
        toast.error('Failed to update vulnerability');
      }
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit Vulnerability: ${vulnerability.name}`} />
      
      <div className="container py-6">
        <div className="mb-6 flex items-center gap-4">
          <Link href={`/vulnerabilities/${vulnerability.id}`}>
            <Button variant="outline" size="sm">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Vulnerability
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Edit Vulnerability</h1>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Vulnerability Information</CardTitle>
              <CardDescription>
                Edit vulnerability details for {project.name} ({client.name})
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Vulnerability Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={data.name}
                      onChange={handleChange}
                      required
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="severity">Severity</Label>
                    <Select
                      value={data.severity}
                      onValueChange={(value) => handleSelectChange('severity', value)}
                    >
                      <SelectTrigger>
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
                    {errors.severity && <p className="text-sm text-red-500">{errors.severity}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cvss">CVSS Score</Label>
                    <Input
                      id="cvss"
                      name="cvss"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={data.cvss}
                      onChange={handleChange}
                    />
                    {errors.cvss && <p className="text-sm text-red-500">{errors.cvss}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cve">CVE Identifier</Label>
                    <Input
                      id="cve"
                      name="cve"
                      value={data.cve}
                      onChange={handleChange}
                    />
                    {errors.cve && <p className="text-sm text-red-500">{errors.cve}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={data.status}
                    onValueChange={(value) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in progress">In Progress</SelectItem>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="won't fix">Won't Fix</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={data.description}
                    onChange={handleChange}
                    rows={5}
                    required
                  />
                  {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="remediation_steps">Remediation Steps</Label>
                  <Textarea
                    id="remediation_steps"
                    name="remediation_steps"
                    value={data.remediation_steps}
                    onChange={handleChange}
                    rows={5}
                  />
                  {errors.remediation_steps && <p className="text-sm text-red-500">{errors.remediation_steps}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="proof_of_concept">Proof of Concept</Label>
                  <Textarea
                    id="proof_of_concept"
                    name="proof_of_concept"
                    value={data.proof_of_concept}
                    onChange={handleChange}
                    rows={5}
                  />
                  {errors.proof_of_concept && <p className="text-sm text-red-500">{errors.proof_of_concept}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="affected_components">Affected Components</Label>
                  <Textarea
                    id="affected_components"
                    name="affected_components"
                    value={data.affected_components}
                    onChange={handleChange}
                    rows={3}
                  />
                  {errors.affected_components && <p className="text-sm text-red-500">{errors.affected_components}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={data.notes}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Add any additional notes, personal observations, or reminders about this vulnerability"
                  />
                  {errors.notes && <p className="text-sm text-red-500">{errors.notes}</p>}
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Link href={`/vulnerabilities/${vulnerability.id}`}>
                    <Button variant="outline" type="button">Cancel</Button>
                  </Link>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
} 