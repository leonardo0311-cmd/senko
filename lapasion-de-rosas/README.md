# La Pasión de Rosas — Experiencia web

Sitio del restaurante **La Pasión de Rosas**, en Ezeiza, Provincia de Buenos
Aires. Concepto: *el arte de encontrarse*.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # compilación de producción
npm start        # servir lo compilado
npm run typecheck
```

---

## 1. Antes de publicar: leé `VERIFICAR.md`

El sitio está construido sobre una regla: **no publica ningún dato que el
restaurante no haya confirmado.** Teléfono, dirección, horarios, seguidores y
carta están marcados como pendientes y, mientras lo estén, la página invita a
consultar en vez de mostrar un valor inventado.

`VERIFICAR.md` tiene la lista completa y cómo completarla.

---

## 2. Dónde se edita cada cosa

Todo el contenido vive en `/content`. **No hace falta tocar ningún componente.**

| Qué querés cambiar | Archivo |
|---|---|
| Textos, títulos, frases | `content/site.ts` → `textos` |
| Teléfono, dirección, horarios, redes | `content/site.ts` → `contacto`, `redes` |
| Cómo funcionan las reservas | `content/site.ts` → `reservas` |
| Fotos y video | `content/medios.ts` |
| Platos y precios | `content/menu.ts` |
| Ocasiones (cena, familia, trabajo, celebración) | `content/experiencias.ts` |
| Orden de la galería | `content/galeria.ts` |
| Títulos y descripción para Google | `content/site.ts` → `seo` |

### Cargar una fotografía

1. Guardá el archivo en `public/fotos/` (preferentemente `.avif` o `.webp`).
2. En `content/medios.ts`, escribí la ruta en `src` y revisá el `alt`:

```ts
platoPrincipal: medio({
  src: "/fotos/costillar.avif",   // antes: null
  alt: "Costillar asado recién servido, con su corte a la vista.",
  ratio: "3/4",
  tono: "brasa",
  encuadre: "...",
}),
```

Mientras `src` sea `null`, el sitio dibuja una composición provisional
—generada con CSS, **sin usar fotos de otros restaurantes**— que lleva una
marca visible *"Imagen provisional"* y el encuadre sugerido para la producción
fotográfica. En cuanto cargás la foto real, la marca desaparece sola.

Cada entrada de `content/medios.ts` incluye el encuadre recomendado: sirve
como guion para la sesión de fotos.

### Cargar el video de portada

Subí un MP4 comprimido (H.264, sin audio, 8–12 s en loop) a `public/video/` y
escribí la ruta en `videoPortada.src`. Si no hay video, la portada usa la
imagen `heroPoster`.

### Cargar la carta

En `content/menu.ts`, agregá platos dentro de la categoría que corresponda:

```ts
{
  id: "brasas",
  nombre: "De las brasas",
  platos: [
    { nombre: "Costillar asado", descripcion: "...", precio: null },
  ],
},
```

`precio: null` no muestra precio (recomendado si cambian seguido).
Mientras no haya platos cargados, la sección invita a consultar la propuesta
del día: **no se inventan nombres ni precios.**

### Configurar las reservas

En `content/site.ts` → `reservas.canal`:

- `"whatsapp"` *(por defecto)*: el formulario arma un mensaje precargado y lo
  abre en WhatsApp. Requiere `contacto.whatsapp` confirmado.
- `"email"`: abre el cliente de correo. Requiere `contacto.email`.
- `"plataforma"`: redirige a un sistema externo. Requiere `plataformaUrl`.

El sitio **nunca confirma una reserva por su cuenta**: siempre aclara que queda
sujeta a confirmación del restaurante.

---

## 3. Arquitectura

```
content/            Todo el contenido editable (la única fuente de verdad)
src/app/            Layout, página, globals.css, sitemap, robots
src/components/     Secciones y componentes
src/components/ui/  Primitivas: Revelar, Boton, Medio, Logotipo, MarcaRosa
src/lib/            whatsapp, analitica, motion, useProgresoScroll
```

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4.

### Sobre las animaciones: por qué no hay GSAP

El brief sugería GSAP + ScrollTrigger. Se evaluó y **se decidió no incluirlo**:
el sitio tiene exactamente tres necesidades de scroll —revelar bloques,
un parallax leve y la intensidad de las brasas— y las tres se resuelven con
`IntersectionObserver` y una ref actualizada en `requestAnimationFrame`
(`src/lib/useProgresoScroll.ts`). Sumar GSAP habría agregado ~70 KB para eso.

El resultado: **cero dependencias de animación** y un bundle de ~30 KB de JS
propio. Si en algún momento hace falta una secuencia realmente compleja
(timelines encadenados, pinning), GSAP se puede sumar sin tocar el resto:
el sistema está aislado en `src/lib/` y en `src/components/ui/Revelar.tsx`.

### Las brasas (`src/components/Brasas.tsx`)

Un solo `<canvas>` 2D, no cientos de nodos del DOM. El sprite de la chispa se
dibuja una vez en un canvas auxiliar y después se estampa, en vez de crear un
degradado radial por partícula y por fotograma.

La densidad se adapta al equipo (`src/lib/motion.ts`): 110 partículas en
escritorio, 34 en gama media o celular, **0 con `prefers-reduced-motion`**.
El bucle sólo corre mientras la sección está en pantalla y se detiene si la
pestaña pasa a segundo plano.

---

## 4. Accesibilidad

Objetivo: **WCAG 2.2 AA** en los flujos principales. Verificado:

- Contraste AA en los 343 nodos de texto de la página.
- Navegación completa por teclado; foco visible en todo el sitio.
- Menú móvil y visor de galería: foco atrapado, `Escape` cierra, el foco
  vuelve al elemento que abrió.
- Galería navegable con flechas.
- Selector de ocasión como `tablist` con flechas, `Home` y `End`.
- Formulario: etiquetas asociadas, errores explicados con texto (no sólo
  color), el foco va al primer campo con problema, no se pierde lo escrito.
- `prefers-reduced-motion`: sin animaciones, sin brasas, todo el contenido
  visible desde el primer render.
- **Sin JavaScript la página se lee completa.** El estado inicial oculto lo
  aplica una clase que sólo se agrega si hay JS.
- Un solo `<h1>`, jerarquía de encabezados sin saltos, HTML semántico.

---

## 5. Rendimiento

- Imágenes vía `next/image` con AVIF/WebP, tamaños responsivos y `lazy` salvo
  la portada.
- Proporciones declaradas en cada imagen: no hay saltos de maquetado (CLS).
- Animaciones sólo sobre `transform`, `opacity` y `clip-path`.
- Los listeners de scroll pasan por `requestAnimationFrame` y son `passive`.
- Degradación elegante: si no hay video, hay foto; si el equipo es modesto,
  menos partículas; si no hay JS, el contenido igual se lee.

---

## 6. Medición

`src/lib/analitica.ts` emite un `CustomEvent` y, si existe, escribe en
`window.dataLayer`. **No incluye ningún script de terceros.** Conectá tu
herramienta respetando el consentimiento del visitante:

```js
document.addEventListener("lpdr:evento", (e) => {
  console.log(e.detail); // { evento: "reserva_click", origen: "hero" }
});
```

Eventos: `reserva_click`, `reserva_inicio_formulario`, `reserva_envio`,
`whatsapp_click`, `como_llegar_click`, `instagram_click`, `menu_visto`,
`ocasion_seleccionada`. Nunca se envían datos personales.

---

## 7. Despliegue

Definí `NEXT_PUBLIC_SITE_URL` con el dominio real (ver `.env.example`): se usa
para el canonical, el sitemap y las vistas previas al compartir el enlace.

```bash
npm run build && npm start
```

Funciona en cualquier hosting con Node. En Vercel no necesita configuración
extra.
