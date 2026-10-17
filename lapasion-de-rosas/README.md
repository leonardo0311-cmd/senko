# La Pasión de Rosas

Sitio de **La Pasión de Rosas**, parrilla a las brasas en Ezeiza, Provincia de
Buenos Aires. Bilingüe (español/inglés).

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # producción
npm start
npm run typecheck
STATIC_EXPORT=1 npm run build   # sitio estático en /out
```

---

## 1. Antes de publicar: leé `VERIFICAR.md`

Dos cosas impiden publicarlo hoy:

1. **La carta** tiene platos y precios de ejemplo, con un aviso naranja visible
   en la página (`cartaVerificada = false`).
2. **Las fotos** son imágenes de referencia generadas con IA, art-directadas a
   la paleta: no son fotos del local ni de sus platos (`generada: true` en
   `content/medios.ts`).

`VERIFICAR.md` tiene la lista completa y la tabla de qué reemplazar por qué.

---

## 2. Dónde se edita cada cosa

Todo el contenido vive en `/content`. No hace falta tocar ningún componente.

| Qué querés cambiar | Archivo |
|---|---|
| **Cualquier texto visible** (en los dos idiomas) | `content/i18n.ts` |
| Teléfono, dirección, horarios, redes | `content/site.ts` |
| Platos, precios y etiquetas | `content/menu.ts` |
| Fotos y video | `content/medios.ts` |
| Orden y tamaño de la galería | `content/galeria.ts` |
| Las cuatro ocasiones | `content/ocasiones.ts` |

### Cargar una foto

1. Guardala en `public/fotos/` (preferentemente `.avif` o `.webp`).
2. En `content/medios.ts`, escribí la ruta en `src`:

```ts
hero: { src: "/fotos/costillar.avif", ancho: 1920, alto: 1080, generada: false, … }
```

`ancho` y `alto` son los del archivo: reservan el espacio y evitan saltos de
maquetado

y poné `generada: false`.

Las imágenes que vienen cargadas son **originales generadas para este
proyecto** —no stock ajeno— pero no retratan el local: son referencia hasta
que llegue la producción real. Si `src` es `null` (hoy, sólo la fachada), el
sitio dibuja una composición hecha con CSS marcada como provisional. El campo
`encuadre` de cada entrada es el guion para la sesión de fotos.

### Cargar la carta

En `content/menu.ts`, reemplazá los platos de ejemplo y poné
`cartaVerificada = true`. El aviso naranja desaparece solo.

```ts
{ n: "Costillar asado", nEn: "Short ribs", p: "56.000", t: ["Brasas", "Compartir"] }
```

`p` es el precio sin signo; dejalo vacío para no mostrarlo. Las etiquetas
(`t`) alimentan los filtros y se traducen desde `content/i18n.ts`.

### Agregar un idioma

`content/i18n.ts` tiene un objeto por idioma con las mismas claves. Agregá el
tuyo y sumalo al tipo `Idioma`.

---

## 3. Arquitectura

```
content/            Todo el contenido editable
src/app/            Layout, página, globals.css, sitemap, robots, og-image
src/components/     Secciones
src/components/ui/  Medio (fotos/placeholder), Cursor, Revelar
src/lib/            idioma (ES/EN), whatsapp, analitica
```

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4.
Cero dependencias de animación: el revelado usa `IntersectionObserver` con
transiciones CSS, y las brasas son 26 elementos con una animación CSS, no un
bucle de JavaScript por fotograma.

### Idiomas

`src/lib/idioma.tsx` expone un contexto con `t()` para las claves y `pick()`
para los campos bilingües de la carta. Arranca **siempre en español**, así el
HTML del servidor coincide con el primer render del cliente y Google indexa la
versión en español; el idioma elegido se recuerda en `localStorage`.

---

## 4. Accesibilidad

Objetivo **WCAG 2.2 AA**. Verificado automáticamente en el navegador:

- Contraste AA en los 202 nodos de texto, en las secciones claras y oscuras.
- Un solo `h1` y jerarquía de encabezados sin saltos.
- Buscador de la carta con etiqueta asociada y resultados anunciados
  (`aria-live`); filtros con `aria-pressed`.
- Visor de galería: `role="dialog"`, foco atrapado, flechas, `Escape`, y el
  foco vuelve al elemento que lo abrió.
- Panel móvil con `aria-expanded` y cierre con `Escape`.
- `prefers-reduced-motion`: sin brasas, sin ken burns, sin marquesina animada
  y todo el contenido visible desde el primer render.
- **Sin JavaScript la página se lee completa**, carta incluida.
- El cursor contextual sólo se activa en equipos con mouse.

---

## 5. Medición

`src/lib/analitica.ts` emite un `CustomEvent` y, si existe, escribe en
`window.dataLayer`. **No incluye ningún script de terceros.** Conectá tu
herramienta respetando el consentimiento:

```js
document.addEventListener("lpdr:evento", (e) => console.log(e.detail));
```

Eventos: `reserva_click`, `whatsapp_click`, `instagram_click`,
`como_llegar_click`, `menu_visto`, `ocasion_seleccionada`.
Nunca se envían datos personales.

---

## 6. Despliegue

Definí `NEXT_PUBLIC_SITE_URL` con el dominio real (ver `.env.example`).

```bash
npm run build && npm start
```

Para hosting sin Node: `STATIC_EXPORT=1 npm run build` genera `/out`. En ese
modo las imágenes no se optimizan y las cabeceras de seguridad hay que
configurarlas en el hosting (están en `next.config.ts`).
