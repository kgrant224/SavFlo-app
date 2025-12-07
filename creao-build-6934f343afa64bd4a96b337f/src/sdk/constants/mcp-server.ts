export type McpServerId = keyof typeof MCP_SERVERS;

// { "mcp-id": { id: string, name: string, url: string } }
export const MCP_SERVERS = {
  "68833992ee9e1a9340d83b64": {
    "id": "68833992ee9e1a9340d83b64",
    "name": "Miro",
    "url": "https://backend.composio.dev/v3/mcp/5d90f876-d280-44f8-a343-13888b153d6a/mcp?user_id=6934d32689dfb99c8f5f08b2"
  },
  "686de48c6fd1cae1afbb55ba": {
    "id": "686de48c6fd1cae1afbb55ba",
    "name": "GoogleSheets",
    "url": "https://backend.composio.dev/v3/mcp/01b46296-8ea1-4686-a211-87ba79800a99/mcp?user_id=6934d32689dfb99c8f5f08b2"
  },
  "686de4616fd1cae1afbb55b9": {
    "id": "686de4616fd1cae1afbb55b9",
    "name": "Notion",
    "url": "https://backend.composio.dev/v3/mcp/4c5f76f7-bbb8-4a8a-a478-ab5a2d7b0fa2/mcp?user_id=6934d32689dfb99c8f5f08b2"
  }
};