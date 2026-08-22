# Security Review

## Controls implemented
- Passwords are hashed with bcryptjs; password fields are excluded from normal user queries.
- JWT authentication is required for protected APIs.
- RBAC is enforced in API middleware, not only in the frontend.
- Authentication endpoints use a stricter rate limit.
- Helmet adds common HTTP security headers.
- CORS is restricted to the configured client origin.
- Secrets are read from environment variables; `.env` is ignored by git and is not included in the submission archive.
- Product updates use an allow-list of editable fields.
- Checkout validates stock on the server and uses a MongoDB transaction with an atomic stock decrement.
- Customer order access is scoped to the authenticated customer.
- Return/exchange requests are scoped to the authenticated customer and checked against order status, quantity and eligibility window.
- Security-sensitive actions are recorded in an admin-only audit trail with actor, action, entity, timestamp and request IP metadata.

## Remaining production hardening
- Use HTTPS in deployment.
- Store JWTs in secure, httpOnly cookies for a production browser deployment.
- Add centralized structured audit logging and monitoring.
- Add CSRF protection if cookie authentication is adopted.
- Integrate a real payment provider before enabling ONLINE payment.
- Add automated integration/security tests in CI.
