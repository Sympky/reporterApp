import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

// Make sure the component properly defines and receives the setSelectedTemplateId prop
interface SelectTemplateProps {
    setSelectedTemplateId: React.Dispatch<React.SetStateAction<number | null>>;
    selectedTemplateId?: number | null;
    formData?: any;
    setFormData?: React.Dispatch<React.SetStateAction<any>>;
}

interface Template {
    id: number;
    name: string;
    description: string;
    file_path: string;
    created_at: string;
}

const SelectTemplate: React.FC<SelectTemplateProps> = ({ 
    setSelectedTemplateId, 
    selectedTemplateId = null,
    formData,
    setFormData
}) => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch templates on component mount
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/report-templates');
                setTemplates(response.data);
                setError(null);
            } catch (err) {
                console.error('Error fetching templates:', err);
                setError('Failed to load templates');
            } finally {
                setLoading(false);
            }
        };

        fetchTemplates();
    }, []);

    const handleSelectTemplate = useCallback((templateId: number) => {
        try {
            // Enhanced check for setSelectedTemplateId function
            if (typeof setSelectedTemplateId === 'function') {
                try {
                    setSelectedTemplateId(templateId);
                    console.log('Template ID set successfully:', templateId);
                } catch (err) {
                    console.error('Error calling setSelectedTemplateId:', err);
                }
                
                // If formData/setFormData are available, update those as well
                if (setFormData && typeof setFormData === 'function') {
                    try {
                        setFormData((prevData: any) => ({
                            ...prevData,
                            report_template_id: templateId
                        }));
                    } catch (err) {
                        console.error('Error updating formData:', err);
                    }
                }
            } else {
                console.error('setSelectedTemplateId is not a function or is undefined', setSelectedTemplateId);
                
                // Alternative approach: update through the form data directly if available
                if (typeof formData !== 'undefined' && typeof setFormData === 'function') {
                    try {
                        setFormData((prevData: any) => ({
                            ...prevData,
                            report_template_id: templateId
                        }));
                        console.log('Updated formData with template ID as fallback');
                    } catch (err) {
                        console.error('Error updating formData (fallback):', err);
                    }
                } else {
                    // If neither approach works, show an error to the user
                    setError('Unable to select template due to a technical issue. Please try again or contact support.');
                }
            }
        } catch (error) {
            console.error('Error in handleSelectTemplate:', error);
            setError('Failed to select template');
        }
    }, [setSelectedTemplateId, setFormData, formData]);

    if (loading) {
        return <div>Loading templates...</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    if (templates.length === 0) {
        return <div>No templates available.</div>;
    }

    return (
        <div className="my-4">
            <h3 className="text-lg font-medium mb-2">Select a Template</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                    <div 
                        key={template.id}
                        className={`border rounded-md p-4 cursor-pointer transition-colors
                            ${selectedTemplateId === template.id 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                        onClick={() => handleSelectTemplate(template.id)}
                    >
                        <h4 className="font-medium">{template.name}</h4>
                        {template.description && (
                            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                            Created: {new Date(template.created_at).toLocaleDateString()}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SelectTemplate; 