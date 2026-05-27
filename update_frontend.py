import re

file_path = "/home/bearydnh/Escritorio/miPlata/frontend/miplata/src/main.jsx"
with open(file_path, "r") as f:
    content = f.read()

# 1. Fix Recharts Tooltip grey hover
# Look for <Tooltip content={<Tip/>}/> and add cursor={{fill:"transparent"}}
content = content.replace('<Tooltip content={<Tip/>}/>', '<Tooltip content={<Tip/>} cursor={{fill:"transparent"}}/>')

# 2. Prevent negative numbers in config
content = content.replace('type="number" value={tempBudget}', 'type="number" min="0" value={tempBudget}')
content = content.replace('type="number" value={tempGoal}', 'type="number" min="0" value={tempGoal}')

# 3. Add pending requests state to MiPlataApp
# Find: const [loading,setLoading]=useState(true);
state_add = """  const [loading,setLoading]=useState(true);
  const [pendingReqs, setPendingReqs]=useState([]);
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerCode, setPartnerCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState(null);"""
content = content.replace("  const [loading,setLoading]=useState(true);", state_add)

# 4. Fetch pending requests in fetchData
# Find: const dRes=await api.request("/api/dashboard"+q);
fetch_add = """      const dRes=await api.request("/api/dashboard"+q);
      try {
        const pReq = await api.request("/api/auth/link-partner/pending");
        if (pReq && pReq.pending) setPendingReqs(pReq.pending);
      } catch(e) {}"""
content = content.replace('      const dRes=await api.request("/api/dashboard"+q);', fetch_add)

# 5. Update Vincular Pareja UI in the Settings Modal
# Find the section starting with <label ...>👫 Vincular Pareja</label> and ending right before </Mod>
old_ui_regex = re.compile(r'<label style={{fontSize:10,fontWeight:800,color:"#a1a1aa",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:1\.5,fontFamily:"\'JetBrains Mono\', monospace"}}>👫 Vincular Pareja</label>.*?</div>\s*</div>\s*\)\s*}\s*</Mod>', re.DOTALL)

new_ui = """<label style={{fontSize:10,fontWeight:800,color:"#a1a1aa",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:1.5,fontFamily:"'JetBrains Mono', monospace"}}>👫 Vincular Pareja</label>
          {user?.partner_id ? (
            <div style={{padding:"12px 14px",borderRadius: 0,background:"#3b82f608",border:"1px solid #3b82f615",color:"#f4f4f5",fontSize:13,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span>Vinculado con <strong>{PEOPLE.find(p=>p.id!==user.id&&p.id!=="all")?.name || "Pareja"}</strong></span>
              <span style={{fontSize:16}}>{PEOPLE.find(p=>p.id!==user.id&&p.id!=="all")?.emoji || "👩"}</span>
            </div>
          ) : pendingReqs.length > 0 ? (
            <div style={{padding:"14px",borderRadius:0,background:"#3b82f615",border:"1px solid #3b82f630"}}>
              <div style={{fontSize:12,color:"#f4f4f5",marginBottom:10,fontFamily:"'JetBrains Mono', monospace"}}>
                <strong>{pendingReqs[0].requester_name}</strong> ({pendingReqs[0].requester_email}) te envió una solicitud.
              </div>
              <input type="text" placeholder="Código de 5 dígitos" value={partnerCode} onChange={e=>setPartnerCode(e.target.value)} style={{width:"100%",padding:"10px",borderRadius:0,border:"1px solid #3b82f6",background:"#121212",color:"#ffffff",fontFamily:"'JetBrains Mono', monospace",marginBottom:8,outline:"none",boxSizing:"border-box"}}/>
              <button onClick={async()=>{
                try{
                  await api.request("/api/auth/link-partner/confirm", {method:"POST",body:JSON.stringify({code:partnerCode})});
                  alert("¡Vinculación exitosa!");
                  setPendingReqs([]);
                  await fetchData();
                  setStOpen(false);
                }catch(e){alert(e.message);}
              }} style={{width:"100%",padding:"10px",background:"#3b82f6",color:"#000000",border:"none",fontWeight:800,cursor:"pointer",fontFamily:"'JetBrains Mono', monospace"}}>Confirmar Vinculación</button>
            </div>
          ) : generatedCode ? (
             <div style={{padding:"14px",borderRadius:0,background:"#10b98115",border:"1px solid #10b98130",textAlign:"center"}}>
               <div style={{fontSize:12,color:"#a1a1aa",marginBottom:6,fontFamily:"'JetBrains Mono', monospace"}}>Dile a tu pareja que ingrese este código:</div>
               <div style={{fontSize:28,color:"#10b981",fontWeight:900,letterSpacing:4,fontFamily:"'JetBrains Mono', monospace"}}>{generatedCode}</div>
             </div>
          ) : (
            <div style={{display:"flex",gap:8}}>
              <input type="email" placeholder="email@pareja.com" value={partnerEmail} onChange={e=>setPartnerEmail(e.target.value)} style={{flex:1,padding:"10px 12px",borderRadius: 0,border:"1px solid #3f3f46",background:"#121212",color:"#f4f4f5",fontSize:13,outline:"none",fontFamily:"'JetBrains Mono', monospace",boxSizing:"border-box"}}/>
              <button onClick={async()=>{
                if(!partnerEmail)return;
                try{
                  const res = await api.request("/api/auth/link-partner/request", {method:"POST",body:JSON.stringify({partner_email:partnerEmail})});
                  setGeneratedCode(res.code);
                }catch(e){alert(e.message);}
              }} style={{padding:"0 16px",borderRadius: 0,border:"none",fontSize:12,fontWeight:800,fontFamily:"'JetBrains Mono', monospace",cursor:"pointer",background:"#3b82f6",color:"#000000"}}>Solicitar</button>
            </div>
          )}
        </div>
      </Mod>"""

content = old_ui_regex.sub(new_ui, content)

with open(file_path, "w") as f:
    f.write(content)

print("Frontend UI updated successfully!")
