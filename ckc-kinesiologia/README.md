# CKC Kinesiología — sitio web

Sitio institucional de **CKC — Consultorio Kinésico Canning**, un consultorio de
kinesiología en Canning, Provincia de Buenos Aires.

Sitio estático, sin JavaScript de framework, pensado para cargar rápido, posicionar bien
en búsquedas locales y convertir visitantes en consultas por WhatsApp.

👉 **Antes de publicar, leer [`PENDIENTES.md`](./PENDIENTES.md).** Ahí está todo lo que el
sitio todavía no publica porque falta confirmarlo, y cómo completarlo.

---

## Arrancar

```bash
npm install
```

```bash
npm run dev
```

Queda en `http://localhost:4321`. En modo desarrollo se ven, además, las notas internas de
qué dato falta confirmar en cada lugar; esas notas **nunca se publican**.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm run build` | Genera el sitio en `dist/` |
| `npm run preview` | Sirve lo que quedó en `dist/`, para revisarlo antes de publicar |
| `npm run check` | Revisa tipos y plantillas |
| `npm run words` | Cuenta las palabras de contenido de cada página |
| `node scripts/verificar-enlaces.mjs` | Revisa que todos los enlaces internos y anclas resuelvan |
| `node scripts/verificar-seo.mjs` | Revisa títulos, descripciones, encabezados, `alt` y datos estructurados |
| `node scripts/generar-imagenes.mjs` | Regenera la imagen para compartir en redes y el icono |

Los tres scripts de verificación se corren **después** de `npm run build`.

---

## Qué tiene el sitio

**Una landing de página única**, más la política de privacidad (necesaria por el
formulario) y un error 404.

Secciones de la landing, en orden: hero con cifras · servicios (cinco áreas, cada una
desplegable) · MEP como área destacada · buscá por lo que te pasa · quiénes somos ·
clubes e instituciones · instalaciones · equipo · preguntas frecuentes · turnos.

El sistema visual está portado del sitio de referencia que indicó el cliente: una sola
familia tipográfica (Outfit), escala de verdes con acentos ámbar, esquinas de 20 y 32 px,
sombras verdes amplias y barra superior de contacto.

- Navegación por anclas con marcado de la sección activa al desplazarse.
- Menú lateral en celulares, con foco atrapado y cierre con `Esc`.
- Botón flotante de WhatsApp que aparece al bajar y se esconde al llegar al pie.
- Galería de instalaciones con ampliación en pantalla completa y navegación por teclado.
- Formulario de contacto con validación en español y protección básica contra envíos automáticos.
- Animaciones de aparición suaves, que se desactivan solas si el sistema pide menos movimiento.
- Títulos y descripciones SEO propios por página, datos estructurados, sitemap y `robots.txt`.

### Rendimiento

- **0 KB de JavaScript de framework.** Solo ~4 KB de scripts propios, incrustados.
- Tipografías servidas desde el propio dominio: sin pedidos a Google Fonts ni datos de
  los visitantes a terceros.
- Imágenes optimizadas por Astro, con formatos modernos, tamaños por pantalla y carga diferida.
- El sitio entero pesa ~1,8 MB, y la mayor parte son tipografías que el navegador
  descarga una sola vez.

---

## Cómo está organizado

```
src/
├── data/            ← Acá se edita el contenido y la configuración
│   ├── site.ts            Configuración central: contacto, ubicación, horarios…
│   ├── site-url.mjs       Dominio del sitio
│   ├── servicios.ts       Las 5 áreas de atención, con todo su contenido
│   ├── especialidades.ts  Motivos de consulta
│   ├── preguntas.ts       Preguntas frecuentes
│   ├── equipo.ts          Fichas de los profesionales
│   ├── instalaciones.ts   Galería de fotos
│   └── navegacion.ts      Menús y pie de página
│
├── content/blog/    ← Las notas del blog, en Markdown
├── components/      ← Componentes reutilizables
├── layouts/Base.astro     Estructura común de todas las páginas
├── pages/           ← Una página por archivo; la URL sale de la ruta
├── styles/
│   ├── tokens.css         Colores, tipografías, espaciados, medidas
│   └── global.css         Estilos base y utilidades
└── imagenes/        ← Acá van las fotos propias (las optimiza Astro)
```

### Dónde tocar cada cosa

| Quiero cambiar… | Archivo |
|---|---|
| Teléfono, WhatsApp, dirección, horarios, redes | `src/data/site.ts` |
| Los colores o las tipografías | `src/styles/tokens.css` |
| El texto de un servicio | `src/data/servicios.ts` |
| Una pregunta frecuente | `src/data/preguntas.ts` |
| Los profesionales | `src/data/equipo.ts` |
| Las fotos de instalaciones | `src/data/instalaciones.ts` |
| El menú | `src/data/navegacion.ts` |
| El orden o el texto de una sección | `src/pages/index.astro` |
| Las fotos ilustrativas | `src/data/fotos.ts` |
| Años, cifras y clubes | `src/data/trayectoria.ts` |

### Agregar un servicio

Sumar una entrada a `SERVICIOS` en `src/data/servicios.ts`. Aparece sola como tarjeta en
la landing, con su desplegable, su ancla propia y su enlace en el pie.

Los nueve apartados de cada servicio (introducción, descripción, situaciones, objetivos,
evaluación, proceso, participación, preguntas y advertencia) siguen cargados en el
archivo aunque la landing muestre un resumen: si en algún momento se vuelven a abrir
páginas por servicio, el contenido ya está escrito.

---

## Decisiones que conviene conocer

### Nada inventado

No se publicó ningún dato que no pudiera verificarse en un canal oficial del consultorio:
ni teléfono, ni dirección, ni horarios, ni matrículas, ni coberturas médicas, ni fotos de
las instalaciones. Donde falta el dato, el sitio lo dice y ofrece el canal que sí está
activo. El detalle completo está en [`PENDIENTES.md`](./PENDIENTES.md).

### Los botones de WhatsApp no se rompen

Mientras no haya número confirmado, los botones llevan a `/contacto/#canales`, donde se
explica la situación. Al cargar el número en `CONTACTO.whatsapp`, los ~40 botones del
sitio pasan solos a abrir WhatsApp, cada uno con un mensaje distinto según la sección.

### El formulario no simula envíos

Hoy valida los datos y arma un mensaje que la persona envía por WhatsApp. No muestra
ningún "mensaje enviado" porque no hay servidor que lo reciba, y eso está dicho de forma
visible en la página. Para recepción por correo, cargar `FORMULARIO.endpoint`.

### Contenido de salud responsable

No se prometen resultados, no se garantiza que el dolor desaparezca, no se fijan plazos de
recuperación y no se indican ejercicios ni técnicas para casos particulares. Cada página
aclara que la información es general y que la indicación surge de una evaluación
individual. **Aun así, debe validarlo un profesional matriculado del consultorio.**

### Dos detalles de Astro que conviene tener presentes

1. **Los estilos de un componente no alcanzan la raíz de otro.** Si una página le pasa una
   clase a `<Boton>` o `<AvisoPendiente>` y quiere estilarla, la regla va con `:global()`.
   Si no, no se aplica y el error es silencioso.
2. **Las imágenes propias van en `src/imagenes/`, no en `public/`.** Solo así Astro las
   optimiza, les genera formatos modernos y versiones por pantalla.

---

## Publicar

El sitio es estático: `npm run build` deja todo en `dist/` y eso se sube a cualquier
hosting (Netlify, Vercel, Cloudflare Pages, GitHub Pages o un servidor propio).

**Antes del primer deploy:** cargar el dominio real en `src/data/site-url.mjs` y
actualizar la línea `Sitemap:` de `public/robots.txt`.

En Netlify, Vercel o Cloudflare Pages:

```
Comando de build:      npm run build
Carpeta de publicación: dist
```

### Después de publicar

1. Verificar el sitio en Google Search Console y enviar `/sitemap-index.xml`.
2. Crear o reclamar la ficha de Google Business Profile del consultorio, con la misma
   dirección, teléfono y horarios que el sitio. Para posicionamiento local pesa tanto o
   más que la web.
3. Sumar el enlace del sitio a la biografía de Instagram.

---

## Tecnologías

[Astro](https://astro.build) 7 · TypeScript · CSS propio con variables ·
[Fontsource](https://fontsource.org) (Newsreader e Inter) · `@astrojs/sitemap`.

Sin framework de interfaz, sin framework de CSS y sin dependencias de interfaz: todo lo
visual es propio y se puede modificar sin pelear con una librería.
