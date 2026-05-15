# Deployment Guide

## Frontend on Vercel

1. Import the `frontend` directory as a Vercel project.
2. Set `VITE_API_BASE_URL` to your backend URL ending in `/api/v1`.
3. Build command: `npm run build`
4. Output directory: `dist`

## Backend on Render

1. Create a new Blueprint or Web Service using `render.yaml`.
2. Add `DATABASE_URL`, `SECRET_KEY`, `FRONTEND_URL`, and SMTP variables.
3. Provision PostgreSQL in Supabase and run the SQL migration and seed.

## Backend on Railway

1. Point Railway to the `backend` directory.
2. Use `pip install -e .` as the build command.
3. Use `uvicorn app.main:app --host 0.0.0.0 --port $PORT` as the start command.

## Supabase

1. Open SQL Editor.
2. Run `database/migrations/001_init.sql`.
3. Run `database/seeds/demo_seed.sql`.
4. Copy the connection string into `DATABASE_URL`.

