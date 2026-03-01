# MERN Stack Deployment Guide

This document outlines the steps to deploy the MERN Notification Prioritization Engine to the cloud.

## 🚀 Live URLs
- **Frontend (Vercel)**: `[PENDING_DEPLOYMENT]`
- **Backend (Render)**: `[PENDING_DEPLOYMENT]`

## 🛠️ Deployment Configuration

### 1. Backend (Render)
- **Runtime**: Node.js
- **Build Command**: `cd backend && npm install && npm run build`
- **Start Command**: `cd backend && npm start`
- **Environment Variables**:
  - `MONGO_URI`: Your MongoDB Atlas connection string.
  - `GROQ_API_KEY`: Your Groq API key.
  - `GROQ_MODEL`: `llama-3.3-70b-specdec`
  - `PORT`: 5000 (Render will override this automatically).
  - `NODE_ENV`: `production`

### 2. Frontend (Vercel)
- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Environment Variables**:
  - `NEXT_PUBLIC_API_URL`: The URL of your deployed Render backend (e.g., `https://your-app.onrender.com`).

## 🔑 Test Credentials
For reviewers, the login page displays these credentials directly:
- **Admin**: `admin@cyepro.com` / `admin123`
- **Operator**: `operator@cyepro.com` / `operator123`
