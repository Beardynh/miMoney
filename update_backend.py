import re

with open("/home/bearydnh/Escritorio/miPlata/backend/main.py", "r") as f:
    content = f.read()

# 1. Add PartnerRequest model
model_addition = """
class PartnerRequest(Base):
    __tablename__ = "partner_requests"
    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    code = Column(String(5), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Category(Base):
"""
content = content.replace("class Category(Base):", model_addition)

# 2. Add Pydantic Schemas for the new endpoints
schema_addition = """class PartnerConfirmRequest(BaseModel):
    code: str

class UserUpdate(BaseModel):"""
content = content.replace("class UserUpdate(BaseModel):", schema_addition)

# 3. Replace the old endpoint with the 3 new ones
old_endpoint_pattern = re.compile(r'# ─── Partner Linking ─────────────────────────────────────────.*?@app\.get\("/api/dashboard"\)', re.DOTALL)

new_endpoints = """# ─── Partner Linking ─────────────────────────────────────────
import random

@app.post("/api/auth/link-partner/request")
def request_partner_link(req: LinkPartnerRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    target = db.query(User).filter(User.email == req.partner_email).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if target.id == user.id:
        raise HTTPException(status_code=400, detail="No puedes vincularte contigo mismo")
    if user.partner_id or target.partner_id:
        raise HTTPException(status_code=400, detail="Uno de los usuarios ya tiene pareja vinculada")
        
    # Check if there is already a pending request
    existing = db.query(PartnerRequest).filter(PartnerRequest.requester_id == user.id, PartnerRequest.target_user_id == target.id).first()
    if existing:
        db.delete(existing)
        
    code = str(random.randint(10000, 99999))
    new_req = PartnerRequest(requester_id=user.id, target_user_id=target.id, code=code)
    db.add(new_req)
    db.commit()
    
    return {"message": "Solicitud creada", "code": code}

@app.get("/api/auth/link-partner/pending")
def get_pending_partner_requests(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reqs = db.query(PartnerRequest).filter(PartnerRequest.target_user_id == user.id).all()
    res = []
    for r in reqs:
        requester = db.query(User).filter(User.id == r.requester_id).first()
        res.append({
            "id": r.id,
            "requester_name": requester.name,
            "requester_email": requester.email
        })
    return {"pending": res}

@app.post("/api/auth/link-partner/confirm")
def confirm_partner_link(req: PartnerConfirmRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pr = db.query(PartnerRequest).filter(PartnerRequest.target_user_id == user.id, PartnerRequest.code == req.code).first()
    if not pr:
        raise HTTPException(status_code=400, detail="Código inválido o solicitud no encontrada")
        
    requester = db.query(User).filter(User.id == pr.requester_id).first()
    if not requester:
        raise HTTPException(status_code=404, detail="El usuario solicitante ya no existe")
        
    user.partner_id = requester.id
    requester.partner_id = user.id
    
    # Delete all requests involving these users
    db.query(PartnerRequest).filter((PartnerRequest.requester_id == user.id) | (PartnerRequest.target_user_id == user.id)).delete()
    db.query(PartnerRequest).filter((PartnerRequest.requester_id == requester.id) | (PartnerRequest.target_user_id == requester.id)).delete()
    
    db.commit()
    return {"message": "Vinculación exitosa"}

@app.get("/api/dashboard")"""

content = old_endpoint_pattern.sub(new_endpoints, content)

with open("/home/bearydnh/Escritorio/miPlata/backend/main.py", "w") as f:
    f.write(content)
