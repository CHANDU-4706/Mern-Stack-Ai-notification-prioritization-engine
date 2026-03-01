# Architecture Decisions (ADR)

## Decision 1 — Near-Duplicate Detection
**Which approach did you use to detect near-duplicate notifications? Why did you choose it over other options? What are its failure cases and at what scale does it break down?**
We implemented Semantic Deduplication using the **Sorensen-Dice coefficient** with bigrams. This approach calculates the overlap of consecutive character pairs between two strings. 
*Why this over others:* Unlike Levenshtein distance (which measures character edits and is computationally heavy for long texts) or simple exact matching (which fails on slight variations like timestamp changes), Sorensen-Dice is fast, robust against word reordering, and highly effective for standard notification formats. We set a >85% similarity threshold.
*Failure cases & Scale breaks:* It struggles with semantically different sentences that happen to share many bigrams (e.g., "Server up" vs "Server down" might score artificially high if padded with identical boilerplate). At massive scale, comparing every new event against *all* recent events using Sorensen-Dice becomes an $O(N)$ operation per insertion. To mitigate this, we strictly limit the comparison window to the last 1 hour of events for the *specific user*, bounding $N$ to a negligible size. At extreme scale, this would break down if a single user receives thousands of events per hour, requiring LSH (Locality-Sensitive Hashing) like MinHash instead.

## Decision 2 — Asynchronous AI Processing
**Why does AI processing happen asynchronously in your design? What would break or degrade if it were synchronous? What tradeoff does async introduce and how does your system handle it?**
AI processing is fundamentally non-deterministic in its execution time; LLMs can take anywhere from 500ms to 5 seconds to generate tokens. If processing were synchronous, the ingestion API would block the client (or internal microservices) waiting for the AI response. 
*What would break:* During traffic spikes, synchronous AI calls would exhaust the server's connection pool, causing upstream systems to timeout and potentially trigger cascading failures across the alerting infrastructure. 
*Tradeoffs:* Asynchronous processing introduces *eventual consistency*. The client submits the event and is immediately acknowledged (HTTP 202), but the exact classification (`NOW` vs `LATER`) isn't instantly available. We handle this tradeoff by decoupling ingestion from processing: the event is placed in a `PENDING` state, processed by a background worker/thread, and the frontend Dashboard dynamically updates via polling (or WebSockets) once the audit log is written.

## Decision 3 — Database Model Choices
**You built the same system on MongoDB and on a relational database. For this specific problem, where did MongoDB's document model help you? Where did the relational model help you? Where did each one make your life harder?**
*Where MongoDB helped:* Notification events are inherently unstructured and subject to change. MongoDB's document model allowed us to store arbitrary metadata payloads alongside the event without rigid schema migrations. 
*Where Relational helped:* Spring Boot with PostgreSQL (Relational) excelled in strict data integrity and structured querying, especially for the Audit Log and Rules engine, where foreign key relationships (Event -> User -> Audit) provide strong guarantees against orphaned records.
*Where each made life harder:* MongoDB made transactional, multi-document updates (like updating an Event status and writing an Audit Log simultaneously) more complex, requiring explicit transaction blocks. The relational model made life harder when dealing with dynamic, nested JSON payloads in the `metadata` field, forcing us to serialize it as a JSONB string rather than treating it as a native, searchable sub-document as easily as MongoDB does.

## Decision 4 — Failure Handling Thresholds
**Your system stops calling the AI service after a certain number of failures in a certain time window. What numbers did you choose and why? What happens to the system if those thresholds are too low? Too high?**
We implemented a Circuit Breaker pattern with a threshold of **3 consecutive failures**.
*Why 3?* One failure could be a transient network blip. Two could be unlucky timing. Three consecutive failures indicate a systemic issue with the LLM provider (e.g., rate limiting or outage). This provides a rapid failover mechanism without being overly sensitive.
*If too low (e.g., 1 failure):* The circuit would trip constantly on minor network jitters, bypassing the expensive/accurate AI engine unnecessarily and flooding the fallback rules, resulting in sub-optimal `LATER` classifications.
*If too high (e.g., 10 failures):* The system would continue to hammer a dead API, wasting compute resources and causing massive latency spikes for up to 10 events before finally engaging the fail-safe, degrading the user experience significantly.

## Decision 5 — LATER Queue Design
**Why did you use a scheduled background job to process deferred events instead of an event-driven approach? What does the time interval you chose trade off? Under what conditions would you switch to a different approach?**
We used a background polling scheduler (Agenda in MERN, `@Scheduled` in Spring Boot) scanning the `LATER` queue.
*Why?* Notifications classified as `LATER` are, by definition, low priority. An event-driven approach (like a Delay Exchange in RabbitMQ or AWS SQS visibility timeouts) adds significant architectural complexity and infrastructure dependency for a simple "batch these until later" requirement.
*Tradeoffs:* Polling every 1 minute trades off *latency for simplicity*. An event might be ready for release at 10:01:05, but won't be picked up until the 10:02:00 poll. 
*When to switch:* We would switch to an event-driven Delayed Message Queue (e.g., Kafka or RabbitMQ) if the system required exact, to-the-second precision for `LATER` releases, or if the database polling query began causing severe load issues at database scale (e.g., scanning a table of millions of deferred events every 60 seconds).

## Decision 6 — Two Stacks, One Architecture
**Both implementations are supposed to follow the same architecture. What was consistent across both? What diverged and why? Was any divergence forced by the framework or was it a choice?**
*Consistent:* The 5-stage conceptual pipeline (Exact Dedupe -> Semantic Dedupe -> Fatigue -> Rules -> AI Fallback) and the core database schema logical equivalents remained identical. Both use the Groq LLaMA 3.3 API. Both feature Next.js frontends.
*Diverged:* The handling of async processing diverged. MERN utilizes Node's non-blocking Event Loop and Agenda for queue processing, while Spring Boot strictly utilizes the `@Async` annotation backed by a ThreadPoolTaskExecutor. MERN uses Mongoose middleware for some atomic operations, while Spring Boot relies on JPA Entity Lifecycle callbacks (`@PrePersist`).
*Forced or Choice:* This divergence was forced by the runtime environments. Node.js is inherently single-threaded and async-first, making background event-loop processing natural. Java is heavily multi-threaded, necessitating thread pool management for the `@Async` classification engine to avoid exhausting Tomcat's HTTP request threads.
