# Estructura del Proyecto — cabreudev.com

## Monorepo Layout

```
cabreudev/
├── frontend/          ← React + Vite
├── backend/           ← Node.js + Express
├── rules/             ← Esta carpeta (docs para Codex)
│   ├── design-system.md
│   ├── tech-stack.md
│   ├── idioma.md
│   ├── estructura.md
│   └── setup.md
├── .gitignore
└── README.md
```

---

## Convenciones de Commits (Conventional Commits)

```
feat:     nueva funcionalidad
fix:      corrección de bug
style:    cambios de estilos/CSS sin lógica
refactor: refactorización sin cambio de funcionalidad
chore:    tareas de mantenimiento, configuración
docs:     cambios en documentación
```

Ejemplos:
```
feat: add project detail page with slug routing
fix: correct CORS header for production domain
style: update card hover glow animation
chore: add drizzle migration for tags table
```

---

## Variables de Entorno

Nunca commitear archivos `.env`. Solo commitear `.env.example` con las keys vacías.

### frontend/.env.example
```
VITE_API_URL=
```

### backend/.env.example
```
PORT=
NODE_ENV=
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CORS_ORIGIN=
```

---

## .gitignore raíz

```
# Node
node_modules/
dist/
build/

# Env
.env
.env.local

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
```
