import { ColumnDef } from "@tanstack/react-table";
import { type FC } from "react";
import { Link } from "@inertiajs/react";

export type Project = {
  id: number;
  client_id?: number;
  client_name: string;
  name: string;
  status: string;
  due_date: string;
  vulnerability_count: number;
};

// Placeholder components that will be replaced by the actual components from projects/index.tsx
export const EditProjectDialog: FC<{ project: Project }> = () => null;
export const DeleteProjectButton: FC<{ project: Project }> = () => null;

export const projectColumns: ColumnDef<Project>[] = [
  {
    accessorKey: "client_name",
    header: "Client Name",
    cell: ({ row }) => {
      const project = row.original;
      return (
        <Link
          href={`/clients/${project.client_id}`}
          className="text-primary hover:underline"
        >
          {project.client_name}
        </Link>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Project Name",
    cell: ({ row }) => {
      const project = row.original;
      return (
        <Link
          href={`/projects/${project.id}`}
          className="text-primary hover:underline"
        >
          {project.name}
        </Link>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "due_date",
    header: "Due Date",
    cell: ({ getValue }) => {
      const date = getValue() as string;
      if (!date) return "";
      return new Date(date).toLocaleDateString();
    },
  },
  {
    accessorKey: "vulnerability_count",
    header: "Vulnerabilities",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const project = row.original;
      return (
        <div className="flex items-center space-x-2">
          {/* These components will be replaced at runtime */}
        </div>
      );
    },
  },
];