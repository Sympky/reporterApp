<?php

namespace App\Http\Controllers;

use App\Models\ReportTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class ReportTemplateController extends Controller
{
    /**
     * Display a listing of the templates.
     */
    public function index()
    {
        $templates = ReportTemplate::with(['createdBy:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('reports/templates/index', [
            'templates' => $templates,
        ]);
    }

    /**
     * Show the form for creating a new template.
     */
    public function create()
    {
        return Inertia::render('reports/templates/create');
    }

    /**
     * Store a newly created template in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'template_file' => 'required|file|mimes:docx',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        // Store the template file
        $file = $request->file('template_file');
        $path = $file->store('templates');

        // Create the template record
        $template = new ReportTemplate();
        $template->name = $request->name;
        $template->description = $request->description;
        $template->file_path = $path;
        $template->created_by = Auth::id();
        $template->save();

        return redirect()->route('report-templates.index')
            ->with('success', 'Template created successfully.');
    }

    /**
     * Display the specified template.
     */
    public function show(ReportTemplate $reportTemplate)
    {
        return Inertia::render('reports/templates/show', [
            'template' => $reportTemplate->load(['createdBy:id,name']),
        ]);
    }

    /**
     * Show the form for editing the specified template.
     */
    public function edit(ReportTemplate $reportTemplate)
    {
        return Inertia::render('reports/templates/edit', [
            'template' => $reportTemplate,
        ]);
    }

    /**
     * Update the specified template in storage.
     */
    public function update(Request $request, ReportTemplate $reportTemplate)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'template_file' => 'nullable|file|mimes:docx',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        // Update the template file if provided
        if ($request->hasFile('template_file')) {
            // Delete the old file
            if (Storage::exists($reportTemplate->file_path)) {
                Storage::delete($reportTemplate->file_path);
            }

            // Store the new file
            $file = $request->file('template_file');
            $path = $file->store('templates');
            $reportTemplate->file_path = $path;
        }

        // Update the template record
        $reportTemplate->name = $request->name;
        $reportTemplate->description = $request->description;
        $reportTemplate->updated_by = Auth::id();
        $reportTemplate->save();

        return redirect()->route('report-templates.index')
            ->with('success', 'Template updated successfully.');
    }

    /**
     * Remove the specified template from storage.
     */
    public function destroy(ReportTemplate $reportTemplate)
    {
        // Delete the template file
        if (Storage::exists($reportTemplate->file_path)) {
            Storage::delete($reportTemplate->file_path);
        }

        // Delete the template record
        $reportTemplate->delete();

        return redirect()->route('report-templates.index')
            ->with('success', 'Template deleted successfully.');
    }

    /**
     * Download the template file.
     */
    public function download(ReportTemplate $reportTemplate)
    {
        if (!Storage::exists($reportTemplate->file_path)) {
            return redirect()->back()->with('error', 'Template file not found.');
        }

        return Storage::download($reportTemplate->file_path, $reportTemplate->name . '.docx');
    }
}
