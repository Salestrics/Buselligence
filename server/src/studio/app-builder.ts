import type { AppBuilderResult } from "./types.js";

export function buildApp(prompt: string): AppBuilderResult {
  const lower = prompt.toLowerCase();
  const name = extractAppName(prompt);

  if (lower.includes("onboarding")) {
    return {
      name: name || "Customer Onboarding Tracker",
      pages: ["Dashboard", "Customers", "Tasks", "Reports"],
      tables: ["customers", "onboarding_steps", "users"],
      roles: ["Admin", "Manager", "Viewer"],
      files: [
        {
          path: "src/pages/Dashboard.tsx",
          content: `export function Dashboard() {\n  return <div>Onboarding Dashboard</div>;\n}`,
          language: "typescript",
        },
        {
          path: "src/pages/Customers.tsx",
          content: `export function Customers() {\n  return <div>Customer List</div>;\n}`,
          language: "typescript",
        },
        {
          path: "src/pages/Tasks.tsx",
          content: `export function Tasks() {\n  return <div>Onboarding Tasks</div>;\n}`,
          language: "typescript",
        },
        {
          path: "src/pages/Reports.tsx",
          content: `export function Reports() {\n  return <div>Onboarding Reports</div>;\n}`,
          language: "typescript",
        },
        {
          path: "schema/database.sql",
          content: `CREATE TABLE customers (id UUID PRIMARY KEY, company TEXT, status TEXT);
CREATE TABLE onboarding_steps (id UUID PRIMARY KEY, customer_id UUID, step_name TEXT, status TEXT);
CREATE TABLE users (id UUID PRIMARY KEY, email TEXT, role TEXT);`,
          language: "sql",
        },
        {
          path: "src/auth/roles.ts",
          content: `export const ROLES = ['admin', 'manager', 'viewer'] as const;\nexport type Role = typeof ROLES[number];`,
          language: "typescript",
        },
      ],
    };
  }

  if (lower.includes("inventory") || lower.includes("crm")) {
    return {
      name: name || "Business Management App",
      pages: ["Dashboard", "Inventory", "Customers", "Orders", "Analytics"],
      tables: ["products", "customers", "orders", "order_items", "users"],
      roles: ["Admin", "Manager", "Staff", "Viewer"],
      files: [
        {
          path: "src/pages/Dashboard.tsx",
          content: `export function Dashboard() { return <div>Business Dashboard</div>; }`,
          language: "typescript",
        },
        {
          path: "schema/database.sql",
          content: `CREATE TABLE products (id UUID PRIMARY KEY, name TEXT, sku TEXT, quantity INT);
CREATE TABLE customers (id UUID PRIMARY KEY, company TEXT, email TEXT);
CREATE TABLE orders (id UUID PRIMARY KEY, customer_id UUID, total DECIMAL, status TEXT);`,
          language: "sql",
        },
      ],
    };
  }

  return {
    name: name || "Custom App",
    pages: ["Dashboard", "Data", "Settings"],
    tables: ["records", "users"],
    roles: ["Admin", "Viewer"],
    files: [
      {
        path: "src/pages/Dashboard.tsx",
        content: `// ${prompt}\nexport function Dashboard() { return <div>Dashboard</div>; }`,
        language: "typescript",
      },
    ],
  };
}

function extractAppName(prompt: string): string | null {
  const match = prompt.match(/(?:build|create)\s+(?:me\s+)?(?:a\s+)?(.+?)(?:\s+app|\s+system|$)/i);
  return match?.[1]?.trim() ?? null;
}
