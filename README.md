AI-powered chat application running entirely on Cloudflare’s edge network

This project is a lightweight conversational AI assistant built using Workers AI, Cloudflare Workers, and KV storage. It demonstrates how to deploy an AI-driven application at Internet scale with low latency, serverless workflows, and persistent memory.

Important technologies used:
AI Language model - Workers AI(Llama 3.3)
Request workflow - Cloudflare worker
Chat Interface - HTML + JS Interface
Persistent memory - Cloudflare KV
Deployment - Wrangler CLI

Architecture:
User (Browser)
     ↓
Cloudflare Worker (API + Routing)
     ↓
KV Storage (Memory per user)
     ↓
Workers AI (Llama 3.3 Inference)
     ↓
Response back to user

How to Run?
1. Install dependencies - npm install
2. Generate the id using "npx wrangler kv:namespace create CHAT_HISTORY" and paste it in wrangler.toml in kv_namespaces.
3. Do "npm run dev"
