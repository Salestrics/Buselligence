# MCP Integrations

Buselligence acts as an **MCP client**. Connect Model Context Protocol servers to give the AI access to live data sources, files, databases, and custom tools during BI conversations.

## What is MCP?

The [Model Context Protocol](https://modelcontextprotocol.io/) is an open standard for connecting AI applications to external data and tools. MCP servers expose **tools** that language models can call during a conversation.

Buselligence:

1. Connects to your configured MCP servers
2. Lists available tools
3. Passes tools to your chosen AI provider (OpenAI, Anthropic, Google)
4. Executes tool calls and streams results back into the chat

## Supported transports

| Transport | Use case | Configuration |
|-----------|----------|---------------|
| **stdio** | Local processes (`npx`, `uvx`, binaries) | `command` + `args` |
| **sse** | Remote MCP over Server-Sent Events | `url` + optional `headers` |
| **http** | Remote MCP over streamable HTTP | `url` + optional `headers` |

Configure servers in the UI at **Settings → MCP servers** or via the API.

## Quick examples

### PostgreSQL (stdio)

```json
{
  "name": "Postgres",
  "transport": "stdio",
  "config": {
    "transport": "stdio",
    "stdio": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://user:password@localhost:5432/analytics"
      ]
    }
  }
}
```

### Filesystem (stdio)

```json
{
  "name": "Data Files",
  "transport": "stdio",
  "config": {
    "transport": "stdio",
    "stdio": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/path/to/your/data"
      ]
    }
  }
}
```

### Remote SSE server

```json
{
  "name": "Remote BI",
  "transport": "sse",
  "config": {
    "transport": "sse",
    "remote": {
      "url": "https://mcp.example.com/sse",
      "headers": {
        "Authorization": "Bearer your-token"
      }
    }
  }
}
```

## Tool namespacing

Tools from multiple servers are namespaced to avoid collisions:

```
postgres__query
data_files__read_file
```

The model sees descriptions prefixed with the server name, e.g. `[Postgres] Run a read-only SQL query`.

## Testing connections

Use the **Test** button in Settings or:

```bash
curl -X POST http://localhost:3001/api/mcp/servers/<id>/test \
  -H "Cookie: <session>" \
  --cookie-jar cookies.txt
```

A successful test returns the list of discovered tools.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/mcp/servers` | List user's MCP servers |
| `POST` | `/api/mcp/servers` | Create server |
| `PUT` | `/api/mcp/servers/:id` | Update server |
| `DELETE` | `/api/mcp/servers/:id` | Delete server |
| `POST` | `/api/mcp/servers/:id/test` | Test connection |

## Chat tool events

During chat, the SSE stream includes tool events:

```json
{ "type": "tool_call", "toolCall": { "id": "...", "name": "postgres__query", "arguments": {} } }
{ "type": "tool_result", "toolResult": { "toolCallId": "...", "content": "..." } }
{ "type": "status", "status": "Running postgres__query..." }
```

The chat UI displays these inline with assistant messages.

## BI workflow ideas

| MCP server | BI use case |
|------------|-------------|
| `@modelcontextprotocol/server-postgres` | Query warehouse / analytics DB |
| `@modelcontextprotocol/server-sqlite` | Local SQLite analysis |
| `@modelcontextprotocol/server-filesystem` | Read CSV, JSON, reports |
| Custom MCP server | Internal metrics API, CRM, billing |

## Building custom MCP servers

See the [MCP documentation](https://modelcontextprotocol.io/docs) to build servers for your internal data sources. Buselligence will discover and call any tools your server exposes.

## Security

- MCP servers run with the same OS permissions as the Buselligence server process
- stdio servers inherit the server's environment — restrict access in production
- Only the authenticated user who configured a server can use it
- Review MCP server source and permissions before connecting production data

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Connection timeout | Ensure `npx` / command is on PATH where the server runs |
| No tools found | Run Test in Settings; check MCP server logs |
| Tool errors in chat | Verify connection strings, credentials, and file paths |
| Remote SSE fails | Check URL, TLS, and auth headers |
