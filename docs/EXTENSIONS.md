# Extensions

Extend Buselligence with plugins via the Extension SDK.

## Extension SDK

```typescript
import { createBuselligencePlugin } from '@buselligence/sdk';

export default createBuselligencePlugin({
  name: "Salesforce Agent",
  version: "1.0.0",
  tools: [
    { name: "query_accounts", description: "Query Salesforce accounts" },
    { name: "create_opportunity", description: "Create a new opportunity" },
  ],
  agents: ["sales_analyst"],
  skills: ["analyze-database"],
  permissions: ["read:crm", "write:crm"],
  onInstall: async (ctx) => {
    ctx.log("Salesforce Agent installed");
  },
});
```

## Hooks

- `onInstall` — plugin setup
- `onUninstall` — cleanup
- `onExecute` — intercept kernel execution
- `onTrace` — observability hooks

## Register extensions

```bash
POST /api/kernel/extensions
Content-Type: application/json

{
  "name": "My Plugin",
  "version": "1.0.0",
  "tools": [{ "name": "my_tool", "description": "..." }]
}
```

View SDK spec: `GET /api/kernel/sdk`

## Plugin architecture

```
Extension Manifest
    ↓
validateExtension()
    ↓
Register in kernel_extensions table
    ↓
Tools available in kernel execution layer
```

## Community plugins

The community hub (`/api/kernel/community`) is architected for plugin sharing. Publish via community contributions.
