const assert = require("node:assert/strict");

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:5000/api";
const accounts = {
  CUSTOMER: ["customer@minidmart.com", "Customer@123"],
  STAFF: ["staff@minidmart.com", "Staff@12345"],
  MANAGER: ["manager@minidmart.com", "Manager@12345"],
  ADMIN: ["admin@minidmart.com", "Admin@12345"],
};

const request = async (path, options = {}) => {
  const response = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
};

const login = async (role) => {
  const [email, password] = accounts[role];
  const { response, body } = await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  assert.equal(response.status, 200, `${role} login failed: ${body.message || response.status}`);
  assert.equal(body.user.role, role);
  return body.token;
};

(async () => {
  const health = await fetch(BASE.replace(/\/api$/, ""));
  assert.equal(health.status, 200, "API health check failed");

  const customer = await login("CUSTOMER");
  const staff = await login("STAFF");
  const manager = await login("MANAGER");
  const admin = await login("ADMIN");

  const products = await request("/products?limit=5");
  assert.equal(products.response.status, 200, "Product catalog failed");
  assert.ok(Array.isArray(products.body.products), "Product response is invalid");

  const cart = await request("/cart", { headers: { Authorization: `Bearer ${customer}` } });
  assert.equal(cart.response.status, 200, "Customer cart failed");

  const staffOrders = await request("/staff/orders?limit=1", { headers: { Authorization: `Bearer ${staff}` } });
  assert.equal(staffOrders.response.status, 200, "Staff orders failed");

  const managerDashboard = await request("/dashboard/admin", { headers: { Authorization: `Bearer ${manager}` } });
  assert.equal(managerDashboard.response.status, 200, "Manager dashboard failed");

  const audit = await request("/audit", { headers: { Authorization: `Bearer ${admin}` } });
  assert.equal(audit.response.status, 200, "Admin audit trail failed");

  const customerAdminAttempt = await request("/users", { headers: { Authorization: `Bearer ${customer}` } });
  assert.equal(customerAdminAttempt.response.status, 403, "RBAC failed: customer reached admin users endpoint");

  console.log("Smoke test passed: health, RBAC, all seeded roles, products, cart, staff, manager dashboard and admin audit trail.");
})().catch((error) => {
  console.error("Smoke test failed:", error.message);
  process.exit(1);
});
