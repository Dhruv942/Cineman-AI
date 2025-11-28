# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Create a `.env.local` file in the root directory with:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   PERPLEXITY_API_KEY=your_perplexity_api_key_here
   ```
3. Run the app:
   `npm run dev`

## Deploy on Render

### Setting Environment Variables in Render:

1. Go to your Render dashboard
2. Select your service
3. Go to **Environment** tab
4. Add these environment variables:
   - `GEMINI_API_KEY` = your Gemini API key
   - `PERPLEXITY_API_KEY` = your Perplexity API key
5. Save and redeploy

**Important:** Environment variables must be set in Render dashboard **before** building. The build process reads these variables and injects them into the bundle.
