# ─── MiPlata API v2 ─── FastAPI + SQLite + JWT Auth ───
# pip install -r requirements.txt

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import create_engine, Column, Integer, String, Float, Date, Boolean, ForeignKey, DateTime, func, extract
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
import html as html_mod
import re

def sanitize(text: str) -> str:
    """Escape HTML special characters to prevent stored XSS."""
    if not text:
        return text
    return html_mod.escape(text, quote=True)

# ─── Config ──────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "miplata-super-secret-key-cambia-esto-en-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 días

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./miplata.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

import bcrypt

def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode("utf-8")

def verify_password(password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = password.encode("utf-8")[:72]
        return bcrypt.checkpw(pwd_bytes, hashed_password.encode("utf-8"))
    except Exception:
        return False

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ─── Models ──────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    avatar_emoji = Column(String(10), default="👤")
    monthly_budget = Column(Float, default=0)  # Meta de gasto mensual
    savings_goal = Column(Float, default=0)    # Meta de ahorro
    created_at = Column(DateTime, default=datetime.utcnow)
    # Relación con pareja
    partner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    transactions = relationship("Transaction", back_populates="user", foreign_keys="Transaction.user_id")



class PartnerRequest(Base):
    __tablename__ = "partner_requests"
    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    code = Column(String(5), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Category(Base):

    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    type = Column(String(10), nullable=False)   # income | expense | debt
    icon = Column(String(10), default="📦")
    is_essential = Column(Boolean, default=False)  # ¿Es gasto esencial?
    ant_threshold = Column(Float, default=15.0)    # Umbral de gasto hormiga
    color = Column(String(7), default="#6b7280")
    is_custom = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # null = global
    transactions = relationship("Transaction", back_populates="category_rel")


class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(10), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String(255), nullable=False)
    date = Column(Date, nullable=False, default=date.today)
    is_ant_expense = Column(Boolean, default=False)   # Gasto hormiga detectado
    is_recurring = Column(Boolean, default=False)      # Gasto recurrente
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="transactions", foreign_keys=[user_id])
    category_rel = relationship("Category", back_populates="transactions")


Base.metadata.create_all(bind=engine)


# ─── Schemas ─────────────────────────────────────────────────
class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    avatar_emoji: str = "👤"
    monthly_budget: float = 0
    savings_goal: float = 0

class LoginRequest(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    avatar_emoji: str
    monthly_budget: float
    savings_goal: float
    partner_id: Optional[int] = None
    class Config:
        from_attributes = True

class PartnerConfirmRequest(BaseModel):
    code: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar_emoji: Optional[str] = None
    monthly_budget: Optional[float] = None
    savings_goal: Optional[float] = None

class CategoryCreate(BaseModel):
    name: str
    type: str
    icon: str = "📦"
    is_essential: bool = False
    color: str = "#6b7280"

class CategoryOut(BaseModel):
    id: int
    name: str
    type: str
    icon: str
    is_essential: bool
    ant_threshold: float
    color: str
    is_custom: bool
    class Config:
        from_attributes = True

class TransactionCreate(BaseModel):
    type: str
    amount: float
    description: str
    date: date
    category_id: int
    is_recurring: bool = False

class TransactionOut(BaseModel):
    id: int
    type: str
    amount: float
    description: str
    date: date
    is_ant_expense: bool
    is_recurring: bool
    user_id: int
    category_id: int
    user: UserOut
    category_rel: CategoryOut
    class Config:
        from_attributes = True

class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[date] = None
    category_id: Optional[int] = None

class LinkPartnerRequest(BaseModel):
    partner_email: str


# ─── Auth Helpers ────────────────────────────────────────────
def create_access_token(data: dict):
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(401, "Token inválido")
    except JWTError:
        raise HTTPException(401, "Token inválido o expirado")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(401, "Usuario no encontrado")
    return user


# ─── App ─────────────────────────────────────────────────────
app = FastAPI(title="MiPlata API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Security Headers Middleware ─────────────────────────────
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest
from starlette.responses import Response as StarletteResponse

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: StarletteRequest, call_next):
        response: StarletteResponse = await call_next(request)
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)


# ─── Seed Categories ────────────────────────────────────────
@app.on_event("startup")
def seed():
    db = SessionLocal()
    if db.query(Category).count() == 0:
        cats = [
            # INCOME
            ("Sueldo",        "income",  "💼", False, "#22d3ee"),
            ("Freelance",     "income",  "💻", False, "#a78bfa"),
            ("Inversiones",   "income",  "📈", False, "#34d399"),
            ("Ventas",        "income",  "🛒", False, "#fbbf24"),
            ("Bonos",         "income",  "🎁", False, "#f472b6"),
            ("Otros ingresos","income",  "💰", False, "#60a5fa"),
            # EXPENSE — Essential
            ("Alquiler",      "expense", "🏠", True,  "#f87171"),
            ("Servicios",     "expense", "💡", True,  "#fb923c"),
            ("Comida casa",   "expense", "🥘", True,  "#34d399"),
            ("Transporte",    "expense", "🚌", True,  "#60a5fa"),
            ("Salud",         "expense", "🏥", True,  "#c084fc"),
            ("Educación",     "expense", "📚", True,  "#2dd4bf"),
            # EXPENSE — Non-essential (gastos hormiga potenciales)
            ("Delivery",      "expense", "🛵", False, "#fb7185"),
            ("Café/snacks",   "expense", "☕", False, "#fbbf24"),
            ("Comer fuera",   "expense", "🍔", False, "#f97316"),
            ("Streaming",     "expense", "📺", False, "#a78bfa"),
            ("Ropa",          "expense", "👕", False, "#f472b6"),
            ("Salidas",       "expense", "🎉", False, "#e879f9"),
            ("Apps/suscripciones","expense","📱",False,"#38bdf8"),
            ("Antojos",       "expense", "🍫", False, "#fca5a1"),
            ("Otros gastos",  "expense", "📦", False, "#94a3b8"),
            # DEBT
            ("Tarjeta crédito","debt",   "💳", False, "#f87171"),
            ("Préstamo",      "debt",    "🏦", False, "#fb923c"),
            ("Deuda personal","debt",    "🤝", False, "#fbbf24"),
            ("Hipoteca",      "debt",    "🏠", False, "#f472b6"),
            ("Otra deuda",    "debt",    "📋", False, "#94a3b8"),
        ]
        for name, type_, icon, essential, color in cats:
            db.add(Category(name=name, type=type_, icon=icon, is_essential=essential, color=color))
        db.commit()
    db.close()


# ─── Auth Endpoints ──────────────────────────────────────────
@app.post("/api/auth/register", response_model=Token)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    if db.query(User).filter(User.email == email_clean).first():
        raise HTTPException(400, "Email ya registrado")
    user = User(
        name=sanitize(req.name), email=email_clean,
        password_hash=hash_password(req.password),
        avatar_emoji=sanitize(req.avatar_emoji),
        monthly_budget=req.monthly_budget,
        savings_goal=req.savings_goal,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": user.id})
    return Token(access_token=token, token_type="bearer", user={
        "id": user.id, "name": user.name, "email": user.email,
        "avatar_emoji": user.avatar_emoji, "monthly_budget": user.monthly_budget,
        "savings_goal": user.savings_goal,
    })


@app.post("/api/auth/login", response_model=Token)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(401, "Email o contraseña incorrectos")
    token = create_access_token({"sub": user.id})
    return Token(access_token=token, token_type="bearer", user={
        "id": user.id, "name": user.name, "email": user.email,
        "avatar_emoji": user.avatar_emoji, "monthly_budget": user.monthly_budget,
        "savings_goal": user.savings_goal, "partner_id": user.partner_id,
    })

# OAuth2 form login (for Swagger UI)
@app.post("/api/auth/login-form", response_model=Token)
def login_form(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    email_clean = form.username.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(401, "Credenciales inválidas")
    token = create_access_token({"sub": user.id})
    return Token(access_token=token, token_type="bearer", user={
        "id": user.id, "name": user.name, "email": user.email,
    })


@app.get("/api/auth/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return user


@app.put("/api/auth/me", response_model=UserOut)
def update_me(updates: UserUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    for field, val in updates.model_dump(exclude_none=True).items():
        if isinstance(val, str):
            val = sanitize(val)
        setattr(user, field, val)
    db.commit()
    db.refresh(user)
    return user


# ─── Partner Linking ─────────────────────────────────────────
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

# ─── Transaction CRUD ────────────────────────────────────────
@app.get("/api/transactions")
def list_transactions(
    include_partner: bool = True,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_ids = [user.id]
    if include_partner and user.partner_id:
        user_ids.append(user.partner_id)
    txs = db.query(Transaction).filter(
        Transaction.user_id.in_(user_ids)
    ).order_by(Transaction.date.desc(), Transaction.id.desc()).all()
    return txs


@app.post("/api/transactions")
def create_transaction(tx: TransactionCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == tx.category_id).first()
    if not cat:
        raise HTTPException(400, "Categoría no encontrada")
    is_ant = False
    if tx.type == "expense" and not cat.is_essential and tx.amount <= cat.ant_threshold:
        is_ant = True
    new_tx = Transaction(
        type=tx.type,
        amount=abs(tx.amount),
        description=sanitize(tx.description),
        date=tx.date,
        is_ant_expense=is_ant,
        is_recurring=tx.is_recurring,
        user_id=user.id,
        category_id=tx.category_id,
    )
    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)
    return new_tx


@app.delete("/api/transactions/{tx_id}")
def delete_transaction(tx_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(404, "Transacción no encontrada")
    allowed = [user.id]
    if user.partner_id:
        allowed.append(user.partner_id)
    if tx.user_id not in allowed:
        raise HTTPException(403, "No autorizado")
    db.delete(tx)
    db.commit()
    return {"message": "Eliminada"}


@app.get("/api/dashboard")
def dashboard(
    month: Optional[int] = None,
    year: Optional[int] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.now()
    m = month or now.month
    y = year or now.year

    user_ids = [user.id]
    if user.partner_id:
        user_ids.append(user.partner_id)

    base = db.query(Transaction).filter(
        Transaction.user_id.in_(user_ids),
        extract("month", Transaction.date) == m,
        extract("year", Transaction.date) == y,
    )

    txs = base.all()
    total_income = sum(t.amount for t in txs if t.type == "income")
    total_expense = sum(t.amount for t in txs if t.type == "expense")
    balance = total_income - total_expense

    # Debts (all time)
    total_debt = sum(t.amount for t in db.query(Transaction).filter(
        Transaction.user_id.in_(user_ids), Transaction.type == "debt"
    ).all())

    # Ant expenses this month
    ant_txs = [t for t in txs if t.is_ant_expense]
    ant_total = sum(t.amount for t in ant_txs)
    ant_count = len(ant_txs)

    # Expense by category
    expense_by_cat = {}
    for t in txs:
        if t.type == "expense":
            cat_name = t.category_rel.name if t.category_rel else "Otros"
            cat_icon = t.category_rel.icon if t.category_rel else "📦"
            cat_color = t.category_rel.color if t.category_rel else "#94a3b8"
            cat_essential = t.category_rel.is_essential if t.category_rel else False
            if cat_name not in expense_by_cat:
                expense_by_cat[cat_name] = {"name": cat_name, "value": 0, "icon": cat_icon, "color": cat_color, "is_essential": cat_essential}
            expense_by_cat[cat_name]["value"] += t.amount

    # Income by category
    income_by_cat = {}
    for t in txs:
        if t.type == "income":
            cat_name = t.category_rel.name if t.category_rel else "Otros"
            if cat_name not in income_by_cat:
                income_by_cat[cat_name] = {"name": cat_name, "value": 0, "icon": t.category_rel.icon if t.category_rel else "💰"}
            income_by_cat[cat_name]["value"] += t.amount

    # By user
    by_user = {}
    for uid in user_ids:
        u = db.query(User).filter(User.id == uid).first()
        u_txs = [t for t in txs if t.user_id == uid]
        by_user[uid] = {
            "name": u.name, "avatar": u.avatar_emoji,
            "income": sum(t.amount for t in u_txs if t.type == "income"),
            "expense": sum(t.amount for t in u_txs if t.type == "expense"),
        }

    # Monthly trend (6 months)
    months_labels = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
    trend = []
    for i in range(5, -1, -1):
        tm = m - i
        ty = y
        while tm <= 0:
            tm += 12
            ty -= 1
        mt = db.query(Transaction).filter(
            Transaction.user_id.in_(user_ids),
            extract("month", Transaction.date) == tm,
            extract("year", Transaction.date) == ty,
        ).all()
        trend.append({
            "month": months_labels[tm - 1],
            "ingresos": sum(t.amount for t in mt if t.type == "income"),
            "gastos": sum(t.amount for t in mt if t.type == "expense"),
        })

    # Budget status
    budget = user.monthly_budget or 0
    budget_pct = (total_expense / budget * 100) if budget > 0 else 0
    savings_goal = user.savings_goal or 0
    saved = max(0, total_income - total_expense)
    savings_pct = (saved / savings_goal * 100) if savings_goal > 0 else 0

    # Red zone detection
    in_red = balance < 0
    budget_exceeded = budget > 0 and total_expense > budget
    near_budget = budget > 0 and budget_pct > 80

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "total_debt": total_debt,
        "balance": balance,
        "ant_total": ant_total,
        "ant_count": ant_count,
        "expense_by_category": list(expense_by_cat.values()),
        "income_by_category": list(income_by_cat.values()),
        "by_user": list(by_user.values()),
        "monthly_trend": trend,
        "budget": budget,
        "budget_pct": min(budget_pct, 100),
        "savings_goal": savings_goal,
        "savings_pct": min(savings_pct, 100),
        "saved": saved,
        "alerts": {
            "in_red": in_red,
            "budget_exceeded": budget_exceeded,
            "near_budget": near_budget,
        },
    }


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "2.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
