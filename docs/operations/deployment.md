# Frontend Deployment

## Backend Environment Variable

Set this in the frontend hosting provider before deploying:

```bash
VITE_API_BASE_URL=https://<backend-host>/api/v1
```

Use the public backend URL and keep the `/api/v1` suffix.

Production uses the same-origin `/api/v1` URL. A Vercel edge proxy forwards those requests to the `BACKEND_ORIGIN` deployment setting without changing the backend or requiring browser CORS access.

## Build

```bash
npm ci
npm run build
```

The build rejects malformed public backend URLs. Missing or localhost deployment values use the same-origin `/api/v1` fallback so they do not block the static frontend deployment.

## Hosting Notes

- Vercel can deploy from the repository root using the root `vercel.json`.
- Vercel can also deploy with the project Root Directory set to `frontend`, which uses `frontend/vercel.json`.
- Netlify uses `netlify.toml`.
- Railway can deploy this frontend from the `frontend` directory using `railway.json`.

## Backend CORS

Set this on the Railway backend service after the frontend URL exists:

```bash
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
```

For multiple domains, use commas:

```bash
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com,https://your-preview-domain.vercel.app
```
