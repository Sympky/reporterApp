"use client";

import { ColumnDef } from "@tanstack/react-table";

export type Client = {
  id: number;
  name: string;
  description: string;
};

export const columns: ColumnDef<Client>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "emails",
    header: "Emails",
  },
  {
    accessorKey: "phone_numbers",
    header: "Phone Numbers",
  },
  {
    accessorKey: "addresses",
    header: "Addresses",
  },
  {
    accessorKey: "website_urls",
    header: "Website URLs",
  },
];
