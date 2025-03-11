<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImportTemplatesRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Assuming authorization is handled by middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'file' => [
                'required',
                'file',
                'mimes:csv,xlsx,xls',
                'max:10240', // 10MB max
            ],
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.required' => 'A file is required for import.',
            'file.file' => 'The uploaded file is invalid.',
            'file.mimes' => 'The file must be a CSV or Excel file (xlsx, xls).',
            'file.max' => 'The file size must not exceed 10MB.',
        ];
    }
} 