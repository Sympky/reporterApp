import { useState, useRef, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
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
  generate_from_scratch: boolean;
  [key: string]: unknown;
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

interface SelectTemplateProps {
    selectedTemplateId: number | null;
    setSelectedTemplateId: (id: number | null) => void;
    onNext: () => void;
}

const SelectTemplate = ({
    selectedTemplateId,
    setSelectedTemplateId,
    onNext,
}: SelectTemplateProps) => {
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Function to fetch templates using Inertia
    const fetchTemplates = async () => {
        try {
            setIsLoading(true);
            // Use Inertia's router to get data (it handles CSRF and auth)
            router.visit('/report-templates', {
                method: 'get',
                only: ['templates'],
                preserveState: true,
                onSuccess: (page) => {
                    if (page.props.templates) {
                        setTemplates(page.props.templates);
                    }
                    setIsLoading(false);
                },
                onError: () => {
                    setError('Failed to load templates');
                    setIsLoading(false);
                }
            });
        } catch (err) {
            console.error('Error fetching templates:', err);
            setError('Failed to load templates');
            setIsLoading(false);
        }
    };

    // Call fetchTemplates when component mounts
    useEffect(() => {
        // Check if templates were already provided as props
        if (templates && templates.length > 0) {
            setIsLoading(false);
            return;
        }
        
        fetchTemplates();
    }, []);

    // Simple function without useRef
    const handleSelectTemplate = (templateId: number) => {
        setSelectedTemplateId(templateId);
    };

    const handleNext = () => {
        if (!selectedTemplateId) {
            setErrorMsg("Please select a template to continue.");
            return;
        }
        onNext();
    };

    const handleGenerateFromScratch = () => {
        // Use Inertia's router for navigation
        router.visit('/reports/create/generate-from-scratch');
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {error}
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4">
            <div className="mb-6">
                <h4 className="text-xl font-semibold">Select a Template</h4>
                <p className="text-gray-600">Choose a template to use for your new report.</p>
            </div>

            {errorMsg && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    {errorMsg}
                    <span 
                        className="absolute top-0 bottom-0 right-0 px-4 py-3"
                        onClick={() => setErrorMsg(null)}
                    >
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </span>
                </div>
            )}

            <div className="mb-6 grid grid-cols-1">
                <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={handleGenerateFromScratch}
                >
                    <CardContent className="flex flex-col items-center justify-center p-6">
                        <h5 className="text-lg font-medium">Generate From Scratch</h5>
                        <p className="text-center text-gray-600">
                            Start with a blank report and customize as needed.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates && templates.length > 0 ? (
                    templates.map((template: Template) => (
                        <Card 
                            key={template.id}
                            className={`cursor-pointer hover:shadow-md transition-shadow ${
                                selectedTemplateId === template.id ? 'border-2 border-blue-500' : ''
                            }`}
                            onClick={() => handleSelectTemplate(template.id)}
                        >
                            <CardContent className="p-4">
                                <h5 className="text-lg font-medium">{template.name}</h5>
                                {template.description && (
                                    <p className="text-gray-600">{template.description}</p>
                                )}
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full text-center p-6 bg-gray-50 rounded">
                        <p>No templates found. You can generate a report from scratch.</p>
                    </div>
                )}
            </div>

            <div className="flex justify-end">
                <Button
                    disabled={!selectedTemplateId}
                    onClick={handleNext}
                >
                    Next <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export default SelectTemplate; 