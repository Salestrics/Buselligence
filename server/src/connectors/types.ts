export type ConnectorCategory = "database" | "business_app" | "analytics";

export type ConnectorType =
  | "postgresql"
  | "mysql"
  | "snowflake"
  | "bigquery"
  | "redshift"
  | "salesforce"
  | "hubspot"
  | "stripe"
  | "quickbooks"
  | "shopify"
  | "google_analytics"
  | "zendesk";

export interface ConnectorDefinition {
  id: ConnectorType;
  name: string;
  category: ConnectorCategory;
  description: string;
  icon: string;
  configFields: Array<{
    key: string;
    label: string;
    type: "text" | "password" | "url";
    required?: boolean;
    placeholder?: string;
  }>;
  mcpPresetId?: string;
}

export interface DataConnectorPublic {
  id: string;
  name: string;
  connectorType: ConnectorType;
  enabled: boolean;
  lastTestedAt: string | null;
  lastTestOk: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface DataConnectorInput {
  name: string;
  connectorType: ConnectorType;
  config: Record<string, string>;
  enabled?: boolean;
}

export const CONNECTOR_DEFINITIONS: ConnectorDefinition[] = [
  { id: "postgresql", name: "PostgreSQL", category: "database", description: "Connect PostgreSQL or compatible databases", icon: "database", configFields: [{ key: "connectionString", label: "Connection string", type: "password", required: true, placeholder: "postgresql://user:pass@host:5432/db" }] },
  { id: "mysql", name: "MySQL", category: "database", description: "Connect MySQL databases", icon: "database", configFields: [{ key: "connectionString", label: "Connection string", type: "password", required: true, placeholder: "mysql://user:pass@host:3306/db" }] },
  { id: "snowflake", name: "Snowflake", category: "database", description: "Cloud data warehouse", icon: "database", configFields: [{ key: "account", label: "Account", type: "text", required: true }, { key: "warehouse", label: "Warehouse", type: "text" }, { key: "database", label: "Database", type: "text" }, { key: "username", label: "Username", type: "text" }, { key: "password", label: "Password", type: "password", required: true }] },
  { id: "bigquery", name: "BigQuery", category: "database", description: "Google BigQuery", icon: "database", configFields: [{ key: "projectId", label: "Project ID", type: "text", required: true }, { key: "serviceAccountJson", label: "Service account JSON", type: "password", required: true }] },
  { id: "redshift", name: "Redshift", category: "database", description: "Amazon Redshift", icon: "database", configFields: [{ key: "host", label: "Host", type: "text", required: true }, { key: "database", label: "Database", type: "text" }, { key: "username", label: "Username", type: "text" }, { key: "password", label: "Password", type: "password", required: true }] },
  { id: "salesforce", name: "Salesforce", category: "business_app", description: "CRM — accounts, opportunities, pipeline", icon: "cloud", configFields: [{ key: "instanceUrl", label: "Instance URL", type: "url", required: true }, { key: "clientId", label: "Client ID", type: "text" }, { key: "clientSecret", label: "Client Secret", type: "password", required: true }, { key: "refreshToken", label: "Refresh Token", type: "password" }], mcpPresetId: "salesforce" },
  { id: "hubspot", name: "HubSpot", category: "business_app", description: "Marketing & sales CRM", icon: "cloud", configFields: [{ key: "apiKey", label: "API Key", type: "password", required: true }] },
  { id: "stripe", name: "Stripe", category: "business_app", description: "Payments, subscriptions, revenue", icon: "credit-card", configFields: [{ key: "secretKey", label: "Secret Key", type: "password", required: true }], mcpPresetId: "stripe" },
  { id: "quickbooks", name: "QuickBooks", category: "business_app", description: "Accounting & financials", icon: "calculator", configFields: [{ key: "clientId", label: "Client ID", type: "text" }, { key: "clientSecret", label: "Client Secret", type: "password", required: true }, { key: "realmId", label: "Realm ID", type: "text" }] },
  { id: "shopify", name: "Shopify", category: "business_app", description: "E-commerce orders & revenue", icon: "shopping-bag", configFields: [{ key: "shopDomain", label: "Shop domain", type: "text", required: true }, { key: "accessToken", label: "Access Token", type: "password", required: true }] },
  { id: "google_analytics", name: "Google Analytics", category: "analytics", description: "Web traffic & conversion analytics", icon: "bar-chart", configFields: [{ key: "propertyId", label: "Property ID", type: "text", required: true }, { key: "serviceAccountJson", label: "Service account JSON", type: "password", required: true }] },
  { id: "zendesk", name: "Zendesk", category: "business_app", description: "Support tickets & CSAT", icon: "headphones", configFields: [{ key: "subdomain", label: "Subdomain", type: "text", required: true }, { key: "apiToken", label: "API Token", type: "password", required: true }, { key: "email", label: "Admin email", type: "text" }] },
];
