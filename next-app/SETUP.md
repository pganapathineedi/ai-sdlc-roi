# Setup Guide

## 1. Create Salesforce Connected App

1. Log in to your Salesforce org → Setup → **App Manager** → **New Connected App**
2. Fill in:
   - **Connected App Name**: AI SDLC ROI Tool
   - **API Name**: AI_SDLC_ROI_Tool
   - **Contact Email**: your email
3. Check **Enable OAuth Settings**
4. **Callback URL** (add both for dev + prod):
   ```
   http://localhost:3000/api/sf/callback
   https://your-vercel-app.vercel.app/api/sf/callback
   ```
5. **Selected OAuth Scopes**: `api`, `refresh_token`
6. Uncheck **Require Secret for Web Server Flow** (leave unchecked for server-side flow)
7. Save → wait ~10 minutes for activation
8. Copy the **Consumer Key** (= `SF_CLIENT_ID`) and **Consumer Secret** (= `SF_CLIENT_SECRET`)

## 2. Local development

```bash
cp .env.local.example .env.local
# Fill in your values, then:
npm run dev
```

Visit `http://localhost:3000`

## 3. Deploy to Vercel

```bash
# First time
npx vercel --cwd .

# Or via GitHub: push to main, then in Vercel dashboard:
# - New Project → Import repo
# - Root Directory: next-app
# - Set environment variables (see below)
```

## 4. Vercel environment variables

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Value |
|---|---|
| `SF_CLIENT_ID` | Consumer Key from Connected App |
| `SF_CLIENT_SECRET` | Consumer Secret from Connected App |
| `SF_CALLBACK_URL` | `https://your-app.vercel.app/api/sf/callback` |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `SESSION_SECRET` | Random 32-char string |

After adding env vars, redeploy.

## 5. Update Connected App callback URL

After Vercel gives you a URL, go back to your Connected App and add:
```
https://your-app.vercel.app/api/sf/callback
```
