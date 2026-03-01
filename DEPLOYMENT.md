# Deployment Guide

This document outlines the production architecture and deployment strategy for the CyePro Notification Prioritization Engine across both the MERN and Spring Boot stacks.

## 🌍 Live URLs

### MERN Stack
- **Frontend (Vercel):** `[INSERT_MERN_VERCEL_URL]`
- **Backend (Render/Railway/AWS):** `[INSERT_MERN_BACKEND_URL]`
- **Health Endpoint:** `[INSERT_MERN_BACKEND_URL]/api/health`

### Spring Boot Stack
- **Frontend (Vercel):** `[INSERT_SPRING_VERCEL_URL]`
- **Backend (Render/Railway/AWS):** `[INSERT_SPRING_BACKEND_URL]`
- **Health Endpoint:** `[INSERT_SPRING_BACKEND_URL]/api/health`

*(Note: The databases are pre-seeded. Reviewers can log into either frontend instantly using the credentials displayed on the login screens).*

---

## ⚙️ Environment Variables Configuration

In production, environment variables are strictly managed via the hosting provider's secure secrets manager, never hardcoded in the repository.

### Frontends (Vercel)
Configured via `Vercel Dashboard -> Settings -> Environment Variables`:
- `NEXT_PUBLIC_API_URL`: Points to the respective live backend URL (e.g., `https://cyepro-mern-backend.up.railway.app/api`).

### MERN Backend
Configured via Cloud Provider Environment settings:
- `PORT`: Automatically assigned by the cloud provider.
- `MONGO_URI`: Hidden connection string pointing to the **MongoDB Atlas** serverless cluster.
- `GROQ_API_KEY`: Secret key for LLM access.

### Spring Boot Backend
Configured via Cloud Provider Environment settings:
- `SPRING_DATASOURCE_URL`: Hidden JDBC string pointing to the **Neon PostgreSQL** serverless instance.
- `SPRING_DATASOURCE_USERNAME` & `PASSWORD`: Secret credentials.
- `GROQ_API_KEY`: Secret key for LLM access.

---

## 🔄 Differences: Local vs. Production

1. **Database Persistence:** Locally, MERN uses `localhost:27017` and Spring Boot originally used an H2 in-memory RAM database. In production, both strictly utilize managed cloud instances (MongoDB Atlas and Neon PostgreSQL) to ensure data survives container restarts and scales securely.
2. **CORS Configuration:** Locally, CORS is set to `*` to allow trivial cross-port communication (`3000` -> `5000` or `3001` -> `8082`). In production, the Spring Boot and Express CORS filters are strictly locked down to only accept requests originating from their specific Vercel frontend URLs to prevent cross-site request forgery.
3. **Threading & Process Management:** Locally, the Express backend runs via `npm run dev` (nodemon). In production, it runs via `node server.js` to ensure stability without file-watching overhead.

---

## ☁️ Cloud Architecture & Redeployment

### Platform Strategy
- **Frontends:** Vercel was chosen for both Next.js applications because of its zero-config deployment pipeline, global CDN edge caching, and native Server-Side Rendering (SSR) optimization for React.
- **Databases:** MongoDB Atlas and Neon PostgreSQL were chosen because they provide Serverless auto-scaling and automatic daily backups out-of-the-box.
- **Backends:** `[UPDATE_ONCE_DEPLOYED]`

### How to Trigger a Redeployment
Both stacks are connected via continuous deployment (CI/CD) to their respective GitHub hooks.
1. Any code changes merged or pushed directly to the `main` branch of the respective GitHub repository will automatically trigger a new build.
2. **Frontend:** Vercel automatically invalidates the CDN cache and pushes the new bundle live within ~60 seconds.
3. **Backend:** Rebuilds the container and performs a zero-downtime rolling update.
