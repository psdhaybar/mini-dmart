import { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getDashboardPath } from "../utils/roleRedirect";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name:"", email:"", password:"" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const change = (e) => { setForm({...form,[e.target.name]:e.target.value}); setError(""); };

  const submit = async (e) => {
    e.preventDefault();
    if (mode === "register" && form.name.trim().length < 2) return setError("Please enter your name.");
    if (!form.email || !form.password) return setError("Email and password are required.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    try {
      setLoading(true);
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const { data } = await api.post(endpoint, form);
      login(data.user, data.token);
      navigate(getDashboardPath(data.user.role), { replace:true });
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <section className="login-brand">
        <div className="brand-content">
          <div className="brand-icon">🛒</div>
          <h1>Mini D-Mart</h1>
          <p>Everyday groceries, smarter shopping, and flexible pickup or home delivery.</p>
          <div className="brand-features">
            {["Fresh products & live stock","Scheduled store pickup","Secure order tracking","Easy returns & exchanges"].map(x=><div key={x}><CheckCircle2 size={18}/>{x}</div>)}
          </div>
        </div>
      </section>
      <section className="login-section">
        <div className="login-card">
          <div className="mobile-logo">🛒 Mini D-Mart</div>
          <div className="auth-tabs"><button className={mode==="login"?"active":""} onClick={()=>{setMode("login");setError("")}}>Sign in</button><button className={mode==="register"?"active":""} onClick={()=>{setMode("register");setError("")}}>Create account</button></div>
          <h2>{mode==="login"?"Welcome back!":"Create your account"}</h2>
          <p className="login-subtitle">{mode==="login"?"Sign in to continue shopping.":"Join Mini D-Mart and start shopping."}</p>
          {error && <div className="login-error">⚠ {error}</div>}
          <form onSubmit={submit}>
            {mode==="register" && <div className="form-group"><label>Name</label><div className="input-wrapper"><User className="input-icon" size={17}/><input name="name" placeholder="Your name" value={form.name} onChange={change}/></div></div>}
            <div className="form-group"><label>Email address</label><div className="input-wrapper"><Mail className="input-icon" size={17}/><input type="email" name="email" placeholder="you@example.com" value={form.email} onChange={change}/></div></div>
            <div className="form-group"><label>Password</label><div className="input-wrapper"><Lock className="input-icon" size={17}/><input type={showPassword?"text":"password"} name="password" placeholder="Minimum 8 characters" value={form.password} onChange={change}/><button type="button" className="password-toggle" onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></div>
            <button className="login-button" disabled={loading}>{loading?"Please wait…":mode==="login"?"Sign in":"Create account"} <ArrowRight size={17}/></button>
          </form>
          {mode==="login" && <div className="demo-box"><strong>Demo accounts</strong><span>Customer: customer@minidmart.com / Customer@123</span><span>Staff: staff@minidmart.com / Staff@12345</span><span>Manager: manager@minidmart.com / Manager@12345</span><span>Admin: admin@minidmart.com / Admin@12345</span></div>}
          <p className="login-footer">© 2026 Mini D-Mart · Full-stack assessment build</p>
        </div>
      </section>
    </div>
  );
};
export default Login;
