import { LogOut, ShoppingCart, UserCircle, Store, Sparkles, CircleCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const roleCopy = {
  CUSTOMER: { eyebrow: "Fresh picks, made simple", title: "Shop smarter today", detail: "Live stock • scheduled pickup • home delivery" },
  STAFF: { eyebrow: "Operations live", title: "Keep every order moving", detail: "Preparation • pickup • delivery • returns" },
  MANAGER: { eyebrow: "Store performance", title: "Run the store with confidence", detail: "Revenue • inventory • orders • returns" },
  ADMIN: { eyebrow: "Control center", title: "Everything in one place", detail: "Users • access • catalog • operations" },
};

const AppShell = ({ title, subtitle, children, cartCount = 0, onCart }) => {
  const { user, logout } = useAuth();
  const copy = roleCopy[user?.role] || roleCopy.CUSTOMER;
  const initials = user?.name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "MD";

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark"><Store size={19} /></span>
          <span>Mini D-Mart</span>
          <span className="brand-dot" />
          <span className="brand-mini">Smart grocery operations</span>
        </div>
        <div className="topbar-actions">
          <span className="live-pill"><span /> Live store</span>
          <span className="user-chip"><span className="avatar">{initials}</span><span className="user-name">{user?.name}</span></span>
          {onCart && <button className="icon-btn cart-btn" onClick={onCart} title="Cart"><ShoppingCart size={19}/>{cartCount > 0 && <b>{cartCount}</b>}</button>}
          <button className="btn btn-ghost" onClick={logout}><LogOut size={16}/> Logout</button>
        </div>
      </header>
      <main className="container">
        <section className="workspace-hero">
          <div>
            <div className="hero-eyebrow"><Sparkles size={14}/> {copy.eyebrow}</div>
            <div className="workspace-hero-row">
              <div><h2>{copy.title}</h2><p>{copy.detail}</p></div>
              <span className="hero-role"><CircleCheck size={15}/> {user?.role}</span>
            </div>
          </div>
          <div className="hero-orb hero-orb-one" /><div className="hero-orb hero-orb-two" />
        </section>

        <div className="page-heading">
          <div><div className="page-kicker">{title}</div><h1>{title}</h1><p>{subtitle}</p></div>
          <span className="role-badge">{user?.role}</span>
        </div>
        {children}
      </main>
    </div>
  );
};

export default AppShell;
