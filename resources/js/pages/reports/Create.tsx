import React, { useState, useEffect } from 'react';
import SelectTemplate from '@/Components/SelectTemplate';
import { usePage } from '@inertiajs/react';

const Create = () => {
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        report_template_id: null,
    });

    return (
        <div>
            <SelectTemplate 
                setSelectedTemplateId={setSelectedTemplateId} 
                selectedTemplateId={selectedTemplateId}
                formData={formData}
                setFormData={setFormData}
            />
        </div>
    );
};

export default Create; 