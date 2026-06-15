# Frontend Public Site Editable Content Audit

## Archivos revisados

- `/D:/Casa_Scarlatta_FrontEnd/frontend/src/pages/Suet.jsx`  ruta real: `/stryde-x`
- `/D:/Casa_Scarlatta_FrontEnd/frontend/src/pages/Flow.jsx`  ruta real: `/slow`
- `/D:/Casa_Scarlatta_FrontEnd/frontend/src/pages/Yoga.jsx`  ruta real: `/yoga`
- `/D:/Casa_Scarlatta_FrontEnd/frontend/src/components/layout/Footer.jsx`
- `/D:/Casa_Scarlatta_FrontEnd/frontend/src/features/home/SuetPreview.jsx`  componente compartido detectado, no consumido por rutas públicas activas

## SUET

### Textos hardcodeados

| Campo visual | Texto actual | Componente/archivo | Propuesta key backend |
|---|---|---|---|
| Overline hero | `Casa Scarlatta — Alta Intensidad` | `src/pages/Suet.jsx` | `pages.suet.hero.overline` |
| Tagline logo | `Stronger Every Stryde` | `src/pages/Suet.jsx` | `pages.suet.hero.tagline` |
| Hero subtitle | `Entrenamiento de alto rendimiento que fusiona cardio y fuerza en bloques de alta intensidad con música envolvente.` | `src/pages/Suet.jsx` | `pages.suet.hero.subtitle` |
| Hero subtext | `Mejora tu resistencia. Tonifica tu cuerpo. Eleva tu disciplina.` | `src/pages/Suet.jsx` | `pages.suet.hero.subtext` |
| CTA | `Reservar clase` | `src/pages/Suet.jsx` | `pages.suet.hero.ctas[0]` |
| Stats | `15` / `Cupo máximo` | `src/pages/Suet.jsx` | `pages.suet.stats[0]` |
| Stats | `50` / `Minutos` | `src/pages/Suet.jsx` | `pages.suet.stats[1]` |
| Section label | `Concepto` | `src/pages/Suet.jsx` | `pages.suet.sections.concept.title` |
| Concept title | `La fuerza no se encuentra. Se construye.` | `src/pages/Suet.jsx` | `pages.suet.sections.concept.heading` |
| Concept body | `STRYDE X es más que una clase...` | `src/pages/Suet.jsx` | `pages.suet.sections.concept.body` |
| Section label | `Experiencia` | `src/pages/Suet.jsx` | `pages.suet.sections.experience.title` |
| Experience item | `Música envolvente` | `src/pages/Suet.jsx` | `pages.suet.sections.experience.items[].title` |
| Experience item | `Ambiente energético` | `src/pages/Suet.jsx` | `pages.suet.sections.experience.items[].title` |
| Experience item | `Enfoque total` | `src/pages/Suet.jsx` | `pages.suet.sections.experience.items[].title` |
| Section label | `Metodología` | `src/pages/Suet.jsx` | `pages.suet.sections.methodology.title` |
| Method subtitle | `Entrenamiento en bloques de alta intensidad` | `src/pages/Suet.jsx` | `pages.suet.sections.methodology.subtitle` |
| Method step | `Cardio` | `src/pages/Suet.jsx` | `pages.suet.sections.methodology.steps[].title` |
| Method step | `Fuerza` | `src/pages/Suet.jsx` | `pages.suet.sections.methodology.steps[].title` |
| Method step | `Resistencia` | `src/pages/Suet.jsx` | `pages.suet.sections.methodology.steps[].title` |
| Method conclusion | `Todo en una sesión. Máximo rendimiento.` | `src/pages/Suet.jsx` | `pages.suet.sections.methodology.conclusion` |
| Section label | `Beneficios` | `src/pages/Suet.jsx` | `pages.suet.sections.benefits.title` |
| Benefit item | `Aumento de fuerza y tonificación` | `src/pages/Suet.jsx` | `pages.suet.sections.benefits.items[].title` |
| Benefit item | `Mejora de resistencia física` | `src/pages/Suet.jsx` | `pages.suet.sections.benefits.items[].title` |
| Benefit item | `Alto gasto calórico` | `src/pages/Suet.jsx` | `pages.suet.sections.benefits.items[].title` |
| Benefit item | `Mayor disciplina y enfoque mental` | `src/pages/Suet.jsx` | `pages.suet.sections.benefits.items[].title` |
| Section label | `Ideal para ti si…` | `src/pages/Suet.jsx` | `pages.suet.sections.ideal.title` |
| Ideal bullet | `Buscas resultados visibles.` | `src/pages/Suet.jsx` | `pages.suet.sections.ideal.items[]` |
| Ideal bullet | `Disfrutas los retos físicos.` | `src/pages/Suet.jsx` | `pages.suet.sections.ideal.items[]` |
| Ideal bullet | `Quieres estructura y progreso.` | `src/pages/Suet.jsx` | `pages.suet.sections.ideal.items[]` |
| Ideal bullet | `Valoras la estética y la experiencia.` | `src/pages/Suet.jsx` | `pages.suet.sections.ideal.items[]` |

### Media hardcodeada

| Campo visual | Path/URL actual | Tipo | Componente/archivo | Propuesta key backend |
|---|---|---|---|---|
| Hero background | `https://res.cloudinary.com/dtj8woibw/image/upload/v1781473009/gym_banner_stryde_fwjvb8.jpg` | imagen | `src/pages/Suet.jsx` | `pages.suet.hero.image` |
| Hero logo | `https://res.cloudinary.com/dtj8woibw/image/upload/v1781472997/STRYDE_X_T_bsgwov.png` | imagen | `src/pages/Suet.jsx` | `pages.suet.hero.logo` |
| Concept panel bg | `https://res.cloudinary.com/dtj8woibw/image/upload/v1781473010/stride-hero_zdajlh.jpg` | imagen | `src/pages/Suet.jsx` | `pages.suet.sections.concept.media` |
| Quote panel bg | `https://res.cloudinary.com/dtj8woibw/image/upload/v1781473009/gym_banner_stryde_fwjvb8.jpg` | imagen | `src/pages/Suet.jsx` | `pages.suet.sections.quote.media` |

### Bloques repetibles

| Bloque | Cantidad actual | Campos por item | Propuesta key backend |
|---|---:|---|---|
| Stats | 2 | `num`, `label` | `pages.suet.stats[]` |
| Experience | 3 | `title`, `description`, `icon` | `pages.suet.sections.experience.items[]` |
| Method steps | 3 | `title`, `description`, `icon` | `pages.suet.sections.methodology.steps[]` |
| Benefits | 4 | `title`, `icon` | `pages.suet.sections.benefits.items[]` |
| Ideal bullets | 4 | `text` | `pages.suet.sections.ideal.items[]` |

### CTAs / Links

| Label actual | URL/acción actual | Propuesta key backend |
|---|---|---|
| `Reservar clase` | `/clases?tipo=Stride` | `pages.suet.hero.ctas[0]` |

## FLOW

### Textos hardcodeados

| Campo visual | Texto actual | Componente/archivo | Propuesta key backend |
|---|---|---|---|
| Overline hero | `Casa Scarlatta — Movimiento Consciente` | `src/pages/Flow.jsx` | `pages.flow.hero.overline` |
| Tagline logo | `Movement · Breath · Presence` | `src/pages/Flow.jsx` | `pages.flow.hero.tagline` |
| Hero subtitle | `Movimiento consciente que combina fuerza, respiración y energía para alinear cuerpo, mente y espíritu.` | `src/pages/Flow.jsx` | `pages.flow.hero.subtitle` |
| Hero slogan | `Fluye. Respira. Conecta contigo.` | `src/pages/Flow.jsx` | `pages.flow.hero.slogan` |
| CTA | `Reservar clase` | `src/pages/Flow.jsx` | `pages.flow.hero.ctas[0]` |
| Stats | `9` / `Cupo máximo` | `src/pages/Flow.jsx` | `pages.flow.stats[0]` |
| Stats | `45` / `Minutos` | `src/pages/Flow.jsx` | `pages.flow.stats[1]` |
| Section label | `Concepto` | `src/pages/Flow.jsx` | `pages.flow.sections.concept.title` |
| Concept title | `El movimiento que restaura. La calma que transforma.` | `src/pages/Flow.jsx` | `pages.flow.sections.concept.heading` |
| Concept body | `SLOW es un espacio para reconectar...` | `src/pages/Flow.jsx` | `pages.flow.sections.concept.body` |
| Section label | `Filosofía` | `src/pages/Flow.jsx` | `pages.flow.sections.philosophy.title` |
| Philosophy item | `Respiración consciente` | `src/pages/Flow.jsx` | `pages.flow.sections.philosophy.items[].title` |
| Philosophy item | `Movimiento con intención` | `src/pages/Flow.jsx` | `pages.flow.sections.philosophy.items[].title` |
| Philosophy item | `Presencia plena` | `src/pages/Flow.jsx` | `pages.flow.sections.philosophy.items[].title` |
| Section label | `Metodología` | `src/pages/Flow.jsx` | `pages.flow.sections.methodology.title` |
| Method subtitle | `Tres momentos que transforman tu práctica` | `src/pages/Flow.jsx` | `pages.flow.sections.methodology.subtitle` |
| Method step | `Pilates Mat` | `src/pages/Flow.jsx` | `pages.flow.sections.methodology.steps[].title` |
| Method step | `Movimiento Consciente` | `src/pages/Flow.jsx` | `pages.flow.sections.methodology.steps[].title` |
| Method step | `Meditación + Stretch` | `src/pages/Flow.jsx` | `pages.flow.sections.methodology.steps[].title` |
| Method conclusion | `Un ciclo completo. Cuerpo y mente en equilibrio.` | `src/pages/Flow.jsx` | `pages.flow.sections.methodology.conclusion` |
| Section label | `Beneficios` | `src/pages/Flow.jsx` | `pages.flow.sections.benefits.title` |
| Benefit item | `Mayor flexibilidad y movilidad` | `src/pages/Flow.jsx` | `pages.flow.sections.benefits.items[].title` |
| Benefit item | `Gestión del estrés y ansiedad` | `src/pages/Flow.jsx` | `pages.flow.sections.benefits.items[].title` |
| Benefit item | `Core fortalecido y postura mejorada` | `src/pages/Flow.jsx` | `pages.flow.sections.benefits.items[].title` |
| Benefit item | `Equilibrio cuerpo, mente y emoción` | `src/pages/Flow.jsx` | `pages.flow.sections.benefits.items[].title` |
| Section label | `Ideal para ti si…` | `src/pages/Flow.jsx` | `pages.flow.sections.ideal.title` |
| Ideal bullet | `Buscas calma y bienestar real.` | `src/pages/Flow.jsx` | `pages.flow.sections.ideal.items[]` |
| Ideal bullet | `Quieres fortalecer tu core.` | `src/pages/Flow.jsx` | `pages.flow.sections.ideal.items[]` |
| Ideal bullet | `Valoras el movimiento consciente.` | `src/pages/Flow.jsx` | `pages.flow.sections.ideal.items[]` |
| Ideal bullet | `Necesitas desconectar y reconectar.` | `src/pages/Flow.jsx` | `pages.flow.sections.ideal.items[]` |

### Media hardcodeada

| Campo visual | Path/URL actual | Tipo | Componente/archivo | Propuesta key backend |
|---|---|---|---|---|
| Hero background | `https://res.cloudinary.com/dtj8woibw/image/upload/v1781473010/yoga_studio_d8ptjd.jpg` | imagen | `src/pages/Flow.jsx` | `pages.flow.hero.image` |
| Hero logo | `https://res.cloudinary.com/dtj8woibw/image/upload/v1781472997/LOGO_SLOW_rvm3cv.png` | imagen | `src/pages/Flow.jsx` | `pages.flow.hero.logo` |
| Concept panel bg | `https://res.cloudinary.com/dtj8woibw/image/upload/v1781473010/yoga_women_ywoota.jpg` | imagen | `src/pages/Flow.jsx` | `pages.flow.sections.concept.media` |
| Quote panel bg | `https://res.cloudinary.com/dtj8woibw/image/upload/v1781473010/yoga_studio_d8ptjd.jpg` | imagen | `src/pages/Flow.jsx` | `pages.flow.sections.quote.media` |

### Bloques repetibles

| Bloque | Cantidad actual | Campos por item | Propuesta key backend |
|---|---:|---|---|
| Stats | 2 | `num`, `label` | `pages.flow.stats[]` |
| Philosophy | 3 | `title`, `description`, `icon` | `pages.flow.sections.philosophy.items[]` |
| Method steps | 3 | `title`, `description`, `icon` | `pages.flow.sections.methodology.steps[]` |
| Benefits | 4 | `title`, `icon` | `pages.flow.sections.benefits.items[]` |
| Ideal bullets | 4 | `text` | `pages.flow.sections.ideal.items[]` |

### CTAs / Links

| Label actual | URL/acción actual | Propuesta key backend |
|---|---|---|
| `Reservar clase` | `/clases?tipo=Slow` | `pages.flow.hero.ctas[0]` |

## YOGA

### Textos hardcodeados

| Campo visual | Texto actual | Componente/archivo | Propuesta key backend |
|---|---|---|---|
| Overline hero | `Casa Scarlatta — Equilibrio Mente-Cuerpo` | `src/pages/Yoga.jsx` | `pages.yoga.hero.overline` |
| Tagline logo | `Movement · Breath · Balance` | `src/pages/Yoga.jsx` | `pages.yoga.hero.tagline` |
| Hero subtitle | `movimiento consciente, respiración y presencia para fortalecer el cuerpo, calmar la mente y cultivar bienestar desde el interior.` | `src/pages/Yoga.jsx` | `pages.yoga.hero.subtitle` |
| Hero slogan | `Respira profundo. Muévete con intención. Habita el presente.` | `src/pages/Yoga.jsx` | `pages.yoga.hero.slogan` |
| CTA | `Reservar clase` | `src/pages/Yoga.jsx` | `pages.yoga.hero.ctas[0]` |
| Stats | `9` / `Cupo máximo` | `src/pages/Yoga.jsx` | `pages.yoga.stats[0]` |
| Stats | `45` / `Minutos` | `src/pages/Yoga.jsx` | `pages.yoga.stats[1]` |
| Section label | `Concepto` | `src/pages/Yoga.jsx` | `pages.yoga.sections.concept.title` |
| Concept title | `El movimiento que restaura. La calma que transforma.` | `src/pages/Yoga.jsx` | `pages.yoga.sections.concept.heading` |
| Concept body | `YOGA es un espacio para reconectar contigo...` | `src/pages/Yoga.jsx` | `pages.yoga.sections.concept.body` |
| Section label | `Filosofía` | `src/pages/Yoga.jsx` | `pages.yoga.sections.philosophy.title` |
| Philosophy item | `Respiración consciente` | `src/pages/Yoga.jsx` | `pages.yoga.sections.philosophy.items[].title` |
| Philosophy item | `Movimiento con propósito` | `src/pages/Yoga.jsx` | `pages.yoga.sections.philosophy.items[].title` |
| Philosophy item | `Presencia plena` | `src/pages/Yoga.jsx` | `pages.yoga.sections.philosophy.items[].title` |
| Section label | `Metodología` | `src/pages/Yoga.jsx` | `pages.yoga.sections.methodology.title` |
| Method subtitle | `Tres momentos que transforman tu práctica` | `src/pages/Yoga.jsx` | `pages.yoga.sections.methodology.subtitle` |
| Method step | `Centrado y Respiración` | `src/pages/Yoga.jsx` | `pages.yoga.sections.methodology.steps[].title` |
| Method step | `Secuencia de Asanas` | `src/pages/Yoga.jsx` | `pages.yoga.sections.methodology.steps[].title` |
| Method step | `Relajación y Meditación` | `src/pages/Yoga.jsx` | `pages.yoga.sections.methodology.steps[].title` |
| Method conclusion | `Un ciclo completo. Cuerpo y mente en equilibrio.` | `src/pages/Yoga.jsx` | `pages.yoga.sections.methodology.conclusion` |
| Section label | `Beneficios` | `src/pages/Yoga.jsx` | `pages.yoga.sections.benefits.title` |
| Benefit item | `Mayor flexibilidad y movilidad` | `src/pages/Yoga.jsx` | `pages.yoga.sections.benefits.items[].title` |
| Benefit item | `Gestión del estrés y ansiedad` | `src/pages/Yoga.jsx` | `pages.yoga.sections.benefits.items[].title` |
| Benefit item | `Fuerza y estabilidad` | `src/pages/Yoga.jsx` | `pages.yoga.sections.benefits.items[].title` |
| Benefit item | `Equilibrio cuerpo, mente y espíritu.` | `src/pages/Yoga.jsx` | `pages.yoga.sections.benefits.items[].title` |
| Section label | `Ideal para ti si…` | `src/pages/Yoga.jsx` | `pages.yoga.sections.ideal.title` |
| Ideal bullet | `Buscas reducir el estrés diario.` | `src/pages/Yoga.jsx` | `pages.yoga.sections.ideal.items[]` |
| Ideal bullet | `Quieres mejorar tu flexibilidad.` | `src/pages/Yoga.jsx` | `pages.yoga.sections.ideal.items[]` |
| Ideal bullet | `Deseas fortalecer tu cuerpo de forma consciente.` | `src/pages/Yoga.jsx` | `pages.yoga.sections.ideal.items[]` |
| Ideal bullet | `Te interesa desarrollar equilibrio físico y mental.` | `src/pages/Yoga.jsx` | `pages.yoga.sections.ideal.items[]` |

### Media hardcodeada

| Campo visual | Path/URL actual | Tipo | Componente/archivo | Propuesta key backend |
|---|---|---|---|---|
| Hero background | `https://res.cloudinary.com/dtj8woibw/image/upload/v1781473011/yoga_studio2_nqvmqf.png` | imagen | `src/pages/Yoga.jsx` | `pages.yoga.hero.image` |
| Hero logo | `https://res.cloudinary.com/dtj8woibw/image/upload/v1781472997/LOGO_YOGA_xbhcjh.png` | imagen | `src/pages/Yoga.jsx` | `pages.yoga.hero.logo` |
| Concept panel bg | `https://res.cloudinary.com/dtj8woibw/image/upload/v1781473011/yoga_position_ufcvce.png` | imagen | `src/pages/Yoga.jsx` | `pages.yoga.sections.concept.media` |
| Quote panel bg | `https://res.cloudinary.com/dtj8woibw/image/upload/v1781473010/yoga_studio3_qihsve.png` | imagen | `src/pages/Yoga.jsx` | `pages.yoga.sections.quote.media` |

### Bloques repetibles

| Bloque | Cantidad actual | Campos por item | Propuesta key backend |
|---|---:|---|---|
| Stats | 2 | `num`, `label` | `pages.yoga.stats[]` |
| Philosophy | 3 | `title`, `description`, `icon` | `pages.yoga.sections.philosophy.items[]` |
| Method steps | 3 | `title`, `description`, `icon` | `pages.yoga.sections.methodology.steps[]` |
| Benefits | 4 | `title`, `icon` | `pages.yoga.sections.benefits.items[]` |
| Ideal bullets | 4 | `text` | `pages.yoga.sections.ideal.items[]` |

### CTAs / Links

| Label actual | URL/acción actual | Propuesta key backend |
|---|---|---|
| `Reservar clase` | `/clases?tipo=Slow` | `pages.yoga.hero.ctas[0]` |

## Footer

### Horarios

| Label actual | Value actual | Propuesta key backend |
|---|---|---|
| `Lun — Vie` | `07:00 am – 11:00 am | 17:00 pm – 20:00 pm` | `footer.scheduleRows[0]` |
| `Sáb — Dom` | `10:00 am – 12:00 pm` | `footer.scheduleRows[1]` |

### Contacto / Redes / Dirección

| Campo | Valor actual | Propuesta key backend |
|---|---|---|
| Logo marca | `CASA_SCARLATTA_ISOTIPO_mz2cxr.png` | `footer.brand.logo` |
| Tagline | `Estudio de movimiento enfocado en el bienestar integral. Mind · Body · Flow` | `footer.brand.tagline` |
| Link estudio | `Stryde X`, `Slow`, `Yoga`, `Nosotros` | `footer.links.studio[]` |
| Link visita | `Reservar clase`, `Contacto` | `footer.links.visit[]` |
| Instagram | `https://www.instagram.com/casa.scarlatta/` | `footer.social.instagramUrl` |
| Facebook | `https://facebook.com` | `footer.social.facebookUrl` |
| Dirección | no existe en JSX actual | `footer.contact.address` si se decide mostrar |
| Teléfono | no existe en JSX actual | `footer.contact.phone` si se decide mostrar |
| Email | no existe en JSX actual | `footer.contact.email` si se decide mostrar |

## Propuesta de mapping a site_configuration

### Puede mapearse con contrato actual

- `pages.suet.hero.*`
- `pages.flow.hero.*`
- `pages.yoga.hero.*`
- `pages.suet.sections.*`
- `pages.flow.sections.*`
- `pages.yoga.sections.*`
- `footer.scheduleRows`
- `footer.brand.*`
- `footer.social.*`

### Requiere extender contrato backend

- `pages.*.stats[]` si contrato actual no soporta arrays
- `pages.*.sections[].items[]` si contrato actual no soporta bloques repetibles
- `pages.*.hero.ctas[]` si contrato actual no soporta CTA múltiple
- `footer.links.*` si se quiere editar links sin hardcode
- `footer.contact.*` si se quiere mostrar dirección/teléfono/email

## Recomendación

1. ¿El backend actual alcanza para editar todo?

   Casi todo. Alcanza si `pages.suet`, `pages.flow`, `pages.yoga` aceptan estructura flexible con `hero`, `sections[]`, `stats[]`, `items[]`, `ctas[]`. Si no, faltan arrays para bloques repetibles.

2. ¿Qué campos faltan?

   Faltan solo campos estructurales si backend quedó estricto: `stats[]`, `sections[].items[]`, `hero.ctas[]`, y opcional `footer.links.*` / `footer.contact.*`.

3. ¿Qué estructura exacta debe usar frontend?

   Estructura por página:

   - `hero`: `overline`, `tagline`, `subtitle`, `slogan`, `image`, `logo`, `ctas[]`
   - `stats[]`: `label`, `value`
   - `sections[]`: `id`, `title`, `heading`, `body`, `media`, `items[]`
   - `footer.scheduleRows[]`: `label`, `value`

4. ¿Qué UI admin recomiendas: tabs, cards, accordions?

   Tabs por página: `Suet`, `Flow`, `Yoga`, `Footer`. Dentro, cards por bloque. `sections[]` y `items[]` en accordions repetibles.

5. ¿Qué debe implementarse primero?

   Primero contrato/adapters + carga/guardado. Luego editor de textos. Luego repetidores de cards. Al final media uploads y orden de bloques.

## ImplementaciÃ³n frontend final

- `/stryde-x`, `/slow`, `/yoga` y `Footer` ya leen `site_configuration` backend en API mode.
- Admin UI nueva edita `pages.suet`, `pages.flow`, `pages.yoga` y `footer`.
- Media nueva usa Cloudinary firmado; fallback legacy `/configuracion/site/upload` queda solo respaldo.
- `localStorage` queda fallback solo con API mode apagado.