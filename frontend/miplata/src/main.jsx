import "./index.css";
import { useState, useMemo, useEffect } from "react";
import {
  PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, BarChart, Bar
} from "recharts";
import {
  Plus, TrendingUp, TrendingDown, Wallet, CreditCard, X, Users,
  Trash2, AlertTriangle, LayoutDashboard, List, PiggyBank, LogOut,
  Eye, EyeOff, Target, Bug, Settings
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = {
  getToken: () => localStorage.getItem("token"),
  setToken: (token) => localStorage.setItem("token", token),
  clearToken: () => localStorage.removeItem("token"),
  headers: () => {
    const token = api.getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  },
  request: async (path, options = {}) => {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...api.headers(),
        ...options.headers
      }
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Ha ocurrido un error");
    }
    return res.json();
  }
};

const uid = () => Math.random().toString(36).substr(2, 9);

// ─── Psychological Nudges ────────────────────────────────────
const NUDGES = {
  before: [
    "🧠 ¿Lo necesitas o solo lo quieres? Piénsalo 10 segundos.",
    "💭 Imagina esto × 30 días. ¿Seguirías comprándolo?",
    "🎯 Cada sol que no gastas es un sol que ahorras.",
    "⏰ Regla de las 24h: si mañana aún lo quieres, cómpralo mañana.",
    "🪞 Tu yo del futuro te agradecerá no gastar esto.",
    "📊 Los gastos pequeños son los que más duelen al final del mes.",
    "💪 Disciplina hoy = libertad mañana.",
    "🐜 Un café diario = S/ 300 al mes. ¿Vale la pena?",
    "🏦 Este gasto te aleja de tu meta de ahorro.",
    "🤔 ¿Podrías vivir sin esto? Entonces no lo compres.",
  ],
  ant: [
    "🐜 Gasto hormiga detectado. Estos son los que más suman.",
    "🐜 Parece pequeño, pero al mes se vuelve gigante.",
    "🐜 Otro más. Ya llevas {count} este mes (S/ {total}).",
  ],
  red: [
    "🚨 ¡Alerta! Has superado tu presupuesto mensual.",
    "⚠️ Estás en números rojos. Es momento de frenar.",
    "🔴 Balance negativo. Cada gasto ahora es deuda.",
  ],
  near: [
    "⚡ Ya usaste el {pct}% de tu presupuesto. Cuidado.",
    "🟡 Te queda poco margen. Piensa bien cada gasto.",
  ],
  save: [
    "🎉 ¡Vas bien! Ya ahorraste S/ {saved} este mes.",
    "💚 Cada sol cuenta. Llevas {pct}% de tu meta.",
    "🚀 Si mantienes este ritmo, llegarás a tu meta.",
  ],
};
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// ─── Categories ──────────────────────────────────────────────
const CATS = {
  income: [
    { id:1, name:"Sueldo", icon:"💼", color:"#22d3ee" },
    { id:2, name:"Freelance", icon:"💻", color:"#a78bfa" },
    { id:3, name:"Inversiones", icon:"📈", color:"#34d399" },
    { id:4, name:"Ventas", icon:"🛒", color:"#fbbf24" },
    { id:5, name:"Bonos", icon:"🎁", color:"#f472b6" },
    { id:6, name:"Otros", icon:"💰", color:"#60a5fa" },
  ],
  expense: [
    { id:7, name:"Alquiler", icon:"🏠", ess:true, color:"#f87171" },
    { id:8, name:"Servicios", icon:"💡", ess:true, color:"#fb923c" },
    { id:9, name:"Comida casa", icon:"🥘", ess:true, color:"#34d399" },
    { id:10, name:"Transporte", icon:"🚌", ess:true, color:"#60a5fa" },
    { id:11, name:"Salud", icon:"🏥", ess:true, color:"#c084fc" },
    { id:12, name:"Educación", icon:"📚", ess:true, color:"#2dd4bf" },
    { id:13, name:"Delivery", icon:"🛵", color:"#fb7185" },
    { id:14, name:"Café/snacks", icon:"☕", color:"#fbbf24" },
    { id:15, name:"Comer fuera", icon:"🍔", color:"#f97316" },
    { id:16, name:"Streaming", icon:"📺", color:"#a78bfa" },
    { id:17, name:"Ropa", icon:"👕", color:"#f472b6" },
    { id:18, name:"Salidas", icon:"🎉", color:"#e879f9" },
    { id:19, name:"Apps/Suscr.", icon:"📱", color:"#38bdf8" },
    { id:20, name:"Antojos", icon:"🍫", color:"#fca5a1" },
    { id:21, name:"Otros", icon:"📦", color:"#94a3b8" },
  ],
  debt: [
    { id:22, name:"Tarjeta crédito", icon:"💳", color:"#f87171" },
    { id:23, name:"Préstamo", icon:"🏦", color:"#fb923c" },
    { id:24, name:"Deuda personal", icon:"🤝", color:"#fbbf24" },
    { id:25, name:"Hipoteca", icon:"🏠", color:"#f472b6" },
    { id:26, name:"Otra", icon:"📋", color:"#94a3b8" },
  ],
};
const allC = [...CATS.income,...CATS.expense,...CATS.debt];
const gc = (id) => allC.find(c=>c.id===id)||{name:"?",icon:"📦",color:"#94a3b8"};

const PEOPLE = [{id:"u1",name:"Tú",emoji:"👤"},{id:"u2",name:"Tu novia",emoji:"👩"}];

const SEED = [
  {id:uid(),type:"income",cid:1,amt:4500,desc:"Sueldo mayo",date:"2026-05-01",who:"u1"},
  {id:uid(),type:"income",cid:1,amt:3800,desc:"Sueldo mayo",date:"2026-05-01",who:"u2"},
  {id:uid(),type:"income",cid:2,amt:800,desc:"Proyecto web",date:"2026-05-10",who:"u1"},
  {id:uid(),type:"expense",cid:7,amt:1200,desc:"Alquiler depa",date:"2026-05-01",who:"u1"},
  {id:uid(),type:"expense",cid:8,amt:380,desc:"Luz+Agua+Internet",date:"2026-05-02",who:"u2"},
  {id:uid(),type:"expense",cid:9,amt:650,desc:"Supermercado",date:"2026-05-03",who:"u1"},
  {id:uid(),type:"expense",cid:15,amt:85,desc:"Almuerzo en la calle",date:"2026-05-04",who:"u1",ant:true},
  {id:uid(),type:"expense",cid:14,amt:12,desc:"Starbucks",date:"2026-05-05",who:"u2",ant:true},
  {id:uid(),type:"expense",cid:13,amt:28,desc:"Rappi delivery",date:"2026-05-06",who:"u1",ant:true},
  {id:uid(),type:"expense",cid:10,amt:180,desc:"Gasolina",date:"2026-05-07",who:"u1"},
  {id:uid(),type:"expense",cid:18,amt:220,desc:"Cena + cine viernes",date:"2026-05-08",who:"u2"},
  {id:uid(),type:"expense",cid:16,amt:45,desc:"Netflix+Spotify",date:"2026-05-04",who:"u1"},
  {id:uid(),type:"expense",cid:17,amt:290,desc:"Zara oferta",date:"2026-05-12",who:"u2"},
  {id:uid(),type:"expense",cid:14,amt:8,desc:"Galletas tienda",date:"2026-05-13",who:"u1",ant:true},
  {id:uid(),type:"expense",cid:20,amt:15,desc:"Chocolates",date:"2026-05-14",who:"u2",ant:true},
  {id:uid(),type:"expense",cid:13,amt:32,desc:"PedidosYa",date:"2026-05-15",who:"u1",ant:true},
  {id:uid(),type:"expense",cid:11,amt:150,desc:"Farmacia",date:"2026-05-09",who:"u1"},
  {id:uid(),type:"expense",cid:12,amt:200,desc:"Curso online",date:"2026-05-11",who:"u1"},
  {id:uid(),type:"debt",cid:22,amt:2200,desc:"VISA pendiente",date:"2026-05-01",who:"u1"},
  {id:uid(),type:"debt",cid:23,amt:5000,desc:"Préstamo banco",date:"2026-04-01",who:"u2"},
];

const getEmptyTrend = () => {
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const now = new Date();
  const currentMonth = now.getMonth();
  const list = [];
  for (let i = 5; i >= 0; i--) {
    let mIdx = currentMonth - i;
    if (mIdx < 0) mIdx += 12;
    list.push({ month: months[mIdx], ingresos: 0, gastos: 0 });
  }
  return list;
};

function Tip({active,payload,label}){
  if(!active||!payload?.length)return null;
  return(
    <div style={{background:"#1a1a2e",border:"1px solid #2a2a4a",borderRadius: 0,padding:"10px 14px"}}>
      <p style={{margin:0,fontSize:11,fontWeight:700,color:"#f4f4f5",marginBottom:4}}>{label}</p>
      {payload.map((p,i)=><p key={i} style={{margin:0,fontSize:11,color:p.color}}>{p.name}: S/ {p.value?.toLocaleString("es-PE")}</p>)}
    </div>
  );
}

// ─── Auth Screen ─────────────────────────────────────────────
function Auth({onIn}){
  const [isL,setIsL]=useState(true);
  const [em,setEm]=useState("");
  const [pw,setPw]=useState("");
  const [nm,setNm]=useState("");
  const [sh,setSh]=useState(false);
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);

  const go=async()=>{
    if (!em || !pw || (!isL && !nm)) {
      setErr("Por favor completa todos los campos.");
      return;
    }
    setErr("");
    setLoading(true);
    const cleanEmail = em.trim().toLowerCase();
    try {
      if (isL) {
        const data = await api.request("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: cleanEmail, password: pw })
        });
        onIn(data.access_token, data.user);
      } else {
        const data = await api.request("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ name: nm, email: cleanEmail, password: pw })
        });
        onIn(data.access_token, data.user);
      }
    } catch (e) {
      setErr(e.message || "Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return(
    <div style={{minHeight:"100vh",background:"#121212",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'JetBrains Mono', monospace",padding:20}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        body { margin: 0; background-color: #000000; }
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        input:focus{border-color:#3b82f6!important;box-shadow:0 0 0 3px rgba(195,247,58,0.12);}
      `}</style>
      <div style={{width:"100%",maxWidth:400,animation:"slideIn 0.5s ease-out"}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{fontSize:60,marginBottom:12,animation:"float 3s ease-in-out infinite"}}>🐷</div>
          <h1 style={{margin:0,fontSize:40,fontWeight:900,color:"#3b82f6",letterSpacing:"-0.05em"}}>MiMoney</h1>
          <p style={{margin:"8px 0 0",fontSize:14,color:"#888888",fontFamily:"'JetBrains Mono', monospace",fontWeight:600}}>Tu dinero, tu control, tus reglas.</p>
        </div>
        <div style={{background:"#1e1e24",borderRadius: 0,padding:28,border:"1px solid #3f3f46"}}>
          <div style={{display:"flex",gap:4,marginBottom:24,background:"#121212",borderRadius: 0,padding:3}}>
            {["Ingresar","Registrarse"].map((t,i)=>(
              <button key={t} disabled={loading} onClick={()=>{setIsL(i===0); setErr("");}} style={{
                flex:1,padding:"11px",borderRadius: 0,border:"none",fontSize:13,fontWeight:800,
                fontFamily:"'JetBrains Mono', monospace",cursor:"pointer",transition:"all 0.2s",
                background:(i===0?isL:!isL)?"#3b82f6":"transparent",
                color:(i===0?isL:!isL)?"#000000":"#888888",
                opacity:loading?0.5:1,
              }}>{t}</button>
            ))}
          </div>
          {err && (
            <div style={{
              padding: "12px 14px",
              borderRadius: 0,
              background: "#f8717110",
              border: "1px solid #f8717125",
              color: "#f87171",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 16,
              textAlign: "center",
              fontFamily: "'JetBrains Mono', monospace"
            }}>
              ⚠️ {err}
            </div>
          )}
          {!isL&&<div style={{marginBottom:14}}>
            <label style={{fontSize:10,fontWeight:800,color:"#888888",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:1.5}}>Nombre</label>
            <input value={nm} disabled={loading} onChange={e=>setNm(e.target.value)} placeholder="¿Cómo te llamas?" style={{
              width:"100%",padding:"13px 14px",borderRadius: 0,border:"1px solid #3f3f46",background:"#121212",
              color:"#f4f4f5",fontSize:14,outline:"none",fontFamily:"'JetBrains Mono', monospace",boxSizing:"border-box",
              opacity:loading?0.7:1,
            }}/>
          </div>}
          <div style={{marginBottom:14}}>
            <label style={{fontSize:10,fontWeight:800,color:"#888888",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:1.5}}>Email</label>
            <input type="email" value={em} disabled={loading} onChange={e=>setEm(e.target.value)} placeholder="tu@email.com" style={{
              width:"100%",padding:"13px 14px",borderRadius: 0,border:"1px solid #3f3f46",background:"#121212",
              color:"#f4f4f5",fontSize:14,outline:"none",fontFamily:"'JetBrains Mono', monospace",boxSizing:"border-box",
              opacity:loading?0.7:1,
            }}/>
          </div>
          <div style={{marginBottom:24}}>
            <label style={{fontSize:10,fontWeight:800,color:"#888888",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:1.5}}>Contraseña</label>
            <div style={{position:"relative"}}>
              <input type={sh?"text":"password"} value={pw} disabled={loading} onChange={e=>setPw(e.target.value)} placeholder="••••••••" style={{
                width:"100%",padding:"13px 14px",paddingRight:44,borderRadius: 0,border:"1px solid #3f3f46",background:"#121212",
                color:"#f4f4f5",fontSize:14,outline:"none",fontFamily:"'JetBrains Mono', monospace",boxSizing:"border-box",
                opacity:loading?0.7:1,
              }}/>
              <button disabled={loading} onClick={()=>setSh(!sh)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#888888",cursor:"pointer",padding:0}}>
                {sh?<EyeOff size={18}/>:<Eye size={18}/>}
              </button>
            </div>
          </div>
          <button onClick={go} disabled={loading} style={{
            width:"100%",padding:"15px",borderRadius: 0,border:"none",fontSize:16,fontWeight:900,
            fontFamily:"'JetBrains Mono', monospace",cursor:"pointer",background:"#3b82f6",color:"#000000",
            letterSpacing:"-0.01em",transition:"all 0.2s",
            opacity:loading?0.7:1,
          }}>{loading ? "Procesando..." : (isL ? "Entrar →" : "Crear cuenta →")}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────
function Mod({open,onClose,children,title}){
  if(!open)return null;
  return(
    <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.65)",backdropFilter:"blur(8px)",padding:16}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"#1e1e24",borderRadius: 0,width:"100%",maxWidth:460,
        border:"1px solid #3f3f46",boxShadow:"0 32px 64px rgba(0,0,0,0.5)",
        animation:"slideIn 0.25s ease-out",maxHeight:"90vh",overflowY:"auto",
      }}>
        <div style={{padding:"18px 24px",borderBottom:"1px solid #27272a",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#1e1e24",zIndex:1,borderRadius: 0}}>
          <h3 style={{margin:0,fontSize:17,fontWeight:800,color:"#f4f4f5",fontFamily:"'JetBrains Mono', monospace"}}>{title}</h3>
          <button onClick={onClose} style={{background:"#27272a",border:"none",cursor:"pointer",color:"#a1a1aa",padding:6,borderRadius: 0,display:"flex"}}><X size={18}/></button>
        </div>
        <div style={{padding:24}}>{children}</div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────
export default function MiMoneyApp(){
  const [user,setUser]=useState(null);
  const [txs,setTxs]=useState([]);
  const [dashData,setDashData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [pendingReqs, setPendingReqs]=useState([]);
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerCode, setPartnerCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState(null);
  const [error,setError]=useState("");
  const [view,setView]=useState("dash");
  const [fu,setFu]=useState("all");
  const [modal,setModal]=useState(null);
  const [nudge,setNudge]=useState("");
  const [confirm,setConfirm]=useState(false);
  const [pending,setPending]=useState(null);
  const [budget,setBudget]=useState(0);
  const [goal,setGoal]=useState(0);

  const [tempBudget,setTempBudget]=useState("");
  const [tempGoal,setTempGoal]=useState("");
  const [form,setF]=useState({amt:"",desc:"",cid:null,date:new Date().toISOString().split("T")[0],who:1});
  const [stOpen,setStOpen]=useState(false);
  const [mobileAdd,setMobileAdd]=useState(false);

  const PEOPLE = useMemo(() => {
    if (!user) return [];
    const list = [{ id: user.id, name: "Tú", emoji: user.avatar_emoji || "👤" }];
    if (dashData && dashData.by_user) {
      Object.entries(dashData.by_user).forEach(([uidStr, u]) => {
        const uid = parseInt(uidStr);
        if (uid !== user.id) {
          list.push({ id: uid, name: u.name, emoji: u.avatar || "👩" });
        }
      });
    } else if (user.partner_id) {
      list.push({ id: user.partner_id, name: "Pareja", emoji: "👩" });
    }
    return list;
  }, [user, dashData]);

  const f=useMemo(()=>fu==="all"?txs:txs.filter(t=>t.who===fu),[txs,fu]);
  const inc=useMemo(()=>f.filter(t=>t.type==="income").reduce((s,t)=>s+t.amt,0),[f]);
  const exp=useMemo(()=>f.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amt,0),[f]);
  const dbt=useMemo(()=>f.filter(t=>t.type==="debt").reduce((s,t)=>s+t.amt,0),[f]);
  const bal=inc-exp;
  const ants=useMemo(()=>f.filter(t=>t.ant),[f]);
  const antT=ants.reduce((s,t)=>s+t.amt,0);
  const bPct=budget>0?Math.min((exp/budget)*100,100):0;
  const saved=Math.max(0,bal);
  const sPct=goal>0?Math.min((saved/goal)*100,100):0;
  const red=bal<0;
  const over=budget>0&&exp>budget;
  const near=budget>0&&bPct>80&&!over;

  const ebc=useMemo(()=>{
    const m={};
    f.filter(t=>t.type==="expense").forEach(t=>{
      const c=gc(t.cid);
      if(!m[t.cid])m[t.cid]={name:c.name,icon:c.icon,color:c.color,value:0,ess:c.ess};
      m[t.cid].value+=t.amt;
    });
    return Object.values(m).sort((a,b)=>b.value-a.value);
  },[f]);

  const uc=useMemo(() => PEOPLE.map(u=>({
    name:u.name,
    ingresos:txs.filter(t=>t.who===u.id&&t.type==="income").reduce((s,t)=>s+t.amt,0),
    gastos:txs.filter(t=>t.who===u.id&&t.type==="expense").reduce((s,t)=>s+t.amt,0),
  })), [PEOPLE, txs]);

  const fetchData = async () => {
    try {
      const [txsData, dash] = await Promise.all([
        api.request("/api/transactions"),
        api.request("/api/dashboard")
      ]);
      const mappedTxs = txsData.map(t => ({
        id: t.id,
        type: t.type,
        cid: t.category_id,
        amt: t.amount,
        desc: t.description,
        date: t.date,
        who: t.user_id,
        ant: t.is_ant_expense
      }));
      setTxs(mappedTxs);
      setDashData(dash);
      setError("");
    } catch (e) {
      console.error(e);
      setError("Error al sincronizar datos.");
    }
  };

  const handleLogin = async (token, userData) => {
    api.setToken(token);
    setUser(userData);
    setBudget(userData.monthly_budget);
    setGoal(userData.savings_goal);
    setLoading(true);
    await fetchData();
    setLoading(false);
  };

  const handleLogout = () => {
    api.clearToken();
    setUser(null);
    setTxs([]);
    setDashData(null);
  };

  useEffect(() => {
    const init = async () => {
      const token = api.getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const u = await api.request("/api/auth/me");
        setUser(u);
        setBudget(u.monthly_budget);
        setGoal(u.savings_goal);
        const [txsData, dash] = await Promise.all([
          api.request("/api/transactions"),
          api.request("/api/dashboard")
        ]);
        const mappedTxs = txsData.map(t => ({
          id: t.id,
          type: t.type,
          cid: t.category_id,
          amt: t.amount,
          desc: t.description,
          date: t.date,
          who: t.user_id,
          ant: t.is_ant_expense
        }));
        setTxs(mappedTxs);
        setDashData(dash);
      } catch (e) {
        console.error("Token no válido o expirado:", e);
        api.clearToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const openAdd=(t)=>{
    const cs=CATS[t];
    setF({amt:"",desc:"",cid:cs[0]?.id,date:new Date().toISOString().split("T")[0],who:user?.id || 1});
    setModal(t);setNudge("");setConfirm(false);
  };

  const tryAdd=()=>{
    if(!form.amt||!form.desc||!form.cid)return;
    const c=gc(form.cid);
    const isAnt=modal==="expense"&&!c.ess&&parseFloat(form.amt)<=20;
    const tx={type:modal,cid:form.cid,amt:parseFloat(form.amt),desc:form.desc,date:form.date,who:form.who,ant:isAnt};
    if(modal==="expense"&&!c.ess){
      let msg=pick(NUDGES.before);
      if(isAnt)msg=pick(NUDGES.ant).replace("{count}",ants.length+1).replace("{total}",(antT+tx.amt).toFixed(2));
      if(over)msg=pick(NUDGES.red);
      else if(near)msg=pick(NUDGES.near).replace("{pct}",bPct.toFixed(0));
      setNudge(msg);setPending(tx);setConfirm(true);return;
    }
    commit(tx);
  };

  const commit=async(tx)=>{
    try {
      await api.request("/api/transactions", {
        method: "POST",
        body: JSON.stringify({
          type: tx.type,
          amount: tx.amt,
          description: tx.desc,
          date: tx.date,
          category_id: tx.cid
        })
      });
      await fetchData();
      setModal(null);setNudge("");setConfirm(false);setPending(null);
    } catch(e) {
      alert(e.message || "Error al registrar transacción");
    }
  };

  const doSpend=()=>{if(pending)commit(pending);};
  const noSpend=()=>{setConfirm(false);setPending(null);setNudge("");};

  const del=async(id)=>{
    if (!window.confirm("¿Seguro que deseas eliminar este movimiento?")) return;
    try {
      await api.request(`/api/transactions/${id}`, {
        method: "DELETE"
      });
      await fetchData();
    } catch(e) {
      alert(e.message || "Error al eliminar transacción");
    }
  };

  const saveSettings = async () => {
    const bVal = parseFloat(tempBudget) || 0;
    const gVal = parseFloat(tempGoal) || 0;
    try {
      const u = await api.request("/api/auth/me", {
        method: "PUT",
        body: JSON.stringify({
          monthly_budget: bVal,
          savings_goal: gVal
        })
      });
      setUser(u);
      setBudget(u.monthly_budget);
      setGoal(u.savings_goal);
      await fetchData();
    } catch(e) {
      alert(e.message || "Error al guardar configuración");
    }
  };

  const linkPartner = async () => {
    if (!partnerEmail) return;
    try {
      const res = await api.request("/api/auth/link-partner/request", {
        method: "POST",
        body: JSON.stringify({ partner_email: partnerEmail })
      });
      alert(res.message);
      const u = await api.request("/api/auth/me");
      setUser(u);
      await fetchData();
      setPartnerEmail("");
    } catch(e) {
      alert(e.message || "Error al vincular pareja");
    }
  };

  const unlinkPartner = async () => {
    if (!confirm("¿Estás seguro de que quieres desvincular a tu pareja? Esta acción afectará a ambos.")) return;
    try {
      await api.request("/api/auth/link-partner", { method: "DELETE" });
      alert("Desvinculación exitosa");
      const u = await api.request("/api/auth/me");
      setUser(u);
      await fetchData();
    } catch(e) {
      alert(e.message || "Error al desvincular pareja");
    }
  };

  const fmt=(n)=>n.toLocaleString("es-PE",{minimumFractionDigits:2,maximumFractionDigits:2});

  if (loading) {
    return (
      <div style={{minHeight:"100vh",background:"#121212",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'JetBrains Mono', monospace"}}>
        <div style={{textAlign:"center",color:"#ffffff",fontSize:18,fontWeight:700}}>
          <div style={{fontSize:48,marginBottom:16,animation:"float 1.5s ease-in-out infinite"}}>🐷</div>
          Cargando MiMoney...
        </div>
      </div>
    );
  }

  if(!user)return <Auth onIn={handleLogin}/>;

  const sCol=red?"#f87171":over?"#ef4444":near?"#3b82f6":"#3b82f6";
  const sE=red?"🔴":over?"🟠":near?"🟡":"🟢";
  const nav=[{id:"dash",icon:LayoutDashboard,label:"Dashboard"},{id:"txs",icon:List,label:"Movimientos"},{id:"debts",icon:CreditCard,label:"Deudas"}];

  return(
    <div style={{height:"100vh",overflow:"hidden",background:"#121212",fontFamily:"'JetBrains Mono', monospace",color:"#f4f4f5"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        @keyframes slideIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .hl{transition:all 0.2s;cursor:pointer;} .hl:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.3)!important;}
        .hb{transition:background 0.15s;} .hb:hover{background:#1a1a2e!important;}
        .db{opacity:0;transition:opacity 0.15s;} .hb:hover .db{opacity:1;}
        select option{background:#111111;color:#ffffff;}
        input:focus,select:focus{border-color:#3b82f6!important;box-shadow:0 0 0 3px rgba(195,247,58,0.1);}
        @media(max-width:768px){.dnav{display:none!important;}.mnav{display:flex!important;}.sg4{grid-template-columns:repeat(2,1fr)!important;}.sg2{grid-template-columns:1fr!important;}.ma{margin-left:0!important;padding:16px!important;padding-bottom:80px!important;}.hc{display:none!important;}.dg2{grid-template-columns:1fr!important;}}
        @media(min-width:769px){.mnav{display:none!important;}}
      `}</style>

      {/* HEADER */}
      <header style={{padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #27272a",background:"#121212",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:24}}>🐷</span>
          <div>
            <h1 style={{margin:0,fontSize:20,fontWeight:900,color:"#3b82f6",letterSpacing:"-0.04em",fontFamily:"'JetBrains Mono', monospace",lineHeight:1}}>MiMoney</h1>
            <span style={{fontSize:10,color:"#888888",fontWeight:700,fontFamily:"'JetBrains Mono', monospace",letterSpacing:1,textTransform:"uppercase"}}>{sE} {red?"En rojos":over?"Excedido":near?"Cuidado":"Todo bien"}</span>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {PEOPLE.length > 1 && (
            <div className="hc" style={{display:"flex",gap:3,background:"#1e1e24",borderRadius: 0,padding:3,marginRight:4}}>
              {[{id:"all",label:"Todos"},...PEOPLE.map(u=>({id:u.id,label:u.emoji}))].map(u=>(
                <button key={u.id} onClick={()=>setFu(u.id)} style={{padding:"6px 12px",borderRadius: 0,border:"none",fontSize:12,fontWeight:700,fontFamily:"'JetBrains Mono', monospace",cursor:"pointer",transition:"all 0.15s",background:fu===u.id?"#3b82f6":"transparent",color:fu===u.id?"#000000":"#888888"}}>{u.label}</button>
              ))}
            </div>
          )}
          <button onClick={()=>{ setTempBudget(user?.monthly_budget || 0); setTempGoal(user?.savings_goal || 0); setStOpen(true); }} style={{width:34,height:34,borderRadius: 0,border:"1px solid #3f3f46",background:"transparent",color:"#888888",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Settings size={16}/></button>
          <button onClick={handleLogout} style={{width:34,height:34,borderRadius: 0,border:"1px solid #3f3f46",background:"transparent",color:"#888888",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><LogOut size={16}/></button>
        </div>
      </header>

      <div style={{display:"flex"}}>
        {/* SIDEBAR */}
        <nav className="dnav" style={{width:220,padding:"16px 10px",borderRight:"1px solid #27272a",background:"#121212",minHeight:"calc(100vh - 53px)",display:"flex",flexDirection:"column",gap:4,position:"sticky",top:53,alignSelf:"flex-start"}}>
          <div style={{padding:"0 10px",marginBottom:8}}><div style={{fontSize:12,color:"#a1a1aa",fontWeight:700,fontFamily:"'JetBrains Mono', monospace"}}>Hola, {user.name} 👋</div></div>
          {nav.map(n=>(
            <button key={n.id} className="hb" onClick={()=>setView(n.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius: 0,border:"none",fontSize:13,fontWeight:700,fontFamily:"'JetBrains Mono', monospace",width:"100%",textAlign:"left",cursor:"pointer",background:"transparent",color:view===n.id?"#ffffff":"#71717a"}}><n.icon size={18}/>{n.label}</button>
          ))}
          <div style={{flex:1}}/>
          <div style={{borderTop:"1px solid #27272a",paddingTop:12,display:"flex",flexDirection:"column",gap:4}}>
            <span style={{fontSize:9,fontWeight:800,color:"#a1a1aa",textTransform:"uppercase",letterSpacing:1.5,padding:"0 14px",fontFamily:"'JetBrains Mono', monospace"}}>Registrar</span>
            {[{t:"income",l:"Ingreso",icon:TrendingUp,c:"#3b82f6"},{t:"expense",l:"Gasto",icon:TrendingDown,c:"#ef4444"},{t:"debt",l:"Deuda",icon:CreditCard,c:"#3b82f6"}].map(b=>(
              <button key={b.t} className="hb" onClick={()=>openAdd(b.t)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius: 0,border:"none",fontSize:13,fontWeight:700,fontFamily:"'JetBrains Mono', monospace",width:"100%",textAlign:"left",background:"transparent",color:"#71717a",cursor:"pointer"}}><b.icon size={16}/>{b.l}</button>
            ))}
          </div>
          {ants.length>0&&(
            <div style={{marginTop:8,padding:"12px 14px",borderRadius: 0,background:"#3b82f610",border:"1px solid #3b82f625"}}>
              <div style={{fontSize:11,fontWeight:800,color:"#3b82f6",fontFamily:"'JetBrains Mono', monospace",display:"flex",alignItems:"center",gap:6}}><Bug size={14}/>Gastos Hormiga</div>
              <div style={{fontSize:20,fontWeight:800,color:"#ffffff",fontFamily:"'JetBrains Mono',monospace",marginTop:4}}>S/ {fmt(antT)}</div>
              <div style={{fontSize:10,color:"#8b7a5a",marginTop:2}}>{ants.length} gastos este mes</div>
            </div>
          )}
        </nav>

        {/* MAIN */}
        <main className="ma" style={{flex:1,padding:24,overflowY:"auto",maxHeight:"calc(100vh - 53px)"}}>
          {view==="dash"&&(
            <div style={{animation:"fadeIn 0.3s ease-out"}}>
              {(red||over)&&(
                <div style={{padding:"14px 20px",borderRadius: 0,marginBottom:20,display:"flex",alignItems:"center",gap:12,background:red?"#f8717112":"#ef444412",border:`1px solid ${red?"#f8717135":"#ef444435"}`,animation:"shake 0.4s ease-out"}}>
                  <AlertTriangle size={20} color={red?"#f87171":"#ef4444"}/>
                  <div>
                    <div style={{fontSize:13,fontWeight:800,color:red?"#f87171":"#ef4444",fontFamily:"'JetBrains Mono', monospace"}}>{red?"🚨 ¡Estás en números rojos!":"⚠️ Presupuesto excedido"}</div>
                    <div style={{fontSize:12,color:"#a1a1aa",marginTop:2}}>{pick(NUDGES.red)}</div>
                  </div>
                </div>
              )}
              {!red&&!over&&saved>0&&(
                <div style={{padding:"14px 20px",borderRadius: 0,marginBottom:20,background:"#3b82f608",border:"1px solid #3b82f618",display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:24,animation:"float 2.5s ease-in-out infinite"}}>💚</span>
                  <div style={{fontSize:13,color:"#059669",fontWeight:600}}>{pick(NUDGES.save).replace("{saved}",fmt(saved)).replace("{pct}",sPct.toFixed(0))}</div>
                </div>
              )}

              {/* STATS */}
              <div className="sg4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
                {[
                  {icon:Wallet,label:"Balance",val:bal,color:sCol,pre:bal>=0?"+":"",sub:`${sE} ${red?"Negativo":"Disponible"}`},
                  {icon:TrendingUp,label:"Ingresos",val:inc,color:"#22d3ee",pre:"+",sub:"Este mes"},
                  {icon:TrendingDown,label:"Gastos",val:exp,color:"#ef4444",pre:"-",sub:`${bPct.toFixed(0)}% del presupuesto`},
                  {icon:Target,label:"Ahorro",val:saved,color:"#3b82f6",pre:"+",sub:`${sPct.toFixed(0)}% de meta`},
                ].map((s,i)=>(
                  <div key={i} className="hl" style={{background:"#1e1e24",borderRadius: 0,padding:"18px 20px",border:"1px solid #3f3f46",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:-15,right:-15,width:60,height:60,borderRadius:"50%",background:s.color,opacity:0.06}}/>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                      <div style={{width:32,height:32,borderRadius: 0,background:`${s.color}15`,display:"flex",alignItems:"center",justifyContent:"center"}}><s.icon size={16} color={s.color}/></div>
                      <span style={{fontSize:11,color:"#888888",fontWeight:700,fontFamily:"'JetBrains Mono', monospace",textTransform:"uppercase",letterSpacing:0.5}}>{s.label}</span>
                    </div>
                    <div style={{fontSize:22,fontWeight:800,color:"#ffffff",fontFamily:"'JetBrains Mono',monospace",letterSpacing:"-0.02em",lineHeight:1}}>{s.pre}S/ {fmt(Math.abs(s.val))}</div>
                    <div style={{fontSize:10,color:"#a1a1aa",marginTop:6,fontWeight:600}}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* BUDGET + SAVINGS BARS */}
              <div className="sg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
                <div style={{background:"#1e1e24",borderRadius: 0,padding:"18px 20px",border:"1px solid #3f3f46"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <span style={{fontSize:12,fontWeight:800,color:"#f4f4f5",fontFamily:"'JetBrains Mono', monospace"}}>📊 Presupuesto</span>
                    <span style={{fontSize:12,fontWeight:700,color:"#ffffff",fontFamily:"'JetBrains Mono',monospace"}}>S/ {fmt(exp)} / {fmt(budget)}</span>
                  </div>
                  <div style={{height:10,background:"#27272a",borderRadius: 0,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${bPct}%`,borderRadius: 0,transition:"all 0.6s",background:over?"#f87171":near?"#3b82f6":bPct>60?"#fbbf24":"#3b82f6"}}/>
                  </div>
                  <div style={{fontSize:10,color:"#a1a1aa",marginTop:6}}>{over?"⛔ Excedido":near?"⚡ Poco margen":`✅ Quedan S/ ${fmt(budget-exp)}`}</div>
                </div>
                <div style={{background:"#1e1e24",borderRadius: 0,padding:"18px 20px",border:"1px solid #3f3f46"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <span style={{fontSize:12,fontWeight:800,color:"#f4f4f5",fontFamily:"'JetBrains Mono', monospace"}}>🎯 Meta Ahorro</span>
                    <span style={{fontSize:12,fontWeight:700,color:"#ffffff",fontFamily:"'JetBrains Mono',monospace"}}>S/ {fmt(saved)} / {fmt(goal)}</span>
                  </div>
                  <div style={{height:10,background:"#27272a",borderRadius: 0,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${sPct}%`,borderRadius: 0,transition:"all 0.6s",background:"linear-gradient(90deg,#3b82f6,#34d399)"}}/>
                  </div>
                  <div style={{fontSize:10,color:"#a1a1aa",marginTop:6}}>{sPct>=100?"🎉 ¡Meta alcanzada!":sPct>50?"🚀 Buen camino":"💪 Cada sol suma"}</div>
                </div>
              </div>

              {/* CHARTS */}
              <div className="sg2" style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:12,marginBottom:20}}>
                <div style={{background:"#1e1e24",borderRadius: 0,padding:20,border:"1px solid #3f3f46"}}>
                  <h3 style={{margin:"0 0 14px",fontSize:13,fontWeight:800,color:"#f4f4f5",fontFamily:"'JetBrains Mono', monospace"}}>📈 Tendencia</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={dashData?.monthly_trend || getEmptyTrend()}>
                      <defs>
                        <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3}/><stop offset="100%" stopColor="#22d3ee" stopOpacity={0}/></linearGradient>
                        <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="100%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a"/>
                      <XAxis dataKey="month" tick={{fill:"#3a3a5a",fontSize:11,fontFamily:"'JetBrains Mono', monospace"}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:"#3a3a5a",fontSize:11}} axisLine={false} tickLine={false}/>
                      <Tooltip content={<Tip/>} cursor={{fill:"transparent"}}/>
                      <Area type="monotone" dataKey="ingresos" stroke="#22d3ee" strokeWidth={2} fill="url(#gi)" name="Ingresos"/>
                      <Area type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={2} fill="url(#ge)" name="Gastos"/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div style={{background:"#1e1e24",borderRadius: 0,padding:20,border:"1px solid #3f3f46"}}>
                  <h3 style={{margin:"0 0 14px",fontSize:13,fontWeight:800,color:"#f4f4f5",fontFamily:"'JetBrains Mono', monospace"}}>🍕 ¿A dónde se va?</h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart><Pie data={ebc} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={3} dataKey="value">{ebc.map((c,i)=><Cell key={i} fill={c.color}/>)}</Pie><Tooltip content={<Tip/>} cursor={{fill:"transparent"}}/></PieChart>
                  </ResponsiveContainer>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",marginTop:8}}>
                    {ebc.slice(0,6).map(c=><span key={c.name} style={{fontSize:10,color:"#888888",display:"flex",alignItems:"center",gap:3}}><span style={{width:7,height:7,borderRadius:"50%",background:c.color,display:"inline-block"}}/>{c.icon} {c.name}</span>)}
                  </div>
                </div>
              </div>

              {/* BOTTOM */}
              <div className="sg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
                <div style={{background:"#1e1e24",borderRadius: 0,padding:20,border:"1px solid #3f3f46"}}>
                  <h3 style={{margin:"0 0 14px",fontSize:13,fontWeight:800,color:"#f4f4f5",fontFamily:"'JetBrains Mono', monospace"}}>📋 Desglose Gastos</h3>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {ebc.map(c=>{const p=exp>0?(c.value/exp*100):0;return(
                      <div key={c.name}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                          <span style={{fontSize:12,fontWeight:700,color:"#f4f4f5",fontFamily:"'JetBrains Mono', monospace"}}>{c.icon} {c.name} {c.ess&&<span style={{fontSize:9,color:"#22d3ee",marginLeft:4,fontWeight:800}}>ESS</span>}</span>
                          <span style={{fontSize:12,color:"#ffffff",fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>S/ {fmt(c.value)}</span>
                        </div>
                        <div style={{height:5,background:"#27272a",borderRadius: 0,overflow:"hidden"}}><div style={{height:"100%",width:`${p}%`,background:c.color,borderRadius: 0,transition:"width 0.5s"}}/></div>
                      </div>
                    );})}
                  </div>
                </div>
                <div style={{background:"#1e1e24",borderRadius: 0,padding:20,border:"1px solid #3f3f46"}}>
                  <h3 style={{margin:"0 0 14px",fontSize:13,fontWeight:800,color:"#f4f4f5",fontFamily:"'JetBrains Mono', monospace"}}>👫 ¿Quién gasta más?</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={uc} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a"/>
                      <XAxis dataKey="name" tick={{fill:"#888888",fontSize:12,fontFamily:"'JetBrains Mono', monospace"}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:"#3a3a5a",fontSize:11}} axisLine={false} tickLine={false}/>
                      <Tooltip content={<Tip/>} cursor={{fill:"transparent"}}/>
                      <Bar dataKey="ingresos" fill="#22d3ee" radius={[6,6,0,0]} name="Ingresos"/>
                      <Bar dataKey="gastos" fill="#ef4444" radius={[6,6,0,0]} name="Gastos"/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* RECENT */}
              <div style={{background:"#1e1e24",borderRadius: 0,padding:20,border:"1px solid #3f3f46"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <h3 style={{margin:0,fontSize:13,fontWeight:800,color:"#f4f4f5",fontFamily:"'JetBrains Mono', monospace"}}>🕐 Últimos Movimientos</h3>
                  <button onClick={()=>setView("txs")} style={{background:"none",border:"none",color:"#3b82f6",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'JetBrains Mono', monospace"}}>Ver todos →</button>
                </div>
                {f.filter(t=>t.type!=="debt").slice(0,5).map(t=>{const c=gc(t.cid);const u=PEOPLE.find(p=>p.id===t.who);return(
                  <div key={t.id} className="hb" style={{display:"flex",alignItems:"center",padding:"10px 8px",borderRadius: 0,marginBottom:2}}>
                    <span style={{fontSize:20,marginRight:12,width:32,textAlign:"center"}}>{c.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#f4f4f5",fontFamily:"'JetBrains Mono', monospace",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                        {t.desc} {t.ant&&<span style={{fontSize:9,color:"#3b82f6",fontWeight:800,background:"#3b82f618",padding:"2px 6px",borderRadius: 0,marginLeft:6}}>🐜 HORMIGA</span>}
                      </div>
                      <div style={{fontSize:11,color:"#a1a1aa"}}>{c.name} · {u?.emoji} {u?.name}</div>
                    </div>
                    <span style={{fontSize:14,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color:"#ffffff",whiteSpace:"nowrap"}}>{t.type==="income"?"+":"-"}S/ {fmt(t.amt)}</span>
                  </div>
                );})}
              </div>
            </div>
          )}

          {view==="txs"&&(
            <div style={{animation:"fadeIn 0.3s ease-out"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <h2 style={{margin:0,fontSize:20,fontWeight:900,fontFamily:"'JetBrains Mono', monospace"}}>📋 Movimientos</h2>
                <span style={{fontSize:12,color:"#a1a1aa",fontFamily:"'JetBrains Mono',monospace"}}>{f.filter(t=>t.type!=="debt").length} registros</span>
              </div>
              <div style={{display:"flex",gap:3,background:"#1e1e24",borderRadius: 0,padding:3,marginBottom:16}}>
                {[{id:"all",label:"Todos"},...PEOPLE.map(u=>({id:u.id,label:`${u.emoji} ${u.name}`}))].map(u=>(
                  <button key={u.id} onClick={()=>setFu(u.id)} style={{flex:1,padding:"8px",borderRadius: 0,border:"none",fontSize:12,fontWeight:700,fontFamily:"'JetBrains Mono', monospace",cursor:"pointer",background:fu===u.id?"#3b82f6":"transparent",color:fu===u.id?"#000000":"#888888"}}>{u.label}</button>
                ))}
              </div>
              <div style={{background:"#1e1e24",borderRadius: 0,border:"1px solid #3f3f46",overflow:"hidden"}}>
                {f.filter(t=>t.type!=="debt").sort((a,b)=>new Date(b.date)-new Date(a.date)).map(t=>{const c=gc(t.cid);const u=PEOPLE.find(p=>p.id===t.who);return(
                  <div key={t.id} className="hb" style={{display:"flex",alignItems:"center",padding:"14px 20px",borderBottom:"1px solid #151525"}}>
                    <span style={{fontSize:22,marginRight:14,width:36,textAlign:"center"}}>{c.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:700,color:"#f4f4f5",fontFamily:"'JetBrains Mono', monospace",display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                        <span style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.desc}</span>
                        {t.ant&&<span style={{fontSize:9,color:"#3b82f6",fontWeight:800,background:"#3b82f618",padding:"2px 6px",borderRadius: 0}}>🐜 HORMIGA</span>}
                      </div>
                      <div style={{fontSize:11,color:"#a1a1aa",marginTop:3,display:"flex",gap:8,flexWrap:"wrap"}}>
                        <span>{c.name}</span><span>{t.date}</span><span>{u?.emoji} {u?.name}</span>
                      </div>
                    </div>
                    <span style={{fontSize:15,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color:"#ffffff",marginRight:10,whiteSpace:"nowrap"}}>{t.type==="income"?"+":"-"}S/ {fmt(t.amt)}</span>
                    <button className="db" onClick={()=>del(t.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#f87171",padding:4}}><Trash2 size={16}/></button>
                  </div>
                );})}
              </div>
            </div>
          )}

          {view==="debts"&&(
            <div style={{animation:"fadeIn 0.3s ease-out"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
                <h2 style={{margin:0,fontSize:20,fontWeight:900,fontFamily:"'JetBrains Mono', monospace"}}>💳 Deudas</h2>
                <div style={{padding:"8px 16px",borderRadius: 0,background:"#3b82f612",border:"1px solid #3b82f625",color:"#3b82f6",fontSize:14,fontWeight:800,fontFamily:"'JetBrains Mono',monospace"}}>Total: S/ {fmt(dbt)}</div>
              </div>
              <div className="dg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {f.filter(t=>t.type==="debt").map(t=>{const c=gc(t.cid);const u=PEOPLE.find(p=>p.id===t.who);return(
                  <div key={t.id} className="hl" style={{background:"#1e1e24",borderRadius: 0,padding:20,border:"1px solid #3f3f46",borderLeft:`4px solid ${c.color}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontSize:15,fontWeight:800,color:"#f4f4f5",fontFamily:"'JetBrains Mono', monospace"}}>{c.icon} {t.desc}</div>
                        <div style={{fontSize:11,color:"#a1a1aa",marginTop:4}}>{c.name} · {u?.emoji} {u?.name}</div>
                      </div>
                      <button onClick={()=>del(t.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#a1a1aa",padding:4}}><Trash2 size={16}/></button>
                    </div>
                    <div style={{fontSize:28,fontWeight:800,color:"#ffffff",fontFamily:"'JetBrains Mono',monospace",marginTop:12}}>S/ {fmt(t.amt)}</div>
                  </div>
                );})}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MOBILE NAV */}
      <div className="mnav" style={{display:"none",position:"fixed",bottom:0,left:0,right:0,background:"#121212",borderTop:"1px solid #27272a",padding:"8px 16px",justifyContent:"space-around",zIndex:100}}>
        {nav.map(n=>(
          <button key={n.id} onClick={()=>{setView(n.id);setMobileAdd(false);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"6px 16px",borderRadius: 0,border:"none",cursor:"pointer",background:"transparent",color:view===n.id?"#3b82f6":"#3a3a5a",fontSize:10,fontWeight:700,fontFamily:"'JetBrains Mono', monospace"}}><n.icon size={20}/>{n.label}</button>
        ))}
        <div style={{position:"relative"}}>
          {mobileAdd&&(
            <div style={{position:"absolute",bottom:"100%",right:0,marginBottom:8,background:"#1e1e24",border:"1px solid #3f3f46",padding:6,display:"flex",flexDirection:"column",gap:4,minWidth:140,zIndex:200}}>
              {[{t:"income",l:"Ingreso",icon:TrendingUp},{t:"expense",l:"Gasto",icon:TrendingDown},{t:"debt",l:"Deuda",icon:CreditCard}].map(b=>(
                <button key={b.t} onClick={()=>{openAdd(b.t);setMobileAdd(false);}} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",border:"none",background:"transparent",color:"#f4f4f5",fontSize:12,fontWeight:700,fontFamily:"'JetBrains Mono', monospace",cursor:"pointer",width:"100%",textAlign:"left"}} className="hb"><b.icon size={16}/>{b.l}</button>
              ))}
            </div>
          )}
          <button onClick={()=>setMobileAdd(!mobileAdd)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"6px 16px",borderRadius: 0,border:"none",cursor:"pointer",background:mobileAdd?"#3b82f625":"#3b82f615",color:"#3b82f6",fontSize:10,fontWeight:700,fontFamily:"'JetBrains Mono', monospace"}}><Plus size={20}/>Agregar</button>
        </div>
      </div>

      {/* ADD MODAL */}
      <Mod open={!!modal} onClose={()=>{setModal(null);setConfirm(false);}} title={modal==="income"?"💰 Registrar Ingreso":modal==="expense"?"💸 Registrar Gasto":"💳 Registrar Deuda"}>
        {!confirm?(
          <>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:10,fontWeight:800,color:"#a1a1aa",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:1.5,fontFamily:"'JetBrains Mono', monospace"}}>Monto (S/)</label>
              <input type="number" value={form.amt} onChange={e=>setF({...form,amt:e.target.value})} placeholder="0.00" style={{width:"100%",padding:"14px 16px",borderRadius: 0,border:"1px solid #3f3f46",background:"#121212",color:modal==="income"?"#22d3ee":"#ef4444",fontSize:24,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",outline:"none",boxSizing:"border-box",textAlign:"center"}}/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:10,fontWeight:800,color:"#a1a1aa",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:1.5,fontFamily:"'JetBrains Mono', monospace"}}>Descripción</label>
              <input value={form.desc} onChange={e=>setF({...form,desc:e.target.value})} placeholder="¿En qué se fue la plata?" style={{width:"100%",padding:"12px 14px",borderRadius: 0,border:"1px solid #3f3f46",background:"#121212",color:"#f4f4f5",fontSize:14,outline:"none",fontFamily:"'JetBrains Mono', monospace",boxSizing:"border-box"}}/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:10,fontWeight:800,color:"#a1a1aa",display:"block",marginBottom:8,textTransform:"uppercase",letterSpacing:1.5,fontFamily:"'JetBrains Mono', monospace"}}>Categoría</label>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,maxHeight:200,overflowY:"auto",paddingRight:4}}>
                {(CATS[modal||"expense"]||[]).map(c=>(
                  <button key={c.id} onClick={()=>setF({...form,cid:c.id})} style={{padding:"10px 8px",borderRadius: 0,border:form.cid===c.id?`2px solid ${c.color}`:"1px solid #27272a",background:form.cid===c.id?`${c.color}15`:"#000000",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,transition:"all 0.15s"}}>
                    <span style={{fontSize:20}}>{c.icon}</span>
                    <span style={{fontSize:10,fontWeight:700,color:form.cid===c.id?c.color:"#888888",fontFamily:"'JetBrains Mono', monospace",textAlign:"center",lineHeight:1.2}}>{c.name}</span>
                    {c.ess&&<span style={{fontSize:8,color:"#22d3ee",fontWeight:800}}>ESENCIAL</span>}
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:10,fontWeight:800,color:"#a1a1aa",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:1.5,fontFamily:"'JetBrains Mono', monospace"}}>Fecha</label>
              <input type="date" value={form.date} onChange={e=>setF({...form,date:e.target.value})} style={{width:"100%",padding:"10px 12px",borderRadius: 0,border:"1px solid #3f3f46",background:"#121212",color:"#f4f4f5",fontSize:13,outline:"none",fontFamily:"'JetBrains Mono', monospace",boxSizing:"border-box"}}/>
            </div>
            {modal==="expense"&&form.cid&&!gc(form.cid).ess&&form.amt&&(
              <div style={{padding:"10px 14px",borderRadius: 0,background:"#3b82f610",border:"1px solid #3b82f618",marginBottom:14}}>
                <div style={{fontSize:12,color:"#d4a040",fontWeight:600}}>💭 {pick(NUDGES.before)}</div>
              </div>
            )}
            <button onClick={tryAdd} style={{width:"100%",padding:"14px",borderRadius: 0,border:"none",fontSize:15,fontWeight:800,fontFamily:"'JetBrains Mono', monospace",cursor:"pointer",letterSpacing:"-0.01em",transition:"all 0.2s",background:modal==="income"?"#22d3ee":modal==="expense"?"#ef4444":"#3b82f6",color:modal==="income"?"#000000":"#fff"}}>
              Registrar {modal==="income"?"Ingreso":modal==="expense"?"Gasto":"Deuda"}
            </button>
          </>
        ):(
          <div style={{textAlign:"center",animation:"slideIn 0.3s ease-out"}}>
            <div style={{fontSize:48,marginBottom:16,animation:"shake 0.5s ease-out"}}>🤔</div>
            <div style={{fontSize:17,fontWeight:900,color:"#f4f4f5",marginBottom:8,fontFamily:"'JetBrains Mono', monospace"}}>¿Estás seguro?</div>
            <div style={{fontSize:14,color:"#3b82f6",marginBottom:8,fontWeight:600,padding:"14px 18px",background:"#3b82f610",borderRadius: 0,lineHeight:1.6}}>{nudge}</div>
            {pending&&(
              <div style={{fontSize:14,color:"#ef4444",marginBottom:16,fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>
                Tu balance pasaría a: S/ {fmt(bal-pending.amt)}
                {bal-pending.amt<0&&<span style={{display:"block",color:"#f87171",fontSize:12,marginTop:4,fontWeight:800}}>⚠️ Quedarías en ROJOS</span>}
              </div>
            )}
            <div style={{display:"flex",gap:10}}>
              <button onClick={noSpend} style={{flex:1,padding:"14px",borderRadius: 0,border:"2px solid #3b82f6",fontSize:14,fontWeight:800,fontFamily:"'JetBrains Mono', monospace",cursor:"pointer",background:"transparent",color:"#3b82f6"}}>No gastar 💪</button>
              <button onClick={doSpend} style={{flex:1,padding:"14px",borderRadius: 0,border:"none",fontSize:14,fontWeight:800,fontFamily:"'JetBrains Mono', monospace",cursor:"pointer",background:"#ef444425",color:"#ef4444"}}>Gastar igual</button>
            </div>
          </div>
        )}
      </Mod>

      {/* SETTINGS MODAL */}
      <Mod open={stOpen} onClose={()=>setStOpen(false)} title="⚙️ Configuración">
        <div style={{marginBottom:14}}>
          <label style={{fontSize:10,fontWeight:800,color:"#a1a1aa",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:1.5,fontFamily:"'JetBrains Mono', monospace"}}>Presupuesto mensual (S/)</label>
          <input type="number" min="0" value={tempBudget} onChange={e=>setTempBudget(e.target.value)} style={{width:"100%",padding:"12px 14px",borderRadius: 0,border:"1px solid #3f3f46",background:"#121212",color:"#ffffff",fontSize:18,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",outline:"none",boxSizing:"border-box"}}/>
        </div>
        <div style={{marginBottom:20}}>
          <label style={{fontSize:10,fontWeight:800,color:"#a1a1aa",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:1.5,fontFamily:"'JetBrains Mono', monospace"}}>Meta de ahorro mensual (S/)</label>
          <input type="number" min="0" value={tempGoal} onChange={e=>setTempGoal(e.target.value)} style={{width:"100%",padding:"12px 14px",borderRadius: 0,border:"1px solid #3f3f46",background:"#121212",color:"#ffffff",fontSize:18,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",outline:"none",boxSizing:"border-box"}}/>
        </div>
        <button onClick={async () => {
          await saveSettings();
          setStOpen(false);
        }} style={{
          width:"100%",padding:"13px",borderRadius: 0,border:"none",fontSize:13,fontWeight:800,
          fontFamily:"'JetBrains Mono', monospace",cursor:"pointer",background:"#3b82f6",color:"#000000",
          marginBottom:16,transition:"all 0.15s"
        }}>
          Guardar cambios
        </button>

        <div style={{borderTop:"1px solid #27272a",marginTop:20,paddingTop:20,marginBottom:20}}>
          <label style={{fontSize:10,fontWeight:800,color:"#a1a1aa",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:1.5,fontFamily:"'JetBrains Mono', monospace"}}>👫 Vincular Pareja</label>
          {user?.partner_id ? (
            <div style={{padding:"12px 14px",borderRadius: 0,background:"#3b82f608",border:"1px solid #3b82f615",color:"#f4f4f5",fontSize:13,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span>✅ Vinculado con pareja</span>
              <button onClick={unlinkPartner} style={{padding:"6px 14px",borderRadius:0,border:"1px solid #ef4444",background:"transparent",color:"#ef4444",fontSize:11,fontWeight:800,fontFamily:"'JetBrains Mono', monospace",cursor:"pointer"}}>Desvincular</button>
            </div>
          ) : (
            <div style={{display:"flex",gap:8}}>
              <input type="email" placeholder="email@pareja.com" value={partnerEmail} onChange={e=>setPartnerEmail(e.target.value)} style={{flex:1,padding:"10px 12px",borderRadius: 0,border:"1px solid #3f3f46",background:"#121212",color:"#f4f4f5",fontSize:13,outline:"none",fontFamily:"'JetBrains Mono', monospace",boxSizing:"border-box"}}/>
              <button onClick={linkPartner} style={{padding:"10px 16px",borderRadius: 0,border:"none",background:"#3b82f6",color:"#000000",fontSize:13,fontWeight:800,fontFamily:"'JetBrains Mono', monospace",cursor:"pointer"}}>Vincular</button>
            </div>
          )}
        </div>

        <div style={{padding:"16px",borderRadius: 0,background:"#3b82f608",border:"1px solid #3b82f615"}}>
          <div style={{fontSize:12,fontWeight:800,color:"#3b82f6",fontFamily:"'JetBrains Mono', monospace",marginBottom:8}}>💡 Cómo funciona la clasificación</div>
          <div style={{fontSize:12,color:"#a1a1aa",lineHeight:1.7}}>
            Las categorías <span style={{color:"#22d3ee",fontWeight:700}}>ESENCIALES</span> (alquiler, servicios, comida, transporte, salud, educación) no disparan alertas psicológicas — son gastos necesarios.
            <br/><br/>
            Todo gasto <span style={{color:"#ef4444",fontWeight:700}}>NO ESENCIAL</span> te mostrará un recordatorio antes de confirmar para ayudarte a pensar dos veces.
            <br/><br/>
            Los gastos menores a S/ 20 en categorías no esenciales se marcan como <span style={{color:"#3b82f6",fontWeight:700}}>🐜 HORMIGA</span> automáticamente para que los monitorees.
          </div>
        </div>
      </Mod>
    </div>
  );
}

import { createRoot } from "react-dom/client";
createRoot(document.getElementById("root")).render(<MiMoneyApp />);

