import { ColumnDef } from "@tanstack/react-table";

export type Project = {
  id: number;
  client_name: string;
  name: string;
  status: string;
  due_date: string;
};

export const projectColumns: ColumnDef<Project>[] = [
  {
    accessorKey: "client_name",
    header: "Client Name",
  },
  {
    accessorKey: "name",
    header: "Project Name",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "due_date",
    header: "Due Date",
    cell: ({ getValue }) => {
      const date = new Date(getValue() as string);
      return date.toLocaleDateString();
    },
  },
];