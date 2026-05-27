# 🐷 MiPlata — Control Total de Tus Finanzas

App de finanzas personales para parejas. Registra ingresos, gastos y deudas desde un solo lugar.

## Stack
- **Frontend:** React + Recharts + Tailwind (deploy en Vercel)
- **Backend:** FastAPI + SQLAlchemy (deploy gratis)
- **Base de datos:** SQLite (incluida, sin configuración extra)

---

## 🚀 Cómo correr localmente

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
El API estará en `http://localhost:8000`. Docs interactivos en `http://localhost:8000/docs`.

### Frontend
```bash
npx create-react-app miplata-frontend
cd miplata-frontend
npm install recharts lucide-react
# Copia MiPlataApp.jsx a src/ y úsalo como componente principal
npm start
```

---

## 🌐 Dónde desplegar GRATIS

### Frontend → Vercel
1. Sube tu repo a GitHub
2. Ve a [vercel.com](https://vercel.com), importa el repo
3. Vercel detecta React automáticamente
4. Agrega la variable de entorno `REACT_APP_API_URL` con la URL de tu backend
5. Deploy!

### Backend → Opciones gratuitas

#### Opción 1: Render (⭐ Recomendada)
- **URL:** [render.com](https://render.com)
- **Free tier:** Sí, con cold starts (~30s primera request)
- **Pasos:**
  1. Sube la carpeta `backend/` a un repo de GitHub
  2. En Render → New → Web Service
  3. Conecta el repo
  4. Build command: `pip install -r requirements.txt`
  5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
  6. Listo! Te da una URL tipo `https://miplata-api.onrender.com`

#### Opción 2: Railway
- **URL:** [railway.app](https://railway.app)
- **Free tier:** $5 USD de crédito gratis al mes
- **Pasos:**
  1. Conecta tu repo de GitHub
  2. Railway detecta el Dockerfile automáticamente
  3. Deploy automático

#### Opción 3: Fly.io
- **URL:** [fly.io](https://fly.io)
- **Free tier:** 3 shared VMs gratis
- **Pasos:**
  ```bash
  flyctl launch        # Detecta el Dockerfile
  flyctl deploy
  ```

#### Opción 4: PythonAnywhere
- **URL:** [pythonanywhere.com](https://pythonanywhere.com)
- **Free tier:** Sí, permanente
- **Limitación:** Solo permite requests a dominios en su whitelist

### Base de datos
SQLite viene incluida y no necesita configuración. El archivo `miplata.db` se crea automáticamente. Para producción seria, considera migrar a PostgreSQL (Supabase tiene free tier).

---

## 📡 Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/users` | Crear usuario |
| GET | `/api/users` | Listar usuarios |
| GET | `/api/categories` | Listar categorías |
| POST | `/api/transactions` | Crear transacción |
| GET | `/api/transactions` | Listar transacciones (filtros: type, user_id, month, year) |
| PUT | `/api/transactions/{id}` | Actualizar transacción |
| DELETE | `/api/transactions/{id}` | Eliminar transacción |
| GET | `/api/dashboard` | Resumen del dashboard (filtros: user_id, month, year) |

Documentación interactiva completa en `/docs` (Swagger UI).

---

## 🔧 Conectar Frontend con Backend

En tu frontend, crea un archivo `src/api.js`:

```javascript
const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const api = {
  getTransactions: (params) =>
    fetch(`${API}/api/transactions?${new URLSearchParams(params)}`).then(r => r.json()),
  
  createTransaction: (data) =>
    fetch(`${API}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),
  
  deleteTransaction: (id) =>
    fetch(`${API}/api/transactions/${id}`, { method: 'DELETE' }).then(r => r.json()),
  
  getDashboard: (params) =>
    fetch(`${API}/api/dashboard?${new URLSearchParams(params)}`).then(r => r.json()),
  
  getCategories: (type) =>
    fetch(`${API}/api/categories?type=${type}`).then(r => r.json()),
  
  getUsers: () =>
    fetch(`${API}/api/users`).then(r => r.json()),
};
```

---

## 💡 Tips

- El backend crea categorías predeterminadas automáticamente al iniciar
- SQLite es perfecto para uso personal/pareja; no necesitas Postgres
- Render tiene cold starts de ~30s en free tier, pero después anda fluido
- La API tiene CORS habilitado para cualquier origen; en producción cambia a tu dominio de Vercel
