# RINDE — Entertainment Marketing (web)

Web institucional y comercial de RINDE. React 19 + Vite + Tailwind CSS 4 + Framer Motion. Se publica en Vercel (proyecto `rinde`).

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
```

## Dónde se edita el contenido

Todo el texto vive en `src/data/`. No hace falta tocar componentes para cambiar contenido.

| Archivo | Qué contiene |
| --- | --- |
| `src/data/site.ts` | Marca, contacto (WhatsApp, email, Instagram), hero, pilares, capacidades, modalidades, Sobre RINDE |
| `src/data/areas.ts` | Las 4 áreas (Artist, Venue, Event, Brands): textos de tarjeta, página y SEO |
| `src/data/process.ts` | Metodología (Discovery → Measurement) |
| `src/data/projects.ts` | Portfolio. Sólo se muestran los proyectos con `published: true` |
| `src/data/team.ts` | Equipo |

### Datos pendientes

Los valores en `null` no se muestran (no se inventan): `contact.whatsapp`, `contact.email`, `hero.video`.
El logo está vectorizado en `src/data/logo.ts` (y en `public/brand/rinde-logo.svg`); toma el color del texto donde se use.
Al cargar el número de WhatsApp aparecen el botón flotante y el acceso en Contacto.

### Formulario

Definí `VITE_CONTACT_ENDPOINT` en Vercel (por ejemplo un formulario de Formspree). Sin endpoint, el formulario no simula un envío:
arma el mensaje y lo abre por WhatsApp, email o Instagram, según lo que esté cargado.

### Sumar un proyecto al portfolio

1. Subí fotos o videos a `public/media/<slug>/`.
2. Completá el caso en `src/data/projects.ts` (desafío, estrategia, ejecución, resultados reales).
3. Poné `published: true`. Requiere autorización del cliente para mostrar material y números.
