export interface SemanticMetric {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  formula: string;
  unit: string | null;
  category: string | null;
  sources: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SemanticRelationship {
  id: string;
  name: string;
  description: string | null;
  fromEntity: string;
  toEntity: string;
  relationshipType: string;
  joinKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SemanticRule {
  id: string;
  name: string;
  description: string | null;
  ruleType: "filter" | "definition" | "transformation";
  expression: string;
  appliesTo: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SemanticMetricInput {
  name: string;
  displayName: string;
  description?: string;
  formula: string;
  unit?: string;
  category?: string;
  sources?: string[];
  tags?: string[];
}

export interface SemanticRelationshipInput {
  name: string;
  description?: string;
  fromEntity: string;
  toEntity: string;
  relationshipType?: string;
  joinKey?: string;
}

export interface SemanticRuleInput {
  name: string;
  description?: string;
  ruleType?: "filter" | "definition" | "transformation";
  expression: string;
  appliesTo?: string[];
  enabled?: boolean;
}

export const DEFAULT_METRICS: SemanticMetricInput[] = [
  {
    name: "revenue",
    displayName: "Revenue",
    description: "Total recognized revenue for the period",
    formula: "SUM(subscriptions.mrr) + SUM(usage_charges.amount)",
    unit: "USD",
    category: "Financial",
    sources: ["stripe.subscriptions", "salesforce.opportunities"],
    tags: ["core", "financial"],
  },
  {
    name: "active_customers",
    displayName: "Active Customers",
    description: "Count of customers with active subscriptions",
    formula: "COUNT(DISTINCT customers.id) WHERE subscription.status = 'active'",
    unit: "count",
    category: "Growth",
    sources: ["stripe.customers", "salesforce.accounts"],
    tags: ["core", "growth"],
  },
  {
    name: "churn",
    displayName: "Churn",
    description: "Revenue lost from cancelled subscriptions",
    formula: "SUM(cancelled_subscriptions.mrr) WHERE cancelled_at IN period",
    unit: "USD",
    category: "Retention",
    sources: ["stripe.subscriptions"],
    tags: ["core", "retention"],
  },
  {
    name: "pipeline",
    displayName: "Pipeline",
    description: "Total value of open opportunities",
    formula: "SUM(opportunities.amount) WHERE stage NOT IN ('Closed Won', 'Closed Lost')",
    unit: "USD",
    category: "Sales",
    sources: ["salesforce.opportunities", "hubspot.deals"],
    tags: ["core", "sales"],
  },
  {
    name: "cac",
    displayName: "CAC",
    description: "Customer Acquisition Cost",
    formula: "SUM(marketing_spend.amount) / COUNT(new_customers.id)",
    unit: "USD",
    category: "Efficiency",
    sources: ["google_analytics.campaigns", "stripe.customers"],
    tags: ["core", "efficiency"],
  },
  {
    name: "nrr",
    displayName: "Net Revenue Retention",
    description: "Revenue retained and expanded from existing customers",
    formula: "(Starting Revenue - Churn - Contraction + Expansion) / Starting Revenue",
    unit: "%",
    category: "Retention",
    sources: ["stripe.subscriptions", "salesforce.accounts"],
    tags: ["core", "retention", "saas"],
  },
];

export const DEFAULT_RELATIONSHIPS: SemanticRelationshipInput[] = [
  {
    name: "customer_to_account",
    description: "Stripe customer maps to Salesforce account",
    fromEntity: "Customer",
    toEntity: "Account",
    relationshipType: "one_to_one",
    joinKey: "customer.external_id = account.stripe_customer_id",
  },
  {
    name: "account_to_subscription",
    description: "Account has many subscriptions",
    fromEntity: "Account",
    toEntity: "Subscription",
    relationshipType: "one_to_many",
    joinKey: "account.id = subscription.account_id",
  },
  {
    name: "subscription_to_revenue",
    description: "Subscription generates revenue",
    fromEntity: "Subscription",
    toEntity: "Revenue",
    relationshipType: "one_to_many",
    joinKey: "subscription.id = revenue.subscription_id",
  },
];

export const DEFAULT_RULES: SemanticRuleInput[] = [
  {
    name: "exclude_test_accounts",
    description: "Exclude internal and test accounts from all metrics",
    ruleType: "filter",
    expression: "account.email NOT LIKE '%@test.%' AND account.is_test = false",
    appliesTo: ["revenue", "active_customers", "churn", "nrr", "cac"],
    enabled: true,
  },
  {
    name: "recognize_revenue_monthly",
    description: "Recognize subscription revenue monthly",
    ruleType: "transformation",
    expression: "revenue.amount = subscription.mrr / days_in_month * days_active",
    appliesTo: ["revenue", "nrr"],
    enabled: true,
  },
  {
    name: "enterprise_definition",
    description: "Enterprise customers have more than 500 employees",
    ruleType: "definition",
    expression: "account.employee_count > 500 OR account.segment = 'Enterprise'",
    appliesTo: ["pipeline", "revenue", "nrr"],
    enabled: true,
  },
];
