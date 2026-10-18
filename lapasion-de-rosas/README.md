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

**Guardá siempre dos versiones**: `nombre.avif` y `nombre.webp`. El sitio
sirve AVIF a quien lo soporta y WebP al resto. Sin el `.webp`, los navegadores
sin AVIF (Safari anterior a 16, iOS 15, webviews embebidos) no muestran
**nada**: el `<img>` queda vacío y la sección se ve negra.

```bash
# desde un original en alta
magick foto.jpg -resize 1920x -quality 82 public/fotos/nombre.webp
magick foto.jpg -resize 1920x -quality 60 public/fotos/nombre.avif
```

1. Guardá las dos en `public/fotos/`.
2. En `content/medios.ts`, escribí el **nombre base sin extensión** en `src`:

```ts
hero: { src: "costillar", ancho: 1920, alto: 1080, generada: false, … }
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

### Vercel (plan gratuito)

El proyecto vive en un subdirectorio y en una rama que **no** es la rama por
defecto del repo, así que al importarlo hay que tocar dos cosas:

1. vercel.com → **Add New… → Project** → importá `leonardo0311-cmd/senko`.
2. **Root Directory**: `lapasion-de-rosas` ← sin esto el build no encuentra nada.
3. Framework: *Next.js* (se detecta solo). No cambies build ni install command.
4. **Deploy**. Luego, en **Settings → Git → Production Branch**, poné
   `claude/affectionate-bardeen-mcb0cw` y volvé a desplegar.
   La rama por defecto del repo no contiene este proyecto.

No hace falta configurar ninguna variable de entorno: sin
`NEXT_PUBLIC_SITE_URL`, el sitio toma el dominio del propio deploy de Vercel
para el canonical, el sitemap y la vista previa al compartir. Cuando tengas el
dominio definitivo, definí `NEXT_PUBLIC_SITE_URL` y listo.

Verificado: `npm ci` + `npm run build` desde un clon limpio de la rama, en
Node 22, que es lo que corre Vercel.

### Otros hostings

Definí `NEXT_PUBLIC_SITE_URL` con el dominio real (ver `.env.example`).

```bash
npm run build && npm start
```

Para hosting sin Node: `STATIC_EXPORT=1 npm run build` genera `/out`. En ese
modo las imágenes no se optimizan y las cabeceras de seguridad hay que
configurarlas en el hosting (están en `next.config.ts`).

### Vista previa en una sola página

`scripts/construir-pagina-unica.py` arma el sitio entero en un único `.html`
autocontenido, pensado para compartirlo sin servidor:

```bash
STATIC_EXPORT=1 ASSET_PREFIX=./estaticos npm run build
python3 scripts/construir-pagina-unica.py pagina-unica.html
```

Qué hace y por qué:

- **Saca el documento externo.** No emite `doctype`/`html`/`head`/`body`
  propios, porque el servicio que la hospeda envuelve la página en su propio
  esqueleto. Un documento completo quedaba anidado dentro de otro y React
  fallaba al hidratar (error #418), con parte de las fotos sin pintar.
- **Embebe las fotos y el logotipo** en WebP como `data:` URI, así no dependen
  de ninguna ruta relativa.
- **Declara las variables de fuente en `:root`.** Next las pone como clase en
  `<html>`, etiqueta que en ese contexto no nos pertenece.
- **Cambia los 67 `@font-face`** (que repetían los mismos 13 woff2 y sumaban
  2 MB de base64) por una hoja de Google Fonts.
- **Reemplaza React por JavaScript plano** para el revelado al scrollear, la
  cabecera, el menú móvil, el cursor, el buscador y los filtros de la carta, el
  scrollspy del rail, el visor de la galería, la carta lacrada de bienvenida (que corre sola, sin botón) y
  las chispas sobre las fotos del fuego.

Lo que React hace en un `useEffect` hay que sembrarlo a mano acá. Si agregás
una interacción al sitio Next, agregala también en este script o en la página
única no va a existir.

Lo que esta versión no trae: el selector de idioma (necesita el diccionario
completo) y la analítica. El sitio Next conserva las dos cosas.

## El logotipo

`public/marca/logo-original.png` es el archivo tal como lo entregó el
restaurante: no se toca. `logo.webp` es el mismo con el fondo recortado
—usando la luminancia como canal alfa, porque la marca es clara sobre fondo
oscuro— para poder apoyarlo sobre cualquier superficie. No se redibujó ni se
recoloreó nada.

La paleta entera del sitio sale de ese archivo, que tiene exactamente tres
familias de color y ningún naranja:

| Token | Valor | De dónde sale |
|---|---|---|
| `--ink` … `--coal-2` | `#120d09` … `#291e13` | El marrón del fondo del logo, del percentil 50 al 95 de sus píxeles oscuros |
| `--bone` | `#fcfcfc` | El blanco del texto del logo |
| `--parchment`, `--stone`, `--stone-dim` | `#d2d1d0`, `#9a9896`, `#8c8987` | Mezclas de ese blanco con ese marrón, al 18%, 42% y 48% |
| `--champ-dim`, `--champ`, `--champ-bright` | `#a99574`, `#c0a27e`, `#cbaa87` | El dorado de la marca, en sus valores oscuro, dominante y claro |

El dorado es el único acento: la acción principal, la numeración de secciones,
los filetes, los avisos y las chispas del fuego. Los grises intermedios no se
eligieron a ojo; son mezclas de dos colores del propio logotipo, y cada uno
está elegido por el valor más bajo que todavía pasa 4.5:1 sobre la superficie
más clara donde puede aparecer.

`marca.logo` en `content/site.ts` manda. Si vuelve a `null`, el componente
`ui/Logotipo` compone el nombre tipográficamente, como antes de tenerlo.

## Publicar gratis en GitHub Pages

Vercel quedó bloqueado: el conector lee pero no escribe sobre el scope de la
cuenta, así que crear el proyecto desde acá devuelve 403. La alternativa sin
costo es GitHub Pages, que sirve el sitio desde el propio repositorio.

```bash
bash scripts/construir-pages.sh   # deja todo en docs/
git add docs && git commit && git push
```

Después, una sola vez, en **Settings → Pages** del repositorio:

- **Source:** Deploy from a branch
- **Branch:** `claude/affectionate-bardeen-mcb0cw` · carpeta `/docs`

Queda en `https://leonardo0311-cmd.github.io/senko/`.

Tres detalles hacen que funcione en un subdirectorio, y los tres están en el
script:

1. `assetPrefix` y `NEXT_PUBLIC_BASE_PATH` en `.`, para que las rutas sean
   relativas a la página y no a la raíz del dominio.
2. Un archivo `.nojekyll`. Sin él, Pages pasa el sitio por Jekyll, que ignora
   las carpetas que empiezan con guión bajo: `_next` desaparece entero y no
   queda ni CSS ni JavaScript.
3. El `<link>` del favicon, que Next emite en ruta absoluta **dos veces**: en
   el HTML y, escapado, dentro del payload con el que React hidrata. Arreglar
   sólo el primero no alcanza: React vuelve a pedir la ruta absoluta.

Verificado sirviendo `docs/` bajo `/senko/`: 12/12 imágenes, el logotipo, los
revelados, la intro y la dirección, sin una sola respuesta con error.

Para mover el sitio a un dominio propio, construir con
`NEXT_PUBLIC_SITE_URL=https://eldominio.com` y sin `NEXT_PUBLIC_BASE_PATH`.
