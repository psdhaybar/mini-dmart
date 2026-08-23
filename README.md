# 🛒 Mini D-Mart

**Full-stack grocery commerce + store-operations platform** built for the Round 2 Full Stack Developer Practical Assessment.

> Build like a product engineer: customer commerce, operational workflows, RBAC, inventory safety, returns/exchanges and security controls in one application.

## ✨ Highlights

- Customer registration/login with protected role-based routes
- Product catalog, search/filter, pricing and inventory
- Stock-aware cart and server-side checkout
- Home delivery with address validation and delivery fee
- Scheduled store pickup with capacity validation
- Customer order history, details and cancellation
- Order lifecycle with backend-enforced status transitions
- Return/exchange requests with eligibility and inventory handling
- Staff order preparation and return processing
- Manager analytics and inventory management
- Admin user/RBAC management and audit trail
- JWT authentication, bcrypt password hashing, Helmet, CORS, rate limiting and environment secrets
- Responsive UI with loading, empty, error and success states

## 🧱 Architecture

```text
React + Vite
     │
     │ Axios / JWT
     ▼
Express REST API
     │
     │ Mongoose
     ▼
MongoDB Atlas
```

### Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, Axios, Lucide |
| Backend | Node.js, Express 5 |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Security | Helmet, CORS, rate limiting, validation, audit logging |

## 👥 Roles

| Role | Main responsibility |
|---|---|
| CUSTOMER | Browse, cart, checkout, orders, returns/exchanges |
| STAFF | Process orders and returns |
| MANAGER | Operations, analytics, inventory/products |
| ADMIN | Users, RBAC, operational visibility, audit trail |

## 🔌 Main API areas

- `/api/auth` — registration/login
- `/api/users` — profile and admin user management
- `/api/products` — catalog/search/filter and manager/admin product management
- `/api/cart` — customer cart
- `/api/orders` — checkout, history and cancellation
- `/api/staff` — order operations
- `/api/dashboard` — operational/management statistics
- `/api/returns` — return/exchange workflows
- `/api/audit` — admin audit trail

## 🧠 Key business rules

- Checkout recalculates totals on the server.
- Stock is validated and decremented atomically inside a MongoDB transaction.
- Pickup slots have capacity and scheduling constraints.
- Order status changes follow an explicit state-transition model.
- Customer cancellation is restricted by order status.
- Returns/exchanges are restricted by order state, quantity and eligibility window.
- Return/exchange inventory changes are handled by backend business logic.
- Protected resources are scoped to the authenticated customer where required.

## 🔐 Security

RBAC is enforced in API middleware, not just the React UI. Passwords are hashed with bcryptjs, authentication endpoints are rate-limited, Helmet adds security headers, CORS uses the configured client origin, and secrets remain in environment variables.

Security-sensitive administrative actions are recorded in an admin-only audit trail.

See [`SECURITY.md`](./SECURITY.md).

## 💻 Local setup

### Server

```bash
cd server
npm install
```

Create `server/.env` from `server/.env.example` and set:

```text
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=<YOUR_MONGODB_ATLAS_URI>
JWT_SECRET=<LONG_RANDOM_SECRET>
JWT_EXPIRES_IN=7d
```

Seed the demo database once:

```bash
npm run seed
```

Start the API:

```bash
npm run dev
```

### Client

```bash
cd client
npm install
```

Create `client/.env`:

```text
VITE_API_URL=http://localhost:5000/api
```

Start Vite:

```bash
npm run dev
```

## 🧪 Testing

Backend smoke test:

```bash
cd server
npm run smoke
```

The smoke test covers API health, seeded role logins, products, cart, staff orders, manager dashboard, admin audit access and an RBAC denial.

Before submission, also run:

```bash
cd client
npm run build
```

## 🔑 Demo credentials

| Role | Email | Password |
|---|---|---|
| Customer | `customer@minidmart.com` | `Customer@123` |
| Staff | `staff@minidmart.com` | `Staff@12345` |
| Manager | `manager@minidmart.com` | `Manager@12345` |
| Admin | `admin@minidmart.com` | `Admin@12345` |

For a public deployment, use demo-only credentials and rotate/remove them after the assessment.

## ☁️ Deployment

Recommended assessment deployment:

- Backend → Render Web Service (`server` root)
- Frontend → Vercel (`client` root)
- Database → MongoDB Atlas

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for exact settings and environment variables.

## 🎥  Demo

See [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md)

The 5 - 20  minute flow is:

**Customer → Checkout → Staff order lifecycle → Manager analytics → Admin RBAC/audit → architecture/security.**

## 🤖 AI usage

AI assistance was used to accelerate implementation, code review, UI construction, debugging and security/business-rule checks. The resulting implementation was reviewed against the assessment requirements and project structure.

## 📋 checklist

- [x] GitHub repository
- [x] Public frontend URL
- [x] Public backend/API URL
- [x] README.md
- [x] SECURITY.md
- [x] `.env.example`
- [x] Test credentials
- [x] 5–10 minute explanation/demo video
- [x] Deployment evidence
- [x] Smoke-test evidence
- [x] AI usage disclosure
