# Idioma — cabreudev.com

## Idioma de la Interfaz

**El sitio web es completamente en español (México).**

El portfolio está dirigido a clientes, reclutadores y colaboradores del mercado hispanohablante, con especial foco en México y Latinoamérica. Usar español neutro — comprensible en toda la región, sin modismos muy locales.

---

## Reglas por Contexto

### UI / Interfaz de Usuario
- Todo el texto visible al usuario: **español**
- Incluye: labels, botones, placeholders, mensajes de error, tooltips, navegación, sección de descripción de proyectos

### Código Fuente
- Variables, funciones, componentes, comentarios en el código: **inglés**
- Nombres de archivos: **inglés**, `kebab-case`
- Commits de Git: **inglés**, formato Conventional Commits

```js
// ✅ Correcto
const fetchProjects = async () => { ... }
// "Obtener proyectos" iría en la UI, no en el código

// ❌ Incorrecto
const obtenerProyectos = async () => { ... }
```

### Documentación Técnica (esta carpeta `/rules`)
- **Español** — para que Codex y cualquier colaborador hispanohablante entienda el contexto sin ambigüedad

### Mensajes de Error de la API
- Los errores que se muestran al usuario final: **español**
- Los errores internos en los logs del servidor: **inglés**

```json
// Respuesta de error al usuario
{ "error": "No se encontró el proyecto solicitado." }

// Log interno
console.error('Project not found:', id)
```

---

## Tono del Contenido

- **Voz**: Primera persona singular cuando corresponde ("Soy desarrollador…", "Mis proyectos…")
- **Tono**: Profesional pero cercano. No excesivamente formal. No usar "usted".
- **Terminología técnica**: Usar los términos en inglés cuando son los estándar del sector (framework, deploy, backend, API, UI/UX, stack, repository). No traducirlos forzadamente.

```
✅ "Desarrollé el backend con Node.js y conecté la API al frontend en React."
❌ "Desarrollé el servidor con Node.js y conecté la interfaz de programación de aplicaciones al interfaz frontal en React."
```

---

## Textos Clave del Portfolio

### Meta (SEO)
```
Title:       "Gabriel Cabreu — Desarrollador Full Stack"
Description: "Portfolio de Gabriel Cabreu, desarrollador full stack especializado en React y Node.js. Conoce mis proyectos y contáctame."
```

### Navegación
```
Inicio       → /
Proyectos    → /proyectos
Sobre mí     → /sobre-mi
Contacto     → /contacto
```

### Hero Section
```
// disponible para trabajar
Gabriel Cabreu
Desarrollador Full Stack

[Descripción breve — 1–2 líneas sobre lo que haces y tu enfoque]

[Ver proyectos]   [Descargar CV]
```

### CTA de Contacto
```
¿Tienes un proyecto en mente?
Hablemos.
[Escribir mensaje]
```

### Sección de Proyectos
```
// proyectos
Lo que he construido
```

### Footer
```
Diseñado y construido por Gabriel Cabreu
[año] — cabreudev.com
```

---

## Formato de Fechas

- Usar formato largo: `enero 2025`, `marzo 2024`
- En metadata de proyecto: `ene. 2025`
- Sin formato americano (MM/DD/YYYY) en la UI

---

## Abreviaciones Aceptadas

| Abreviación | Significado          |
|-------------|----------------------|
| UI          | Interfaz de usuario  |
| API         | API (no traducir)    |
| BD          | Base de datos        |
| CV          | Currículum Vitae     |
| full stack  | full stack (no traducir) |
