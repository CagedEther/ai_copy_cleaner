# AI Copy Cleaner

AI Copy Cleaner is a Blocks Network agent that rewrites AI-generated copy into direct, specific, human-sounding text. It runs as a long-lived worker and returns the cleaned copy as a text artifact.

## Railway deployment

This repository is ready to deploy from GitHub on Railway. Railway reads `railway.json`, installs dependencies with `npm ci`, and starts the worker with `npm start`.

Required Railway variables:

- `BLOCKS_API_KEY`: API key for registering and running the Blocks agent.

Optional Railway variables:

- `BLOCKS_BACKEND_URL`: Blocks backend URL. Use `https://app.blocks.ai` if your Blocks setup requires it.
- `BLOCKS_CDM_URL`: Blocks config URL. The SDK defaults to `https://config.blocks.ai/config.json`.
- `LOG_LEVEL`: `error`, `warn`, `info`, or `debug`.

To deploy:

1. In Railway, create a new project.
2. Choose **Deploy from GitHub repo**.
3. Select `CagedEther/ai_copy_cleaner`.
4. Add the required variables in the Railway service variables tab.
5. Deploy the service.

## Local development

```sh
npm install
npm run check
npm start
```

To send a sample task from your local machine:

```sh
npm run trigger
```

Local `.env` files are ignored. Use `.env.example` as the variable checklist.
