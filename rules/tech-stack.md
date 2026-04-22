# Tech Stack — cabreudev.com

## Arquitectura General

```
cabreudev.com/
├── frontend/     ← React SPA (Vite)
├── backend/      ← Node.js + Express API REST
└── database/     ← PostgreSQL
```

El proyecto es un **monorepo** con frontend y backend en carpetas separadas dentro del mismo repositorio. Comunicación vía API REST. En producción, el frontend se sirve como estático (Vercel/Netlify) y el backend corre en un servidor propio (Railway, Render o VPS).

---

## Frontend

### Core
- **Framework**: React 18+
- **Build tool**: Vite 5+
- **Lenguaje**: JavaScript (JSX) — sin TypeScript en esta fase
- **Routing**: React Router v6

### Estilos
- **CSS**: CSS Modules + variables CSS globales (ver `design-system.md`)
- **No usar**: Tailwind, Styled Components, Emotion — mantener CSS nativo para control total del design system
- **Íconos**: Lucide React

### Estado y Data Fetching
- **Estado global ligero**: Zustand
- **Fetching / cache**: TanStack Query (React Query) v5
- **Formularios**: React Hook Form + Zod (validación)

### Utilidades
- **Fechas**: date-fns
- **Animaciones**: Framer Motion (para transiciones de página y animaciones complejas)
- **Notificaciones**: react-hot-toast

### Instalación del Frontend

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install react-router-dom
npm install zustand
npm install @tanstack/react-query
npm install react-hook-form zod @hookform/resolvers
npm install lucide-react
npm install framer-motion
npm install react-hot-toast
npm install date-fns
```

### Estructura de Carpetas (Frontend)

```
frontend/
├── public/
├── src/
│   ├── assets/           ← Imágenes, fuentes locales
│   ├── components/
│   │   ├── ui/           ← Componentes reutilizables (Button, Card, Badge…)
│   │   └── layout/       ← Navbar, Footer, PageWrapper
│   ├── features/
│   │   ├── projects/     ← Componentes, hooks y lógica de proyectos
│   │   ├── about/
│   │   └── contact/
│   ├── hooks/            ← Custom hooks globales
│   ├── lib/
│   │   ├── api.js        ← Cliente HTTP (fetch/axios wrapper)
│   │   └── queryClient.js
│   ├── pages/            ← Vistas completas (Home, ProjectDetail…)
│   ├── styles/
│   │   ├── global.css    ← Variables CSS, reset, base
│   │   └── tokens.css    ← Design tokens del sistema
│   ├── App.jsx
│   └── main.jsx
├── .env.local            ← Variables de entorno locales
└── vite.config.js
```

---

## Backend

### Core
- **Runtime**: Node.js 20+ (LTS)
- **Framework**: Express 4+
- **Lenguaje**: JavaScript (ESM — `"type": "module"` en package.json)

### Base de Datos
- **Motor**: PostgreSQL 16+
- **ORM / Query Builder**: **Drizzle ORM** — tipado, ligero, SQL-first
- **Driver**: `pg` (node-postgres)
- **Migraciones**: Drizzle Kit

### Autenticación (Panel Admin)
- **Estrategia**: JWT (JSON Web Tokens)
- **Hash de contraseñas**: bcrypt
- **Librería JWT**: jsonwebtoken

### Validación
- **Zod** — validación de schemas en los endpoints

### Utilidades
- **Variables de entorno**: dotenv
- **CORS**: cors
- **Logging**: morgan
- **Uploads de imágenes**: multer + almacenamiento en Cloudinary
- **Dev server con hot-reload**: nodemon

### Instalación del Backend

```bash
mkdir backend && cd backend
npm init -y

# Core
npm install express cors morgan dotenv

# Base de datos
npm install drizzle-orm pg
npm install -D drizzle-kit

# Auth
npm install jsonwebtoken bcrypt

# Validación
npm install zod

# Uploads
npm install multer cloudinary

# Dev
npm install -D nodemon
```

### Estructura de Carpetas (Backend)

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js          ← Conexión a PostgreSQL (pool)
│   │   └── cloudinary.js  ← Config Cloudinary
│   ├── db/
│   │   ├── schema.js      ← Schemas Drizzle (tablas)
│   │   └── migrations/    ← Archivos de migración generados
│   ├── middleware/
│   │   ├── auth.js        ← Verificar JWT
│   │   ├── validate.js    ← Middleware de validación Zod
│   │   └── errorHandler.js
│   ├── modules/
│   │   ├── projects/
│   │   │   ├── projects.routes.js
│   │   │   ├── projects.controller.js
│   │   │   └── projects.service.js
│   │   ├── auth/
│   │   │   ├── auth.routes.js
│   │   │   └── auth.controller.js
│   │   └── tags/
│   ├── app.js             ← Setup Express, middlewares, rutas
│   └── server.js          ← Entry point (listen)
├── .env                   ← Variables de entorno
├── drizzle.config.js
└── package.json
```

---

## Base de Datos (PostgreSQL)

### Schema Principal

```sql
-- Proyectos
projects (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  slug        VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  content     TEXT,              -- descripción larga / markdown
  cover_url   TEXT,              -- URL de Cloudinary
  live_url    TEXT,
  repo_url    TEXT,
  featured    BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
)

-- Tags de tecnología
tags (
  id    SERIAL PRIMARY KEY,
  name  VARCHAR(100) UNIQUE NOT NULL,
  color VARCHAR(7)   -- hex color opcional
)

-- Relación proyectos ↔ tags
project_tags (
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  tag_id     INTEGER REFERENCES tags(id)     ON DELETE CASCADE,
  PRIMARY KEY (project_id, tag_id)
)

-- Admin user (panel de control)
users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
)
```

---

## Variables de Entorno

### Frontend (`frontend/.env.local`)
```env
VITE_API_URL=http://localhost:4000/api
```

### Backend (`backend/.env`)
```env
PORT=4000
NODE_ENV=development

DATABASE_URL=postgresql://user:password@localhost:5432/cabreudev

JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

CORS_ORIGIN=http://localhost:5173
```

---

## Scripts NPM

### Frontend (`frontend/package.json`)
```json
{
  "scripts": {
    "dev":     "vite",
    "build":   "vite build",
    "preview": "vite preview"
  }
}
```

### Backend (`backend/package.json`)
```json
{
  "type": "module",
  "scripts": {
    "dev":       "nodemon src/server.js",
    "start":     "node src/server.js",
    "db:push":   "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:migrate":"drizzle-kit migrate"
  }
}
```

---

## API Endpoints

```
GET    /api/projects          ← Listar proyectos (público)
GET    /api/projects/:slug    ← Detalle de proyecto (público)
POST   /api/projects          ← Crear proyecto (admin)
PUT    /api/projects/:id      ← Editar proyecto (admin)
DELETE /api/projects/:id      ← Eliminar proyecto (admin)

GET    /api/tags              ← Listar tags (público)
POST   /api/tags              ← Crear tag (admin)

POST   /api/auth/login        ← Login admin → devuelve JWT
GET    /api/auth/me           ← Verificar sesión
```

---

## Convenciones de Código

- **Nombrado de archivos**: `kebab-case` para archivos, `PascalCase` para componentes React
- **Nombrado de funciones**: `camelCase`
- **Imports**: absolutos desde `src/` configurados en `vite.config.js` (alias `@/`)
- **Comentarios**: en inglés
- **ESLint**: configurar con `eslint-config-airbnb-base` en backend, `eslint-plugin-react` en frontend
- **Prettier**: activado en ambos proyectos con misma config

---

## Herramientas de Desarrollo

- **Git**: flujo de ramas `main` (producción) + `dev` (desarrollo) + feature branches
- **Linter**: ESLint
- **Formatter**: Prettier
- **DB GUI local**: Drizzle Studio (`npm run db:studio`) o TablePlus
