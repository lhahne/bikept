# LLM-Powered Zwift Workout Generator

A web app that turns natural-language workout prompts (for example, `30 min zone 2` or `40 min threshold workout`) into structured workouts with:

- Warmup
- Main set
- Cooldown
- On-screen time-vs-effort visualization
- Downloadable Zwift `.zwo` files

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Optional LLM integration

Set an OpenAI API key to power generation with an LLM:

```bash
export OPENAI_API_KEY=your_key_here
export OPENAI_MODEL=gpt-4.1-mini # optional
npm start
```

Without an API key, the app uses built-in workout logic as a fallback.

## Project structure

- `src/app.js` - Express app factory/middleware wiring
- `src/server.js` - server bootstrap
- `src/routes/workout-routes.js` - API endpoint handlers
- `src/services/workout-planner.js` - deterministic planner + sanitization
- `src/services/llm.js` - OpenAI Responses API integration
- `src/services/zwift.js` - `.zwo` XML generation
- `public/` - frontend UI assets

## Tests

```bash
npm test
```

Includes:
- Backend unit tests (`test/backend/workout-planner.test.js`)
- Backend integration tests (`test/backend/api.integration.test.js`)
- Frontend unit/integration-style tests in jsdom (`test/frontend/app.test.js`)
