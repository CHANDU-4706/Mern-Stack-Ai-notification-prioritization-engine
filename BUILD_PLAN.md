# Architecture Execution Plan

This document outlines the step-by-step execution for building the CyePro Notification Prioritization Engine across both the MERN and Spring Boot stacks.

## Execution Strategy & Stack Management
**How I managed building two stacks in parallel without losing coherence:**
I adopted an API-first contract approach. Before writing any business logic, I designed the exact JSON payload shapes for the `/api/events` and `/api/rules` endpoints. I completed the MERN backend first to establish the baseline unit tests and exact data structures. Then, I translated the Express routing and Mongoose schemas directly into Spring `@RestController`s and JPA `@Entity` classes. This ensured the Next.js frontends (which share 90% of their UI components) could swap between local port `5000` (MERN) and `8082` (Spring Boot) seamlessly without data binding errors.

---

## Day 1: Foundation, Data Layer, and Core Pipeline

**What I planned to build:**
- Database schemas for MongoDB and PostgreSQL.
- The 4 preliminary classification stages (Exact Dedupe, Semantic Dedupe, Fatigue, Rules).
- Fail-safe infrastructure (Circuit breaker).

**What I actually built:**
- Successfully implemented the Mongoose schemas and Spring JPA Entities.
- Built the Sorensen-Dice bi-gram calculator for semantic deduplication.
- Created the manual Opossum-style circuit breaker logic natively in both Node and Java.

**How I approached the database design first and why:**
Database design dictates the entire pipeline's performance. Because the requirement heavily relies on historical lookups (e.g., finding identical events in the last 5 minutes, or counting events in the last hour for fatigue), the data layer *had* to be finalized first. I optimized the MongoDB `$match` and Postgres `WHERE` clauses on `user_id` and `created_at` before writing any algorithm code to guarantee the $O(N)$ string comparisons didn't scan the entire database, but only a bounded subset.

**How I validated the core decision pipeline before connecting AI:**
Connecting a non-deterministic LLM immediately makes debugging impossible. I temporarily stubbed the AI service to return a hardcoded `{"decision": "NOW", "reason": "Mocked AI"}`. With the LLM removed as a variable, I wrote a PowerShell stress-test script that injected 6 rapid identical payloads. This allowed me to definitively prove that Stage 1 (Exact Dedupe) and Stage 3 (Alert Fatigue) were accurately intercepting events and writing `DROPPED` or `LATER` to the `AuditLog` without interference from external network latency.

**How I handled the fail-safe architecture — when you built it and why at that point:**
I built the fallback `getFallbackDecision()` method and the `failureCount` thresholds *immediately after* the core pipeline, *but right before* integrating the real Groq SDK. Building failure resistance *last* often leads to it being a brittle afterthought. By building the circuit breaker while the AI was still mocked, I could artificially throw exceptions and verify the fallback logic safely engaged, routing critical events to `NOW` and non-critical to `LATER`, before dealing with real HTTP timeouts.

---

## Day 2: AI Integration, UI, and Final Polish

**What I planned to build:**
- Connect Groq LLaMA 3.3.
- Build the 7 Next.js UI screens.
- Deploy the system.

**What I actually built:**
- Successfully connected Groq with the dynamic JSON prompt array.
- Built highly polished, mobile-responsive Next.js frontends featuring 'Glassmorphism' UI and distinct branding (Amber for MERN, Emerald for Java).
- Identified and fixed a camelCase vs snake_case mismatch (`ruleName` vs `rule_name`) between the React UI and the Java backend.

**How I sequenced frontend development against backend readiness:**
I blocked UI development entirely until the backend `/api/events` and `/api/metrics` endpoints were reliably returning `HTTP 200/202` with correctly structured JSON. Once the backend was feature-complete and stress-tested via Postman/cURL, I rapidly built the React components using Axios to consume those exact endpoints. This prevented the common trap of building mock UIs that break as soon as real data is introduced.

**Decisions made or changed along the way:**
I originally planned to use H2 (an in-memory DB) for the Spring Boot backend to make local execution frictionless. However, recognizing the rubric's strict mandate for "production-grade persistence" and "concurrent writes," I refactored the Spring Boot application configuration to connect to a fully managed **Neon Serverless PostgreSQL** database. This added 2 hours of migration debugging but guaranteed data survived application restarts.

**What I would do differently if I started again:**
Instead of computing the Sorensen-Dice coefficient at runtime for every event in the Node/Java memory space, I would calculate a `MinHash` signature at the point of ingestion and store it as a dedicated column/field. I would then use PostgreSQL's `pg_trgm` extension or MongoDB's text indexes to offload the string similarity calculation entirely to the database engine, vastly improving scalability.
