# Syncro

Monorepo: Spring Boot API in `backend/`, Next.js app in `frontend/`.

## Railway (backend)

1. In Railway, create a project and choose **Deploy from GitHub repo**.
2. Select **`saddamsheikh01/syncro`**. Leave **Root Directory** empty.
3. Click **+ New → Database → PostgreSQL**.
4. Open the **backend** service (not Postgres) → **Variables**.
5. Click **Add variable** / **Variable reference** and set:
   `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   If your database service has another name, pick that name instead of `Postgres`.
6. Redeploy the backend, then **Settings → Networking → Generate domain**.

The Docker image already sets `SPRING_PROFILES_ACTIVE=prod,railway`, health checks `/health`, and uses Railway's `PORT`. After it is live, point the local frontend at it:

```
# frontend/.env.local
NEXT_PUBLIC_API_BASE_URL=https://YOUR-SERVICE.up.railway.app
```

Then run `npm run dev` in `frontend/` and register a new user at http://localhost:3000/register.
