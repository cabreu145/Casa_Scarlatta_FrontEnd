# Design System — cabreudev.com

## Filosofía Visual

El portfolio debe sentirse como la intersección entre **ingeniería precisa y creatividad audaz**. Estilo **dark editorial tech**: oscuro, denso en información pero legible, con acentos de color eléctrico. Tendencia 2026: brutalist-tech con refinamiento moderno, terminal aesthetics elevado.

---

## Paleta de Color

```css
:root {
  /* Fondos */
  --bg-base:        #080B10;   /* Negro azulado profundo */
  --bg-surface:     #0F1318;   /* Cards */
  --bg-elevated:    #161C24;   /* Modales, dropdowns */
  --bg-border:      #1E2733;   /* Bordes sutiles */

  /* Acento principal */
  --accent-primary:   #00FF94; /* Verde terminal neón */
  --accent-glow:      rgba(0, 255, 148, 0.15);
  --accent-secondary: #0EA5E9; /* Azul eléctrico */

  /* Texto */
  --text-primary:   #E8EDF3;
  --text-secondary: #7A8694;
  --text-muted:     #3D4A57;
  --text-accent:    #00FF94;

  /* Feedback */
  --success: #00FF94;
  --warning: #F59E0B;
  --error:   #EF4444;
  --info:    #0EA5E9;
}
```

> El acento `--accent-primary` se usa con moderación: solo en elementos interactivos clave, títulos hero y bordes activos. Nunca llenar bloques grandes con el verde.

---

## Tipografía

```css
--font-display: 'Space Grotesk', monospace;
--font-body:    'Geist', 'Inter Variable', sans-serif;
--font-mono:    'JetBrains Mono', 'Fira Code', monospace;
```

### Escala

| Token         | Tamaño  | Peso | Uso                    |
|---------------|---------|------|------------------------|
| `--text-hero` | 72–96px | 800  | Nombre en Hero         |
| `--text-h1`   | 48px    | 700  | Títulos de sección     |
| `--text-h2`   | 32px    | 600  | Subtítulos             |
| `--text-h3`   | 24px    | 600  | Card titles            |
| `--text-body` | 16px    | 400  | Texto corrido          |
| `--text-sm`   | 14px    | 400  | Labels, metadata       |
| `--text-xs`   | 12px    | 500  | Tags, badges           |

- Títulos: `letter-spacing: -0.03em`
- Tags: `uppercase`, `letter-spacing: 0.1em`

---

## Espaciado (8pt grid)

```
4px   — micro gaps (ícono + texto)
8px   — gaps internos de componente
16px  — padding base de cards
24px  — separación entre elementos
32px  — padding de sección interna
48px  — gap entre componentes grandes
64px  — separación entre secciones
96px  — padding vertical de hero
```

---

## Componentes

### Cards de Proyecto
- Fondo: `--bg-surface`
- Borde: `1px solid var(--bg-border)`
- Hover: borde → `--accent-primary` + `box-shadow: 0 0 20px var(--accent-glow)`
- `border-radius: 8px`
- Preview del proyecto ocupa el 60% superior de la card

### Tags de Tecnología
```css
.tag {
  background: rgba(0, 255, 148, 0.08);
  border: 1px solid rgba(0, 255, 148, 0.25);
  color: var(--accent-primary);
  border-radius: 4px;
  padding: 2px 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```

### Botones
```css
/* Primario */
.btn-primary {
  background: var(--accent-primary);
  color: #080B10;
  font-weight: 700;
  border-radius: 6px;
  transition: transform 0.15s, box-shadow 0.15s;
}
.btn-primary:hover {
  box-shadow: 0 0 24px var(--accent-glow);
  transform: translateY(-1px);
}

/* Fantasma */
.btn-ghost {
  background: transparent;
  border: 1px solid var(--bg-border);
  color: var(--text-secondary);
  border-radius: 6px;
}
.btn-ghost:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
```

### Label de Sección
```html
<span class="section-tag">// projects</span>
<h2>Proyectos</h2>
```
Estilo del label: `font-mono`, `--accent-primary`, `font-size: 12px`. Siempre antes del `<h2>`.

---

## Animaciones

```css
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

--duration-fast: 150ms;
--duration-base: 250ms;
--duration-slow: 400ms;
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
```

- **Cards hover**: `translateY(-4px)` + borde glow — 200ms ease-out
- **Entrada al scroll**: staggered `fadeSlideUp`, `animation-delay` incremental (0ms, 80ms, 160ms…)
- **Prohibido**: bounce, shake, rotaciones llamativas
- **`prefers-reduced-motion`**: Desactivar todas las animaciones decorativas

---

## Layout

- Max-width: `1200px`, `padding: 0 24px`
- Grid de proyectos: `repeat(auto-fill, minmax(340px, 1fr))`
- Navbar: sticky, `64px` alto, `backdrop-filter: blur(12px)`, fondo semitransparente
- Hero: `100dvh`, texto alineado a la izquierda

---

## Íconos

**Lucide React** exclusivamente. Sin FontAwesome ni emojis en la UI de producción.

---

## Imágenes

- Screenshots de proyectos: `16:9`, formato WebP, lazy loading obligatorio
- Avatar: circular `120px`, `border: 2px solid var(--accent-primary)`

---

## Accesibilidad

- Contraste mínimo WCAG AA en todo el texto
- Focus visible: `outline: 2px solid var(--accent-primary); outline-offset: 3px`
- Deshabilitar animaciones con `prefers-reduced-motion: reduce`
