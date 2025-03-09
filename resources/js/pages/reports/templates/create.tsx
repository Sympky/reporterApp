import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeftIcon, UploadIcon } from 'lucide-react';
import { Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Report Templates',
    href: '/report-templates',
  },
  {
    title: 'Create Template',
    href: '/report-templates/create',
  },
];

export default function Create() {
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    description: '',
    template_file: null as File | null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setData('template_file', file);
      
      // Create a preview for the file name
      setFilePreview(file.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('report-templates.store'), {
      forceFormData: true,
      onSuccess: () => {
        reset();
        setFilePreview(null);
      },
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Add Report Template" />
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Link href={route('report-templates.index')} className="flex items-center text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to templates
          </Link>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Add Report Template</CardTitle>
            <CardDescription>
              Upload a DOCX template file with placeholders that will be replaced when generating reports.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="e.g., Standard Security Report"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={data.description || ''}
                  onChange={(e) => setData('description', e.target.value)}
                  placeholder="Describe what this template is used for"
                  rows={3}
                />
                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="template_file">Template File (DOCX)</Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('template_file')?.click()}
                  >
                    <UploadIcon className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                  <input
                    id="template_file"
                    type="file"
                    accept=".docx"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {filePreview ? (
                    <span className="text-sm text-gray-600">{filePreview}</span>
                  ) : (
                    <span className="text-sm text-gray-400">No file chosen</span>
                  )}
                </div>
                {errors.template_file && <p className="text-sm text-red-500">{errors.template_file}</p>}
                
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Placeholder Format</h4>
                  <p className="text-xs text-gray-600 mb-2">
                    Use these placeholders in your DOCX template:
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                    <li>Basic information: {"{report_name}"}, {"{client_name}"}, {"{project_name}"}, {"{date}"}</li>
                    <li>Content: {"{executive_summary}"}</li>
                    <li>For methodologies: Use a "methodology_block" content control with {"{methodology_title#1}"} and {"{methodology_content#1}"}</li>
                    <li>For findings: Use a "finding_block" content control with {"{finding_name#1}"}, {"{finding_severity#1}"}, {"{finding_description#1}"}, {"{finding_impact#1}"}, {"{finding_recommendations#1}"}, {"{finding_evidence#1}"}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Link href={route('report-templates.index')}>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={processing}>
                Save Template
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
} 