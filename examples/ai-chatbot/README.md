# AI Chatbot

Conversational AI with memory and tool use, powered by the Buselligence Kernel.

## Skills

- `teach-concept`

## Agents

- `universal_assistant`

## Getting started

```bash
# Install skills via kernel
# POST /api/kernel/skills/{id}/install

# Execute chat through kernel
# POST /api/kernel/execute
# { "action": "chat", "input": { "message": "Hello" }, "agentId": "universal_assistant" }
```

## Structure

```
ai-chatbot/
├── README.md
├── buselligence.lock   # Generate via kernel
└── src/
    └── chat.ts         # Kernel-integrated chat handler
```
