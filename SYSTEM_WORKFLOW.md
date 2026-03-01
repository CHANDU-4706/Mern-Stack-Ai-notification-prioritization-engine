# System Workflow

This document describes exactly how the CyePro Notification Prioritization Engine operates at runtime across both MERN and Spring Boot stacks.

## 1. Happy Path — Event Submission
**From UI submission to dashboard update:**
1. The operator submits a JSON payload via the Event Simulator UI (`http://localhost:3000/simulator` or `3001`).
2. The Frontend makes an HTTP POST request to the backend `/api/events` endpoint.
3. **Synchronous Ingestion:** The backend creates a new `NotificationEvent` record in the database with a status of `PENDING` and immediately returns an `HTTP 202 Accepted` response with the `event_id`. The UI Simulator shows a success toast.
4. **Asynchronous Processing:** A background thread (Spring `@Async`) or Node Event Loop promise begins processing the event through the 5-stage pipeline.
5. The event passes Exact Deduplication, Near-Duplicate Detection, Alert Fatigue, and Custom Rules without triggering a bypass.
6. The engine makes a REST call to the Groq LLaMA 3.3 API.
7. The AI responds with JSON containing a `decision` (e.g., `NOW`) and a `reason`.
8. The backend updates the `NotificationEvent` status to `PROCESSED`.
9. The backend writes an immutable `AuditLog` entry linking the `event_id`, the AI's reason, and the engine used (`AI_ENGINE`).
10. The Live Dashboard and Metrics charts, which poll the `/api/metrics` and `/api/audit-logs` endpoints, refresh to display the new `NOW` decision and the incremented AI Processed count.

## 2. Failure Path — AI Service Unavailable
**When the AI call fails:**
1. An event arrives and passes all pre-AI filters (Steps 1-5 above).
2. The engine attempts to call the Groq API.
3. The API request times out or returns a 5xx error. An internal `failureCount` is incremented.
4. **Retry Logic:** The engine catches the exception. In our evaluation setup, it immediately flags a failure without complex exponential backoff to ensure rapid UX visualization of the fail-safe.
5. Once `failureCount` hits the threshold (3 failures), the **Circuit Breaker** status flips to `OPEN`.
6. Subsequent events bypass the AI API entirely.
7. **Fallback:** The event is routed to the explicit `getFallbackDecision()` method.
8. If the event's `source` is "SECURITY" or `priority_hint` is "critical", the fallback decision is `NOW`. Otherwise, it defaults to `LATER`.
9. The `AuditLog` is written with `is_fallback = true` and `engine_used = FALLBACK_ENGINE`.
10. The Health endpoint `/api/health` reports the circuit as `OPEN (Failing)`.
11. The Dashboard UI displays a degraded health status indicator in red.

## 3. LATER Queue Processing
**How deferred events are handled:**
1. An event is classified as `LATER` (either by AI, a Custom Rule, or Fallback).
2. The event is saved with `status = LATER_QUEUE` and an `expires_at` timestamp set to 5 minutes in the future.
3. **Background Job:** In MERN, an `Agenda` job runs every 60 seconds. In Spring Boot, a method annotated with `@Scheduled(fixedRate = 60000)` executes every 60 seconds.
4. The job queries the database for all events where `status = 'LATER_QUEUE'`.
5. It iterates through the results. If `event.expires_at < current_time`, it updates the status to `PROCESSED` and sets `delivered_at = current_time`.
6. If the database update fails, the event remains in the `LATER_QUEUE` and will be picked up again on the next 60-second polling cycle.
7. (A production environment would delete the event from the database entirely and push it to a delivery microservice, but for this simulation, marking it `PROCESSED` completes its lifecycle).

## 4. Rule Change Flow
**Admin edits from the UI:**
1. An admin navigates to the Rules Manager UI and toggles a rule off, or creates a new rule (e.g., `source == 'MARKETING'` -> `DROPPED`).
2. The UI sends an HTTP POST or PATCH to the `/api/rules` endpoint.
3. The backend updates the `Rule` record in the database (or creates a new one).
4. Because the classification pipeline queries the database for `activeRules` *at runtime for every event*, there is no caching layer to invalidate.
5. The very next event submitted will be evaluated against the newly updated rules instantly.
6. If the rule matches, the event bypasses the AI, receives the rule's specified decision, and logs `engine_used = RULE_ENGINE`.

## 5. Deduplication Flow
**Handling near-duplicate bursts:**
1. An event arrives (e.g., "High memory usage on node a").
2. Five seconds later, an almost identical event arrives ("High memory usage on node b").
3. The pipeline queries the database for the user's events within the last 1 hour.
4. **Stage 1 (Exact):** It checks for an exact match. It fails.
5. **Stage 2 (Semantic):** It runs the Sorensen-Dice algorithm comparing the new message bi-grams against the previous message bi-grams.
6. The calculated similarity score is 0.92 (92%).
7. Because 0.92 > the 0.85 threshold, the engine immediately halts pipeline execution.
8. The backend writes an `AuditLog` entry with the decision `DROPPED` and the reason `Near-duplicate of event [id] (similarity: 92.0%)`.
9. The event never reaches the AI logic or the Alert Fatigue counter.
