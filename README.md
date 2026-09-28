# skill-discovery-tool
Describe what you're building, get matched to real existing skills that could help.

## Run it locally

Needs Node 18 or newer. No dependencies to install.

```
npm run dev
```

The first time, the terminal asks for your API keys (typing is hidden), checks each one, and saves them to `.env.local`, which is gitignored. Only the Groq key is required. Run `npm run setup` any time to change them. Then open http://localhost:5173.

## How search works

`api/search.js` reads your answers with an AI model (Groq, with Gemini as a backup), searches GitHub for matching Claude skills, Cursor rules and MCP servers, then ranks what it finds by fit, stars and recent activity. Keys stay on the server and are never sent to the browser.
