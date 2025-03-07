import { ColumnDef } from "@tanstack/react-table";
import { type FC } from "react";

export type Template = {
  id: number;
  name: string;
  description: string;
  severity: string;
  cvss: number | null;
  cve: string;
  remediation: string | null;
  impact: string | null;
  references: string | null;
  tags: string | null;
};

// Placeholder components that will be replaced by the actual components from vulnerabilities/templates.tsx
export const EditTemplateDialog: FC<{ template: Template }> = () => null;
export const DeleteTemplateButton: FC<{ template: Template }> = () => null;
export const ApplyTemplateButton: FC<{ template: Template }> = () => null;

export const templateColumns: ColumnDef<Template>[] = [
  {
    accessorKey: "name",
    header: "Title",
  },
  {
    accessorKey: "severity",
    header: "Severity",
    cell: ({ getValue }) => {
      const severity = getValue() as string | null;
      if (!severity) return "—";
      
      let colorClass = "bg-gray-100 text-gray-800";
      
      switch (severity.toLowerCase()) {
        case "critical":
          colorClass = "bg-red-100 text-red-800";
          break;
        case "high":
          colorClass = "bg-orange-100 text-orange-800";
          break;
        case "medium":
          colorClass = "bg-yellow-100 text-yellow-800";
          break;
        case "low":
          colorClass = "bg-blue-100 text-blue-800";
          break;
        case "info":
          colorClass = "bg-green-100 text-green-800";
          break;
      }
      
      // Capitalize first letter for display
      const displaySeverity = severity.charAt(0).toUpperCase() + severity.slice(1);
      
      return (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${colorClass}`}>
          {displaySeverity}
        </span>
      );
    }
  },
  {
    accessorKey: "cvss",
    header: "CVSS Score",
  },
  {
    accessorKey: "cve",
    header: "CVE ID",
    cell: ({ getValue }) => {
      const cve = getValue() as string | null;
      if (!cve) return "—";
      
      return cve;
    }
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ getValue }) => {
      const tags = getValue() as string | null;
      if (!tags) return "—";
      
      try {
        const parsedTags = JSON.parse(tags);
        if (Array.isArray(parsedTags)) {
          return (
            <div className="flex flex-wrap gap-1">
              {parsedTags.map((tag, index) => (
                <span key={index} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                  {tag}
                </span>
              ))}
            </div>
          );
        }
        return tags;
      } catch (e) {
        return tags;
      }
    }
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const template = row.original;
      return (
        <div className="flex items-center space-x-2">
          {/* These components will be replaced at runtime */}
        </div>
      );
    }
  }
]; 