# Deployment Guide — Mini D-Mart

## Recommended setup

Deploy the project as two services:

- **Backend:** Render Web Service → `server/`
- **Frontend:** Vercel → `client/`
- **Database:** MongoDB Atlas

## 1. Push to GitHub

From the project root:

```bash
git init
git add .
git commit -m "Final Mini D-Mart assessment build"
git branch -M main
git remote add origin <YOUR_GITHUB_REPOSITORY_URL>
git push -u origin main
```

Never commit `server/.env` or `client/.env`.

## 2. Deploy the backend on Render

Create **New → Web Service** and select the GitHub repository.

Use:

| Setting | Value |
|---|---|
| Root Directory | `server` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/` |

Add these environment variables in Render:

```text
PORT=10000
CLIENT_URL=https://YOUR-FRONTEND.vercel.app
MONGO_URI=<YOUR_MONGODB_ATLAS_URI>
JWT_SECRET=<LONG_RANDOM_SECRET>
JWT_EXPIRES_IN=7d
```

Render supplies the public HTTPS URL after deployment. The Express server uses `process.env.PORT`.

### Seed the database

For a fresh assessment database, run the seed script once from a local machine using the same MongoDB Atlas URI:

```bash
cd server
npm install
npm run seed
```

Do **not** run the seed on every deployment because the script is intended to initialize demo users/products.

## 3. Deploy the frontend on Vercel

Create a new Vercel project from the same GitHub repository.

Set the project root directory to:

```text
client
```

Vercel should detect Vite automatically. Use:

```text
Build Command: npm run build
Output Directory: dist
```

Add:

```text
VITE_API_URL=https://YOUR-BACKEND.onrender.com/api
```

Redeploy after saving the environment variable.

The included `vercel.json` rewrites SPA routes back to `index.html`, so `/customer`, `/staff`, `/manager`, and `/admin` work on direct refresh.

## 4. Update backend CORS

Once Vercel gives you the final URL, update Render:

```text
CLIENT_URL=https://your-final-project.vercel.app
```

Then redeploy the backend.

## 5. Final production test

Open the public frontend and test:

1. Customer login
2. Browse/search products
3. Add to cart
4. Checkout
5. Place delivery order
6. Staff login
7. Update order status
8. Manager dashboard
9. Admin dashboard
10. Audit trail
11. Refresh a protected route directly
12. Verify unauthorized role access is rejected

## 6. Assessment submission

Submit:

- GitHub repository
- Public frontend URL
- README.md
- SECURITY.md
- `.env.example`
- Test credentials
- 5–10 minute explanation video
- Deployment/test evidence
- AI usage disclosure
