# Mini D-Mart — 3–5 Minute Interview Demo

## 0:00–0:25 — Product pitch

"Mini D-Mart is a full-stack grocery commerce and store-operations platform. Customers can browse products, manage a cart, choose scheduled pickup or home delivery, place orders and request returns/exchanges. Internally, staff process orders, managers monitor inventory and analytics, and admins manage users, RBAC and audit activity."

## 0:25–1:15 — Customer journey

Login:

`customer@minidmart.com / Customer@123`

Show:

- premium customer dashboard
- search/filter
- product card
- Add to Cart
- cart totals
- delivery checkout
- order confirmation

Say:

"The important part is that checkout is not trusted to the frontend. The server recalculates totals, validates stock and performs the stock decrement transactionally."

## 1:15–2:00 — Staff workflow

Login:

`staff@minidmart.com / Staff@12345`

Open the new order and demonstrate:

`PLACED → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED`

Say:

"Order status is implemented as a controlled state transition. Invalid transitions are rejected by the API rather than relying on the UI."

## 2:00–2:40 — Manager

Login:

`manager@minidmart.com / Manager@12345`

Show:

- order statistics
- revenue
- inventory
- low-stock monitoring
- product management

Say:

"The manager view turns transactional data into operational information instead of exposing raw CRUD screens."

## 2:40–3:25 — Admin + security

Login:

`admin@minidmart.com / Admin@12345`

Show:

- user management
- role management
- order visibility
- audit trail

Say:

"RBAC is enforced at the API middleware layer, so hiding a button in React is not considered authorization. Security-sensitive administrative actions are also recorded in an audit trail."

## 3:25–4:00 — Architecture

Explain:

`React/Vite → Axios → Express REST API → Mongoose → MongoDB Atlas`

Then mention:

- JWT + bcryptjs
- Helmet
- CORS restriction
- rate limiting
- environment-based secrets
- server-side validation
- MongoDB transactions

## 4:00–4:30 — Creative/edge-case decisions

Mention:

- stock conflicts
- pickup capacity
- cancellation rules
- return/exchange eligibility
- unauthorized role access
- loading/empty/error states

## Closing

"I designed the application as a product rather than a basic CRUD assignment, with separate experiences for customers and store operations and with business rules enforced on the backend."
