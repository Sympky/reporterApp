import { useState } from 'react';
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
  const [selected, setSelected] = useState<number | null>(null);
  
  const { data, setData, post, processing, errors } = useForm({
    template_id: '',
  });

  const handleSelectTemplate = (templateId: string) => {
    setSelected(parseInt(templateId));
    setData('template_id', templateId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('reports.select-client-project'));
  };

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
          <p className="text-gray-500">Step 1 of 3: Select a template for your report</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Choose a Template</CardTitle>
              <CardDescription>
                Select a template that best fits your report needs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-6">
                  <p>No templates available. Please create a template first.</p>
                  <div className="mt-4">
                    <Link href={route('report-templates.create')}>
                      <Button>Create Template</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <RadioGroup 
                  value={data.template_id} 
                  onValueChange={handleSelectTemplate}
                  className="space-y-4"
                >
                  {templates.map((template) => (
                    <div key={template.id} className={`border rounded-lg p-4 transition-colors ${data.template_id === template.id.toString() ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
                      <div className="flex items-start">
                        <RadioGroupItem 
                          value={template.id.toString()} 
                          id={`template-${template.id}`}
                          className="mt-1"
                        />
                        <div className="ml-3">
                          <Label 
                            htmlFor={`template-${template.id}`}
                            className="text-base font-medium cursor-pointer"
                          >
                            {template.name}
                          </Label>
                          {template.description && (
                            <p className="text-sm text-gray-500 mt-1">{template.description}</p>
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
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href={route('reports.index')}>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={processing || !selected}
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