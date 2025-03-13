<?php

namespace App\Http\Controllers;

use App\Models\ReportTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

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

        // Create the template record
        $template = new ReportTemplate();
        $template->name = $request->name;
        $template->description = $request->description;
        $template->created_by = Auth::id();

        // Replace complex file path handling with proper Storage usage
        if ($request->hasFile('template_file')) {
            $path = $request->file('template_file')->store('templates', 'public');
            $template->file_path = $path;
        }

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

        // Update the template record
        $reportTemplate->name = $request->name;
        $reportTemplate->description = $request->description;
        $reportTemplate->updated_by = Auth::id();

        // Replace complex file path handling with proper Storage usage
        if ($request->hasFile('template_file')) {
            // Remove old file if it exists
            if ($reportTemplate->file_path) {
                Storage::disk('public')->delete($reportTemplate->file_path);
            }
            
            // Store new file
            $path = $request->file('template_file')->store('templates', 'public');
            $reportTemplate->file_path = $path;
        }

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
        if ($reportTemplate->file_path) {
            Storage::disk('public')->delete($reportTemplate->file_path);
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
        try {
            // Fix the file path by removing the 'public/' prefix if it exists
            $filePath = $reportTemplate->file_path;
            if (strpos($filePath, 'public/storage/') === 0) {
                $filePath = str_replace('public/storage/', '', $filePath);
            } else if (strpos($filePath, 'storage/') === 0) {
                $filePath = str_replace('storage/', '', $filePath);
            }
            
            // Check if file exists
            if (!Storage::disk('public')->exists($filePath)) {
                Log::error('Template file not found: ' . $filePath);
                return redirect()->back()->with('error', 'Template file not found.');
            }
            
            // Get physical path
            $fullPath = Storage::disk('public')->path($filePath);
            
            // Return download response
            return response()->download(
                $fullPath, 
                $reportTemplate->name . '.docx', 
                [
                    'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'Content-Disposition' => 'attachment; filename="' . $reportTemplate->name . '.docx"',
                    'Cache-Control' => 'no-cache',
                ]
            );
        } catch (\Exception $e) {
            Log::error('Error downloading template: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to download template: ' . $e->getMessage());
        }
    }
}
