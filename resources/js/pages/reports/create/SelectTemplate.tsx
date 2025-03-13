import { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface Template {
  id: number;
  name: string;
  description: string | null;
}

interface FormData {
  template_id: string;
  generation_method: 'from_scratch' | 'from_template';
  generate_from_scratch: boolean; // Kept for backward compatibility
  [key: string]: unknown; // Add index signature to satisfy Inertia's FormDataType constraint
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Reports',
    href: '/reports',
  },
  {
    title: 'Create Report',
    href: '/reports/create',
  },
];

export default function SelectTemplate({ templates }: { templates: Template[] }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  
  const { data, setData, post, processing, errors } = useForm<FormData>({
    template_id: '',
    generation_method: 'from_scratch', // Default to from_scratch
    generate_from_scratch: true, // Kept for backward compatibility
  });

  // Update the generate_from_scratch value whenever generation_method changes
  // This is for backward compatibility
  useEffect(() => {
    setData('generate_from_scratch', data.generation_method === 'from_scratch');
  }, [data.generation_method, setData]);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(parseInt(templateId));
    setData('template_id', templateId);
  };

  const handleGenerationMethodChange = (value: 'from_scratch' | 'from_template') => {
    setData('generation_method', value);
    
    // When switching to "from_scratch", clear template selection
    if (value === 'from_scratch') {
      setSelectedTemplateId(null);
      setData('template_id', '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('reports.select-client-project'));
  };

  // Determine if the form can be submitted
  const canSubmit = data.generation_method === 'from_scratch' || 
    (data.generation_method === 'from_template' && !!data.template_id);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create Report - Select Template" />
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Link href={route('reports.index')} className="flex items-center text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to reports
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Create New Report</h1>
          <p className="text-gray-500">Step 1 of 3: Choose how to generate your report</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Generation Method</CardTitle>
              <CardDescription>
                Choose how you would like to generate your report.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={data.generation_method} 
                onValueChange={(value) => handleGenerationMethodChange(value as 'from_scratch' | 'from_template')}
                className="space-y-4"
              >
                <div className={`border rounded-lg p-4 transition-colors ${data.generation_method === 'from_scratch' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
                  <div className="flex items-start">
                    <RadioGroupItem 
                      value="from_scratch" 
                      id="from_scratch"
                      className="mt-1"
                    />
                    <div className="ml-3">
                      <Label 
                        htmlFor="from_scratch"
                        className="text-base font-medium cursor-pointer"
                      >
                        Generate from scratch (recommended)
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Use a direct generation method that creates a clean, reliable document without template processing issues.
                        This option is more reliable and generates a complete report with a standard format.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`border rounded-lg p-4 transition-colors ${data.generation_method === 'from_template' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
                  <div className="flex items-start">
                    <RadioGroupItem 
                      value="from_template" 
                      id="from_template"
                      className="mt-1"
                    />
                    <div className="ml-3">
                      <Label 
                        htmlFor="from_template"
                        className="text-base font-medium cursor-pointer"
                      >
                        Use a template
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Fill in a custom Word template with your report data. This option allows for more customized formatting
                        but requires a properly structured template with specific placeholders.
                      </p>
                    </div>
                  </div>

                  {data.generation_method === 'from_template' && (
                    <div className="mt-4 ml-8">
                      <p className="text-sm font-medium mb-2">Select a template:</p>
                      {templates.length === 0 ? (
                        <div className="text-center py-4 border rounded-md">
                          <p>No templates available. Please create a template first.</p>
                          <div className="mt-4">
                            <Link href={route('report-templates.create')}>
                              <Button size="sm">Create Template</Button>
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <RadioGroup 
                          value={data.template_id} 
                          onValueChange={handleSelectTemplate}
                          className="space-y-2"
                        >
                          {templates.map((template) => (
                            <div key={template.id} className={`border rounded-md p-3 transition-colors ${data.template_id === template.id.toString() ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
                              <div className="flex items-start">
                                <RadioGroupItem 
                                  value={template.id.toString()} 
                                  id={`template-${template.id}`}
                                  className="mt-1"
                                />
                                <div className="ml-3">
                                  <Label 
                                    htmlFor={`template-${template.id}`}
                                    className="text-sm font-medium cursor-pointer"
                                  >
                                    {template.name}
                                  </Label>
                                  {template.description && (
                                    <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                      {errors.template_id && (
                        <div className="text-red-500 text-sm mt-2">{errors.template_id}</div>
                      )}
                    </div>
                  )}
                </div>
              </RadioGroup>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href={route('reports.index')}>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={processing || !canSubmit}
                className="flex items-center"
              >
                Next Step
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AppLayout>
  );
} 