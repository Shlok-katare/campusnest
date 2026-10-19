# Deploying CampusNest

Three pieces: **Postgres** (Neon) + **API** (Render, from `backend/`) + **website** (Vercel, from `frontend/`).
Everything below has a free tier. Do the steps in this order, because each one needs a value from the last.

## 0. Check it builds on your machine first
```bash
cd backend && ./mvnw test        # or: mvn test
cd ../frontend && npm install && npm run build
```
(The Java backend could not be compiled in the environment this was prepared in, so this is the first real
compile. If `mvn` prints an error, send it to me.)

## 1. Database (Neon)
1. Create a project at neon.tech. Copy the connection details.
2. Build the JDBC URL from them:
   `jdbc:postgresql://<host>/<dbname>?sslmode=require`
   Keep the username and password separate. Do not put them in the URL.

## 2. API (Render)
1. Push this repo to GitHub.
2. Render > New > Blueprint > pick the repo. It reads `render.yaml`.
3. Fill in `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`. Leave `CORS_ORIGINS` as a placeholder for now.
4. After the first deploy, open `https://<your-service>.onrender.com/api/health`. You should see `{"status":"UP"}`.
5. Render > Environment > copy the generated `ADMIN_KEY`. You type it into the Verification Hub to approve listings.

Free Render services sleep after ~15 minutes idle, so the first request after a break takes ~30-60 s.
The site shows a "waking up" message for that case.

## 3. Website (Vercel)
1. Vercel > Add New Project > pick the repo, set **Root Directory** to `frontend`. Framework preset: Vite.
2. Add the environment variable `VITE_API_URL` = your Render URL (no trailing slash).
3. Deploy, then copy the Vercel URL.

## 4. Close the loop
Back in Render, set `CORS_ORIGINS` to your Vercel URL, for example `https://campusnest.vercel.app`.
To also allow Vercel preview deployments use `https://campusnest.vercel.app,https://*.vercel.app`.
Render redeploys automatically. Without this step the browser blocks every API call.

## Local development
```bash
# backend (needs Postgres running locally)
export DB_PASSWORD=your_local_password
export ADMIN_KEY=dev-key
cd backend && ./mvnw spring-boot:run

# frontend
cd frontend && cp .env.example .env.local && npm run dev
```

## Before real users
- **Payments:** the "token" is recorded in the database but no money moves. Integrate Razorpay before charging anyone.
- **Logins:** there are no user accounts. Anyone can post a listing. The Verification Hub is protected only by `ADMIN_KEY`.
- **Demo data:** set `SEED_DEMO_DATA=false` once you have real listings.
- **Schema changes:** `DDL_AUTO=update` is fine to start. Move to Flyway migrations before the data matters.
