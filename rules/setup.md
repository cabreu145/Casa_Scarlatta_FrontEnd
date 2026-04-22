# Setup — cabreudev.com

> Este archivo le dice a Codex exactamente qué instalar y cómo inicializar el proyecto desde cero.

---

## Prerequisitos

Antes de ejecutar cualquier comando, asegúrate de tener instalado:
- Node.js 20+ (LTS)
- npm 10+
- PostgreSQL 16+ corriendo localmente (o una URL de conexión remota)

---

## 1. Inicializar el Frontend

```bash
# Desde la raíz del monorepo
npm create vite@latest frontend -- --template react
cd frontend

# Instalar dependencias
npm install react-router-dom
npm install zustand
npm install @tanstack/react-query
npm install react-hook-form zod @hookform/resolvers
npm install lucide-react
npm install framer-motion
npm install react-hot-toast
npm install date-fns

# Linting
npm install -D eslint eslint-plugin-react eslint-plugin-react-hooks
npm install -D prettier eslint-config-prettier eslint-plugin-prettier

cd ..
```

---

## 2. Inicializar el Backend

```bash
mkdir backend && cd backend
npm init -y

# Configurar como ES Modules
# Agregar "type": "module" al package.json

# Core Express
npm install express cors morgan dotenv

# Base de datos
npm install drizzle-orm pg
npm install -D drizzle-kit

# Autenticación
npm install jsonwebtoken bcrypt

# Validación
npm install zod

# Uploads de imágenes
npm install multer cloudinary

# Dev tools
npm install -D nodemon eslint prettier

cd ..
```

---

## 3. Configurar Variables de Entorno

```bash
# Frontend
cp frontend/.env.example frontend/.env.local
# Editar VITE_API_URL=http://localhost:4000/api

# Backend
cp backend/.env.example backend/.env
# Editar con tus credenciales de PostgreSQL, JWT_SECRET, Cloudinary
```

---

## 4. Configurar la Base de Datos

```bash
cd backend

# Crear la base de datos en PostgreSQL
psql -U postgres -c "CREATE DATABASE cabreudev;"

# Correr migraciones con Drizzle
npm run db:push

# (Opcional) Abrir Drizzle Studio para explorar la BD visualmente
npm run db:studio
```

---

## 5. Levantar en Desarrollo

Abrir **dos terminales**:

**Terminal 1 — Frontend:**
```bash
cd frontend
npm run dev
# Disponible en http://localhost:5173
```

**Terminal 2 — Backend:**
```bash
cd backend
npm run dev
# Disponible en http://localhost:4000
```

---

## 6. Configuración de Alias de Imports (Frontend)

En `frontend/vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Esto permite imports limpios:
```js
import Button from '@/components/ui/Button'
import { fetchProjects } from '@/lib/api'
```

---

## 7. Configuración de Drizzle (Backend)

Crear `backend/drizzle.config.js`:

```js
import { defineConfig } from 'drizzle-kit'
import dotenv from 'dotenv'
dotenv.config()

export default defineConfig({
  schema: './src/db/schema.js',
  out:    './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
})
```

---

## 8. Scripts Útiles (resumen)

| Comando                      | Descripción                          |
|------------------------------|--------------------------------------|
| `cd frontend && npm run dev` | Levantar frontend en desarrollo      |
| `cd backend && npm run dev`  | Levantar backend en desarrollo       |
| `cd backend && npm run db:push`   | Sincronizar schema con la BD    |
| `cd backend && npm run db:studio` | Abrir Drizzle Studio (GUI BD)   |
| `cd frontend && npm run build`    | Build de producción del frontend |

---

## 9. Verificar que Todo Funciona

1. Frontend corre en `http://localhost:5173` ✓
2. Backend responde en `http://localhost:4000/api/projects` → devuelve `[]` ✓
3. `npm run db:studio` abre el panel de la BD ✓
4. Variables de entorno cargadas correctamente ✓

---

## Notas para Codex

- Instalar **todas** las dependencias listadas en `tech-stack.md` antes de escribir código
- Respetar la estructura de carpetas definida en `tech-stack.md`
- El backend usa **ES Modules** (`import/export`), no `require()`
- Los estilos van en **CSS Modules** o variables CSS globales — no usar Tailwind
- Seguir el design system en `design-system.md` para toda decisión visual
