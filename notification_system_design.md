# SYSTEM ARCHITECTURE & SPECIFICATION DESIGN: NOTIFICATION SERVICE

---

## PART 1: API CONTRACTS & SYSTEM SPECIFICATION

### 1.1 OVERVIEW
This section defines the API specifications and communication contracts for the Notification Service. The system allows authenticated users to receive, view, manage, and track notifications in real-time. It details REST API endpoints, payload configurations, request headers, data schemas, and the real-time push mechanism using WebSockets.

### 1.2 GLOBAL API CONFIGURATIONS

*   **API Root URL**: `/api/v1`
*   **Mandatory Request Headers**:
    ```http
    Authorization: Bearer <JWT_ACCESS_TOKEN>
    Content-Type: application/json
    Accept: application/json
    ```

### 1.3 STANDARD RESPONSE ENVELOPES

#### Success Response Format
```json
{
  "success": true,
  "message": "Action completed successfully",
  "data": {}
}
```

#### Error Response Format
```json
{
  "success": false,
  "message": "Failure details and descriptions"
}
```

---

### 1.4 API ENDPOINTS SPECIFICATION

#### A. Trigger Notification
*   **Endpoint**: `POST /api/v1/notifications`
*   **Description**: Used by internal microservices to dispatch a notification to a specific user.
*   **Payload Example**:
    ```json
    {
      "userId": "user123",
      "title": "New Login Detected",
      "message": "Your account was accessed from a new device.",
      "type": "security"
    }
    ```
*   **Response Envelope**:
    ```json
    {
      "success": true,
      "message": "Notification created successfully",
      "data": {
        "notificationId": "notif_001"
      }
    }
    ```

#### B. Retrieve Notifications
*   **Endpoint**: `GET /api/v1/notifications`
*   **Description**: Retrieves the notifications list for the authenticated requester.
*   **Response Envelope**:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "notif_001",
          "title": "New Login Detected",
          "message": "Your account was accessed from a new device.",
          "type": "security",
          "read": false,
          "createdAt": "2026-06-03T10:00:00Z"
        }
      ]
    }
    ```

#### C. Get Unread Notifications Badge Count
*   **Endpoint**: `GET /api/v1/notifications/unread-count`
*   **Description**: Returns count of unread notifications to display UI badges.
*   **Response Envelope**:
    ```json
    {
      "success": true,
      "data": {
        "count": 3
      }
    }
    ```

#### D. Mark Notification as Read
*   **Endpoint**: `PATCH /api/v1/notifications/{notificationId}/read`
*   **Description**: Updates a single notification's read status to true.
*   **Request URL**: `PATCH /api/v1/notifications/notif_001/read`
*   **Response Envelope**:
    ```json
    {
      "success": true,
      "message": "Notification marked as read"
    }
    ```

#### E. Mark All Notifications as Read
*   **Endpoint**: `PATCH /api/v1/notifications/read-all`
*   **Description**: Sets the read status of all active user notifications to true.
*   **Response Envelope**:
    ```json
    {
      "success": true,
      "message": "All notifications marked as read"
    }
    ```

#### F. Remove Notification
*   **Endpoint**: `DELETE /api/v1/notifications/{notificationId}`
*   **Description**: Deletes a specific notification record.
*   **Response Envelope**:
    ```json
    {
      "success": true,
      "message": "Notification deleted successfully"
    }
    ```

---

### 1.5 DATA DICTIONARY & MODEL
```json
{
  "id": "string",
  "userId": "string",
  "title": "string",
  "message": "string",
  "type": "info | warning | security",
  "read": false,
  "createdAt": "ISO-8601 timestamp"
}
```

---

### 1.6 REAL-TIME COMMUNICATION MODEL
A persistent WebSocket server is used for real-time delivery to eliminate polling.

*   **WebSocket URI**: `ws://localhost:3000/ws/notifications`
*   **Connection Handshake Payload**:
    ```json
    {
      "token": "JWT_TOKEN"
    }
    ```
*   **Server Event Format (NEW_NOTIFICATION)**:
    ```json
    {
      "event": "NEW_NOTIFICATION",
      "data": {
        "id": "notif_005",
        "title": "Payment Successful",
        "message": "Your payment has been processed.",
        "type": "info",
        "createdAt": "2026-06-03T10:30:00Z"
      }
    }
    ```

#### Connection Lifecycle & Event Flow
1. User successfully logs in.
2. Client negotiates a WebSocket connection.
3. Handshake verifies JWT identity.
4. Client joins private Notification stream.
5. Service emits message event when triggered.
6. Client catches WebSocket event and appends to UI.

---

### 1.7 SECURITY CONSTRAINTS
*   Strict JWT verification on all secured routes.
*   Enforcement of SSL/TLS (HTTPS/WSS) protocols.
*   Strict validation of input fields for creation endpoints.
*   Strict checks to ensure requested resources belong to the authenticated requester.
*   Rate-limiting controls to prevent abuse.

### 1.8 API EVOLUTION POLICY
URI path versioning is utilized (`/api/v1`, `/api/v2`) to ensure backward compatibility as features evolve.

---
---

## PART 2: DATABASE DESIGN & ARCHITECTURE

### 2.1 DATABASE ENGINE SELECTION
**PostgreSQL** was selected as the storage engine due to:
*   Strong ACID transactions for message delivery state tracking.
*   Excellent performance and query-plan optimization on relational data.
*   Efficient compound indexing support.
*   Robust horizontal and vertical scaling pathways (partitioning, read-replicas).

### 2.2 SCHEMA SPECIFICATION
```sql
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    studentID BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notificationType VARCHAR(20) NOT NULL,
    isRead BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 2.3 DATA DICTIONARY
*   `id` (BIGSERIAL): Unique primary key.
*   `studentID` (BIGINT): Identifies the student.
*   `title` (VARCHAR(255)): Header of the alert.
*   `message` (TEXT): Main description body.
*   `notificationType` (VARCHAR(20)): Type label (`Event`, `Result`, `Placement`).
*   `isRead` (BOOLEAN): Current state of reading.
*   `createdAt` (TIMESTAMP): Record insertion timestamp.
*   `updatedAt` (TIMESTAMP): Last alteration timestamp.

### 2.4 INDEXING SCHEME
To optimize common querying routes, the following indexes are implemented:

```sql
-- Fast filter by student
CREATE INDEX idx_notifications_student 
ON notifications(studentID);

-- Optimizes badge count queries
CREATE INDEX idx_notifications_student_read 
ON notifications(studentID, isRead);

-- Optimizes main inbox query (filtering + sorting)
CREATE INDEX idx_notifications_student_read_created 
ON notifications(studentID, isRead, createdAt);

-- Optimizes filtering by notification categories
CREATE INDEX idx_notifications_type_created 
ON notifications(notificationType, createdAt);
```

---

### 2.5 SCALABILITY RISKS & SOLUTIONS

1.  **Explosion of Storage**: Millions of logs accumulating over time.
    *   *Solution*: Set up active table partitioning and move data older than 1 year to archive tables.
2.  **Slow Queries at Scale**: Heavy index-scans and disk lookups.
    *   *Solution*: Composite indexing coupled with strict UI pagination.
3.  **High-Frequency Write Spikes**: Simultaneous database writes during events.
    *   *Solution*: Use connection poolers and queues to throttle insertions.
4.  **WebSocket Connection Scaling**: High memory consumption of active connections.
    *   *Solution*: Distribute connections using load balancers and Redis Pub/Sub channels.

---

### 2.6 SQL IMPLEMENTATIONS (PART 1 ALIGNMENT)

#### A. Insert Notification
```sql
INSERT INTO notifications (studentID, title, message, notificationType) 
VALUES (1042, 'Placement Update', 'You have been shortlisted.', 'Placement');
```

#### B. Fetch Inbox Items
```sql
SELECT * FROM notifications 
WHERE studentID = 1042 
ORDER BY createdAt DESC 
LIMIT 20;
```

#### C. Unread Counter
```sql
SELECT COUNT(*) FROM notifications 
WHERE studentID = 1042 AND isRead = FALSE;
```

#### D. Mark Specific Item Read
```sql
UPDATE notifications 
SET isRead = TRUE, updatedAt = CURRENT_TIMESTAMP 
WHERE id = 101;
```

#### E. Mark All Items Read
```sql
UPDATE notifications 
SET isRead = TRUE, updatedAt = CURRENT_TIMESTAMP 
WHERE studentID = 1042 AND isRead = FALSE;
```

#### F. Delete Notification
```sql
DELETE FROM notifications 
WHERE id = 101;
```

### 2.7 DATARETENTION SCHEMA
*   Live inbox: Maintains current notifications up to 1 year.
*   Archiving worker: Monthly job transfers older items to cold storage tables.
*   Purge policy: Records over 3 years old are safely deleted.

---
---

## PART 3: QUERY PERFORMANCE ANALYSIS & TUNING

### 3.1 TARGET QUERY
```sql
SELECT * FROM notifications 
WHERE studentID = 1042 AND isRead = false 
ORDER BY createdAt ASC;
```

### 3.2 AUDIT & CORRECTNESS ANALYSIS
The query is logically correct and returns all active unread alerts for student `1042` sorted by oldest first. However, it will experience performance degradation when scaled to **5,000,000 records** distributed across **50,000 students**.

### 3.3 PERFORMANCE DEGRADATION CAUSES

1.  **Full Table Scan (Sequential Scan)**:
    Without an index covering the filter keys, the engine executes a sequential lookup on all 5,000,000 rows. Cost complexity is:
    $$\mathcal{O}(N)$$
    where $N = 5,000,000$.

2.  **In-Memory Sort Cost**:
    The query demands sorting via `ORDER BY createdAt ASC`. If sorting is performed in memory rather than reading from pre-sorted index structures, it incurs a costly sort penalty:
    $$\mathcal{O}(M \log M)$$
    where $M$ is the matching row count.

3.  **Wildcard Selection (`SELECT *`)**:
    Querying every column increases disk I/O, memory footprint, and network overhead.

---

### 3.4 OPTIMIZATION PROPOSAL

#### 1. Compound Index Creation
```sql
CREATE INDEX idx_notifications_student_read_created 
ON notifications(studentID, isRead, createdAt);
```
This compound key layout allows the database optimizer to locate matching unread items for student `1042` and fetch them in pre-sorted order, avoiding both scans and memory sorts.

#### 2. Query Refinement
```sql
SELECT id, title, message, notificationType, createdAt 
FROM notifications 
WHERE studentID = 1042 AND isRead = FALSE 
ORDER BY createdAt ASC;
```

#### 3. Complexity Comparison
*   **Before Index**: $\mathcal{O}(N)$ scan + $\mathcal{O}(M \log M)$ memory sort.
*   **After Index**: $\mathcal{O}(\log N + M)$ index lookup, with no sorting overhead.

---

### 3.5 GENERAL INDEXING PRINCIPLES
Over-indexing must be avoided because:
*   Every additional index incurs a write penalty during `INSERT` and `UPDATE` operations.
*   Indexes consume substantial system memory.
*   Unused indexes result in wasted disk allocation.

Indexes should only be target-built for primary keys, foreign keys, and columns evaluated in `WHERE` clauses, `JOIN` conditions, and `ORDER BY` fields.

---

### 3.6 RETRIEVAL QUERY: PLACEMENTS IN THE LAST 7 DAYS

#### PostgreSQL Syntax
```sql
SELECT DISTINCT studentID 
FROM notifications 
WHERE notificationType = 'Placement' 
  AND createdAt >= NOW() - INTERVAL '7 days';
```

#### MySQL Syntax
```sql
SELECT DISTINCT studentID 
FROM notifications 
WHERE notificationType = 'Placement' 
  AND createdAt >= NOW() - INTERVAL 7 DAY;
```

---
---

## PART 4: HIGH-SCALE PERFORMANCE STRATEGY

### 4.1 PROBLEM IDENTIFICATION
Reading directly from disk databases on every page view under heavy concurrency causes high memory utilization and query queues, degrading application response times.

### 4.2 PERFORMANCE SOLUTIONS MATRIX

#### 1. Pagination Controls
Implement cursor-based or offset-based pagination to restrict result payload sizes.
*   *Query Sample*:
    ```sql
    SELECT id, title, message, createdAt FROM notifications 
    WHERE studentID = 1042 
    ORDER BY createdAt DESC 
    LIMIT 20 OFFSET 0;
    ```
*   *Pros*: Minimized payload size, faster UI render.
*   *Cons*: Complexity in infinite scroll tracking.

#### 2. Composite Database Indexing
Speed up lookups using compound indexes.
*   *Pros*: Sub-millisecond lookup latency.
*   *Cons*: Write latency penalty.

#### 3. Redis Caching Layers
Cache user inboxes in memory. On new writes, invalidate the corresponding cache key.
*   *Flow*:
    ```text
    API Client ──> Redis Get ──[Cache Hit]──> Return JSON Data
                     │
               [Cache Miss]
                     │
                     └──> PostgreSQL Query ──> Save in Redis ──> Return
    ```
*   *Pros*: Avoids hitting PostgreSQL for repeated loads.
*   *Cons*: Needs strict cache invalidation logic.

#### 4. Event-Driven Push via WebSockets
Push alerts immediately over an active connection instead of clients polling the server.
*   *Pros*: Reduced load on REST server.
*   *Cons*: High connection state memory.

#### 5. Unread Count Cached in Memory
Store badge counts as simple integer keys in Redis.
*   *Key format*: `student:1042:unread_count`
*   *Pros*: Avoids expensive relational `COUNT(*)` queries.
*   *Cons*: Must remain synchronized during read/delete actions.

#### 6. Asynchronous Messaging Queues
Offload notification creation tasks to background workers via message brokers (Kafka/RabbitMQ).
*   *Pros*: Instant client feedback, resilient retries.
*   *Cons*: System architecture complexity.

#### 7. Date-Based Table Partitioning
Partition the main table by year or quarter.
*   *Pros*: Faster scan ranges on recent files.
*   *Cons*: Harder table management.

---
---

## PART 5: SCALE & FAULT-TOLERANT DELIVERY

### 5.1 CODEBASE EVALUATION
The sequential implementation runs email, database, and push executions sequentially inside a single loop:
```javascript
function notifyAll(studentIds, message) {
  for (let studentId of studentIds) {
    sendEmail(studentId, message);
    saveToDb(studentId, message);
    pushToApp(studentId, message);
  }
}
```
*   **Bottlenecks**: Extremely slow when scaling to 50,000 records. A single failure in any service blocks or aborts the entire flow.

### 5.2 RESILIENT RETRY SCHEME
If the email service fails for a subset of students:
*   Jobs are retried automatically with exponential backoff.
*   If failures continue after 3 attempts, the event is routed to a Dead Letter Queue (DLQ) for analysis.

---

### 5.3 PROPOSED QUEUE ARCHITECTURE
An asynchronous message-driven design decouples the operations:

```text
[Dispatch Alert Request]
           │
           ▼
[Batch DB Insertion]
           │
           ▼
[Publish Event to Broker] ──> [Kafka / RabbitMQ Topic]
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
       [Email Worker Pool]                            [App Push Worker Pool]
                 │                                             │
                 ▼                                             ▼
           (Send Email)                                  (WebSocket Send)
```

---

### 5.4 REVISED WORKFLOW IMPLEMENTATION

#### Dispatcher Service
```javascript
async function queueNotifications(studentIds, message) {
  await db.batchInsertNotifications(studentIds, message);
  
  for (let studentId of studentIds) {
    await messageQueue.publish("delivery-topic", {
      studentId,
      message
    });
  }
  return { status: "queued" };
}
```

#### Application Push Worker
```javascript
async function processAppPush(event) {
  try {
    await wsServer.sendToClient(event.studentId, event.message);
  } catch (err) {
    logger.error(`App push failed: ${err.message}`);
  }
}
```

#### Email Dispatch Worker
```javascript
async function processEmailDispatch(event, attempt = 1) {
  try {
    await emailClient.send(event.studentId, event.message);
  } catch (err) {
    if (attempt < 3) {
      await scheduler.scheduleRetry(event, attempt + 1);
    } else {
      await dlq.publish("failed-emails", event);
    }
  }
}
```

---

### 5.5 PERFORMANCE IMPROVEMENTS
*   **Database Batching**: Uses multi-row SQL inserts (`INSERT INTO ... VALUES (), (), ()`) to dramatically reduce write operations.
*   **Parallel Execution**: Workers scale horizontally to process messages concurrently.

### 5.6 DESIGN TRADE-OFFS
*   *Queueing*: Delivers sub-second response times but requires managing brokers.
*   *Retries*: Guarantees delivery but can lead to duplicate deliveries if workers crash midway.

---
---

## PART 6: PRIORITY INBOX DESIGN & CALCULATIONS

### 6.1 OBJECTIVE
Compute and showcase the top 10 most critical unread alerts based on a combination of notification type weight and recency.

### 6.2 TYPE WEIGHT MATRIX
*   **Placement**: Weight = 3
*   **Result**: Weight = 2
*   **Event**: Weight = 1

### 6.3 SCORING ALGORITHM
The priority score is calculated using the following formula:

$$\text{Priority Score} = \text{Type Weight} + \text{Normalized Recency}$$

Where:
*   Items are sorted in descending order of their priority score.
*   If two items have the same type weight, the newer item (greater timestamp value) is ordered first.

### 6.4 ALGORITHMIC STEPS
1. Query active unread notifications via the API.
2. Inject priority weight depending on the notification type.
3. Sort the array using a composite comparator:
   *   Compare category weights first.
   *   Compare timestamps next if weights are equal.
4. Extract the top 10 elements.

### 6.5 SCALE OPTIMIZATION
Instead of sorting the entire list on every request, keep a **Min-Heap** of size 10 in memory.
*   *Insertion Time Complexity*: $\mathcal{O}(\log K)$ where $K = 10$.
*   *Removal Time Complexity*: $\mathcal{O}(\log K)$.
*   *Space Complexity*: $\mathcal{O}(K)$.
This ensures inbox processing overhead remains constant regardless of the total count of notifications.
