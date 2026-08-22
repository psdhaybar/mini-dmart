import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingBag, Package, RotateCcw, UserCircle, Plus, Minus, Trash2, CreditCard, Sparkles, Truck, Clock3, ArrowRight, ShieldCheck } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import AppShell from "../components/AppShell";
import StatCard from "../components/StatCard";

const money = (n) => `₹${Number(n || 0).toFixed(2)}`;
const statusClass = (s) => s === "CANCELLED" ? "status pill-danger" : ["DELIVERED","PICKED_UP"].includes(s) ? "status" : "status pill-warning";

const CustomerDashboard = () => {
  const [tab,setTab]=useState("shop"), [products,setProducts]=useState([]), [cart,setCart]=useState({items:[],subtotal:0});
  const [orders,setOrders]=useState([]), [returns,setReturns]=useState([]), [profile,setProfile]=useState(null);
  const [search,setSearch]=useState(""), [category,setCategory]=useState(""), [loading,setLoading]=useState(true), [message,setMessage]=useState("");
  const [checkout,setCheckout]=useState(false), [checkoutForm,setCheckoutForm]=useState({fulfillmentType:"PICKUP",scheduledPickupAt:"",deliveryAddress:"",paymentMethod:"COD"});
  const [returnModal,setReturnModal]=useState(null), [returnForm,setReturnForm]=useState({type:"RETURN",quantity:1,reason:"",exchangeProductId:""});

  const load = async () => {
    setLoading(true);
    try {
      const [p,c,o,r,u]=await Promise.all([
        api.get("/products?limit=50"),api.get("/cart"),api.get("/orders"),api.get("/returns/mine"),api.get("/users/profile")
      ]);
      setProducts(p.data.products);setCart(c.data.cart);setOrders(o.data.orders);setReturns(r.data.requests);setProfile(u.data.user);
    } catch(e){setMessage(e.response?.data?.message||"Unable to load your data.");}
    finally{setLoading(false);}
  };
  useEffect(()=>{load()},[]);

  const categories=useMemo(()=>[...new Set(products.map(p=>p.category))].sort(),[products]);
  const visible=products.filter(p=>(!search||`${p.name} ${p.description}`.toLowerCase().includes(search.toLowerCase()))&&(!category||p.category===category));
  const cartCount=cart.items.reduce((s,i)=>s+i.quantity,0);

  const action=async(fn, success) => {try{await fn();setMessage(success);await load();return true;}catch(e){setMessage(e.response?.data?.message||"Action failed.");return false;}};
  const add=product=>action(()=>api.post("/cart",{productId:product._id,quantity:1}),"Added to cart.");
  const qty=(item,n)=> n<1 ? action(()=>api.delete(`/cart/${item.product}`),"Removed from cart.") : action(()=>api.patch(`/cart/${item.product}`,{quantity:n}),"Cart updated.");
  const placeOrder=async(e)=>{e.preventDefault();const ok=await action(()=>api.post("/orders",checkoutForm),"Order placed successfully.");if(ok){setCheckout(false);setTab("orders");setCheckoutForm({fulfillmentType:"PICKUP",scheduledPickupAt:"",deliveryAddress:"",paymentMethod:"COD"});}};

  if(loading) return <div className="app-loading">Loading your Mini D-Mart…</div>;

  return <AppShell title="Good to see you 👋" subtitle="Shop groceries, manage your cart and track every order." cartCount={cartCount} onCart={()=>setTab("cart")}>
    {message && <div className="notice" onClick={()=>setMessage("")}>{message}</div>}
    <div className="tabs">{[
      ["shop","Shop",ShoppingBag],["cart","Cart",Package],["orders","Orders",Package],["returns","Returns",RotateCcw],["profile","Profile",UserCircle]
    ].map(([id,label,Icon])=><button key={id} className={`tab ${tab===id?"active":""}`} onClick={()=>setTab(id)}><Icon size={15}/> {label}{id==="cart"&&cartCount?` (${cartCount})`:""}</button>)}</div>

    {tab==="shop"&&<section>
      <div className="storefront-hero">
        <div className="storefront-copy">
          <div className="storefront-badge"><Sparkles size={14}/> Freshly stocked · Ready when you are</div>
          <h2>Everything you need.<br/><span>One smarter basket.</span></h2>
          <p>Discover everyday essentials, add them in seconds, and choose convenient pickup or doorstep delivery.</p>
          <div className="storefront-actions"><button className="btn btn-primary storefront-cta" onClick={()=>document.querySelector('.product-grid')?.scrollIntoView({behavior:'smooth'})}>Explore fresh picks <ArrowRight size={16}/></button><div className="storefront-trust"><ShieldCheck size={16}/> Live inventory · Secure checkout</div></div>
        </div>
        <div className="storefront-art"><div className="art-glow"/><div className="floating-chip chip-one">🥛 Fresh dairy</div><div className="floating-chip chip-two">🍎 Daily essentials</div><img src="/hero.png" alt="Fresh groceries"/></div>
      </div>
      <div className="customer-highlights">
        <div className="highlight-card"><span className="highlight-icon"><Sparkles size={16}/></span><div><strong>Fresh picks</strong><span>{products.length} products ready to explore</span></div></div>
        <div className="highlight-card"><span className="highlight-icon"><Truck size={16}/></span><div><strong>Flexible delivery</strong><span>Pickup or home delivery at checkout</span></div></div>
        <div className="highlight-card"><span className="highlight-icon"><Clock3 size={16}/></span><div><strong>Smart pickup</strong><span>Reserve a convenient 1-hour slot</span></div></div>
      </div>
      <div className="toolbar"><div style={{position:"relative",flex:"1",minWidth:220}}><Search size={17} style={{position:"absolute",left:12,top:11,color:"#9ca3af"}}/><input className="input" style={{paddingLeft:38}} placeholder="Search groceries…" value={search} onChange={e=>setSearch(e.target.value)}/></div><select className="select" style={{maxWidth:220}} value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{categories.map(c=><option key={c}>{c}</option>)}</select></div>
      <div className="grid product-grid">{visible.map(p=><article className="product-card" key={p._id}><div className="product-ribbon">{p.stock > 0 ? "In stock" : "Sold out"}</div><img className="product-image" src={p.image||"https://placehold.co/600x400?text=Grocery"} alt={p.name}/><div className="product-body"><span className="small muted">{p.category}</span><h3>{p.name}</h3><p>{p.description||"Quality everyday grocery."}</p><div className="price-row"><div><div className="price">{money(p.price)}</div><div className="stock">{p.stock>0?`${p.stock} in stock`:"Out of stock"}</div></div><button className="btn btn-primary" disabled={!p.stock} onClick={()=>add(p)}><Plus size={16}/> Add</button></div></div></article>)}</div>
      {!visible.length&&<div className="empty">No products match your search.</div>}
    </section>}

    {tab==="cart"&&<section className="two-col"><div className="panel"><div className="panel-title"><h2>Your cart</h2><span className="muted">{cartCount} items</span></div>{!cart.items.length?<div className="empty">Your cart is empty. Browse the shop to add items.</div>:<div className="list">{cart.items.map(i=><div className="list-item" key={i.product}><div><strong>{i.name}</strong><div className="muted">{money(i.price)} each</div></div><div className="qty"><button onClick={()=>qty(i,i.quantity-1)}><Minus size={14}/></button><b>{i.quantity}</b><button onClick={()=>qty(i,i.quantity+1)}><Plus size={14}/></button><button className="icon-btn" onClick={()=>action(()=>api.delete(`/cart/${i.product}`),"Removed from cart.")}><Trash2 size={15}/></button></div></div>)}</div>}</div><div className="panel"><h3>Order summary</h3><div className="list"><div className="list-item"><span>Subtotal</span><strong>{money(cart.subtotal)}</strong></div><div className="list-item"><span>Delivery</span><span className="muted">₹40 for home delivery</span></div><div className="list-item"><strong>Total from pickup</strong><strong>{money(cart.subtotal)}</strong></div></div><button className="btn btn-primary" style={{width:"100%",marginTop:14}} disabled={!cart.items.length} onClick={()=>setCheckout(true)}><CreditCard size={16}/> Checkout</button></div></section>}

    {tab==="orders"&&<section className="stack">{!orders.length?<div className="panel empty">No orders yet.</div>:orders.map(o=><div className="order-card" key={o._id}><div><strong>{o.orderNumber}</strong><div className="muted">{new Date(o.createdAt).toLocaleString()} · {o.fulfillmentType}</div><div className="muted">{o.items.map(i=>`${i.name} × ${i.quantity}`).join(", ")}</div></div><div style={{textAlign:"right"}}><span className={statusClass(o.status)}>{o.status.replaceAll("_"," ")}</span><div className="price mt">{money(o.total)}</div>{["PLACED","CONFIRMED","PREPARING"].includes(o.status)&&<button className="btn btn-danger mt" onClick={()=>action(()=>api.patch(`/orders/${o._id}/cancel`,{reason:"Cancelled by customer"}),"Order cancelled.")}>Cancel</button>}{["DELIVERED","PICKED_UP"].includes(o.status)&&<button className="btn btn-ghost mt" onClick={()=>{setReturnModal({order:o,item:o.items[0]});setReturnForm({type:"RETURN",quantity:1,reason:"",exchangeProductId:""})}}>Return / Exchange</button>}</div></div>)}</section>}

    {tab==="returns"&&<section className="stack">{!returns.length?<div className="panel empty">No return or exchange requests.</div>:returns.map(r=><div className="panel" key={r._id}><div className="panel-title"><div><strong>{r.type} · {r.item.name} × {r.item.quantity}</strong><div className="muted">{r.order?.orderNumber} · {new Date(r.createdAt).toLocaleDateString()}</div></div><span className={statusClass(r.status)}>{r.status}</span></div><div className="muted">Reason: {r.reason}</div>{r.staffNote&&<div className="small mt">Staff: {r.staffNote}</div>}</div>)}</section>}

    {tab==="profile"&&<Profile profile={profile} onSaved={u=>setProfile(u)} />}
    {checkout&&<Checkout form={checkoutForm} setForm={setCheckoutForm} onClose={()=>setCheckout(false)} onSubmit={placeOrder} subtotal={cart.subtotal}/>}
    {returnModal&&<ReturnModal order={returnModal.order} item={returnModal.item} products={products} form={returnForm} setForm={setReturnForm} onClose={()=>setReturnModal(null)} onSubmit={async e=>{e.preventDefault();await action(()=>api.post("/returns",{orderId:returnModal.order._id,productId:returnModal.item.product,...returnForm}),"Request submitted.");setReturnModal(null);setTab("returns")}}/>}
  </AppShell>;
};

const Checkout=({form,setForm,onClose,onSubmit,subtotal})=><div className="modal-backdrop"><div className="modal"><div className="modal-header"><h2>Checkout</h2><button className="close" onClick={onClose}>×</button></div><form className="stack" onSubmit={onSubmit}><div className="field"><label>Fulfillment</label><select className="select" value={form.fulfillmentType} onChange={e=>setForm({...form,fulfillmentType:e.target.value})}><option value="PICKUP">Store pickup — free</option><option value="DELIVERY">Home delivery — ₹40</option></select></div>{form.fulfillmentType==="PICKUP"?<div className="field"><label>Pickup date & time (within 7 days)</label><input required className="input" type="datetime-local" value={form.scheduledPickupAt} onChange={e=>setForm({...form,scheduledPickupAt:e.target.value})}/></div>:<div className="field"><label>Delivery address</label><textarea required minLength={10} className="textarea" rows="3" value={form.deliveryAddress} onChange={e=>setForm({...form,deliveryAddress:e.target.value})}/></div>}<div className="field"><label>Payment</label><select className="select" value={form.paymentMethod} onChange={e=>setForm({...form,paymentMethod:e.target.value})}><option value="COD">Cash / Pay on pickup</option><option value="ONLINE">Online payment (demo)</option></select></div><div className="success">Total: <strong>{money(subtotal+(form.fulfillmentType==="DELIVERY"?40:0))}</strong></div><button className="btn btn-primary">Place order</button></form></div></div>;

const ReturnModal=({order,item,products,form,setForm,onClose,onSubmit})=><div className="modal-backdrop"><div className="modal"><div className="modal-header"><h2>Return / Exchange</h2><button className="close" onClick={onClose}>×</button></div><form className="stack" onSubmit={onSubmit}><div className="field"><label>Item</label><div className="notice">{item.name} · eligible quantity {item.quantity}</div></div><div className="form-grid"><div className="field"><label>Type</label><select className="select" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option>RETURN</option><option>EXCHANGE</option></select></div><div className="field"><label>Quantity</label><input className="input" min="1" max={item.quantity} type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/></div></div>{form.type==="EXCHANGE"&&<div className="field"><label>Exchange product</label><select required className="select" value={form.exchangeProductId} onChange={e=>setForm({...form,exchangeProductId:e.target.value})}><option value="">Select product</option>{products.filter(p=>p.stock>0&&String(p._id)!==String(item.product)).map(p=><option key={p._id} value={p._id}>{p.name} — {money(p.price)}</option>)}</select></div>}<div className="field"><label>Reason</label><textarea required minLength="5" className="textarea" rows="4" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}/></div><button className="btn btn-primary">Submit request</button></form></div></div>;

const Profile=({profile,onSaved})=>{const { updateUser } = useAuth();const [form,setForm]=useState({name:profile?.name||"",phone:profile?.phone||""});const [msg,setMsg]=useState("");return <section className="panel" style={{maxWidth:650}}><h2>Profile</h2><p className="muted">Your account details and role.</p><div className="form-grid"><div className="field"><label>Name</label><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div><div className="field"><label>Phone</label><input className="input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div><div className="field full"><label>Email</label><input className="input" value={profile?.email||""} disabled/></div></div>{msg&&<div className="success mt">{msg}</div>}<button className="btn btn-primary mt" onClick={async()=>{try{const {data}=await api.patch("/users/profile",form);onSaved(data.user);updateUser(data.user);setMsg("Profile saved.")}catch(e){setMsg(e.response?.data?.message||"Unable to save profile")}}}>Save profile</button></section>};

export default CustomerDashboard;
