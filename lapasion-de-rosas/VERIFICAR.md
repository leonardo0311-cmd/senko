# Datos pendientes de confirmación

El sitio **no publica ningún dato que el restaurante no haya confirmado**.
Cada dato sensible lleva un flag `verificado` en `content/site.ts`. Mientras
sea `false`, la página no muestra el valor: invita a consultar en su lugar.

Es preferible que el sitio diga "escribinos" antes que publicar una dirección
o un horario equivocado y que alguien viaje a Ezeiza un día que está cerrado.

## Lo más urgente

> **Dos cosas impiden publicar el sitio hoy:** la carta tiene precios de
> ejemplo y las fotos son imágenes de referencia generadas con IA. Un
> restaurante que muestra platos que no son los suyos induce a error a quien
> reserva. Ambas están marcadas en el código y son de una línea cada una.

| # | Dato | Dónde se edita | Qué pasa hoy |
|---|---|---|---|
| 1 | **La carta** | `content/menu.ts` | ⚠️ Hay platos y precios **de ejemplo** con un aviso naranja visible. Poné `cartaVerificada = true` sólo cuando los reemplaces por los reales. **No publiques el sitio así.** |
| 2 | **WhatsApp** | `contacto.whatsapp` | Sin número no hay botón de reserva: el sitio cae a Instagram, y si tampoco está, muestra un aviso. |
| 3 | ~~Dirección~~ | `contacto.direccion` | ✅ **Resuelta.** Berutti 287, esquina Illia · Ezeiza (1804). Confirmada por el restaurante. |
| 4 | **Horarios** | `contacto.horarios` | Se muestra "Días y horarios a confirmar · escribinos". |
| 5 | **Instagram** | `redes.instagram` | La sección del feed **no se renderiza** hasta confirmarlo. |
| 6 | **Fotos** | `content/medios.ts` | ⚠️ Las 9 imágenes del sitio son **de referencia, generadas con IA**: no son fotos de La Pasión de Rosas ni de sus platos. Llevan `generada: true`, y desde ahora la galería muestra un aviso visible que lo dice. **Reemplazalas antes de publicar.** Falta la fachada, que sigue como composición provisional. |
| 7 | ~~Logotipo~~ | `marca.logo` | ✅ **Resuelto.** El restaurante lo entregó y está en la cabecera y el pie. El maestro es `public/marca/logo-original.png`; `logo.webp` es el mismo con el fondo recortado. No se redibujó nada. |
| 8 | Teléfono y correo | `contacto.telefono`, `contacto.email` | No aparecen en el pie. |
| 9 | Google Maps | `contacto.mapaUrl` | ⚠️ Es una **búsqueda** armada con la dirección confirmada, no el enlace de la ficha del local. Si el restaurante pasa el enlace de su ficha de Google, reemplazarlo. |
| 10 | **Prensa** | `content/site.ts` → `PRENSA` | ⚠️ Tres enlaces encontrados en una búsqueda web, con un aviso naranja visible. No se pudieron abrir para verificar su contenido. Poné `prensaVerificada = true` cuando los revises. |

## Datos que aparecieron en una búsqueda, sin confirmar

Una búsqueda web devolvió los datos de abajo. **No están cargados en el
sitio**: se anotan acá para que el restaurante los confirme o los corrija.
Ninguno viene del restaurante, así que ninguno se publica todavía.

| Dato | Lo que dice la búsqueda | Fuente |
|---|---|---|
| Teléfono | +54 9 11 4189-0473 | Tripadvisor |
| Dueño | César Leaños, atiende personalmente | Informe Operadores de Mercado |
| Formato | A puertas cerradas, sólo con reserva previa | Informe Operadores de Mercado |
| Especialidad | Costillar asado a leña, unas cinco horas | Tripadvisor |
| Nombre anterior | La Otilia | Tripadvisor |

Dos advertencias sobre esta tabla. Los datos salen de fichas de terceros, que
suelen quedar viejas: un teléfono o una dirección de Tripadvisor puede tener
años. Y las páginas no se pudieron abrir desde este entorno para leerlas
enteras, así que lo de arriba es lo que devolvió el buscador, no lo que dice
cada nota.

## Cómo confirmar un dato

```ts
// Antes
whatsapp: dato("", false, "PENDIENTE..."),
// Después
whatsapp: dato("5491155550000", true),
```

La sección correspondiente aparece sola.

## Sobre las fotografías

Las imágenes de `/public/fotos/` se generaron para este proyecto,
art-directadas a la paleta del sitio (negro #0d0a08, brasa #ff8347 / #c8481f,
hueso #f4ecdc). Son originales —no son stock de otro restaurante ni fotos
ajenas— pero **no retratan el local real**.

Cada entrada de `content/medios.ts` incluye en `encuadre` el plano sugerido:
sirve como guion para la sesión de fotos. Cuando lleguen las reales, cambiá
`src` y poné `generada: false`.

| Archivo | Qué muestra | Reemplazar por |
|---|---|---|
| `hero.avif` | Costillar sobre las brasas | Plano general bajo del costillar en la parrilla |
| `especialidad.avif` | El costillar de cerca | Plano cerrado del plato de la casa |
| `fuego.avif` | Brasas bajo la parrilla | Brasas reales, sin llama |
| `parrilla.avif` | Parrilla y brasas | La parrilla en pleno servicio |
| `detalle.avif` | Macro de brasas | Macro de mesa: sal, cuchillo, pan |
| `nosotros.avif` | Mesa servida (vertical) | Mesa servida, salón detrás |
| `salon.avif` | El salón (panorámica) | El salón preparado, antes de abrir |
| `vino.avif` | Copa de vino | Copa a contraluz |
| `reservas.avif` | Mesa esperando | Mesa preparada, luz baja |
| — | *(falta)* | **Fachada al anochecer** |

## Por qué están en conflicto

Las fuentes públicas se contradicen y tienen años de antigüedad:

- **Dirección:** *José A. Berutti 287* (Tripadvisor) vs. *Arturo U. Illia 710* (carta.menu).
- **Teléfono:** dos números distintos entre Tripadvisor y otras guías.
- **Horarios:** tres versiones distintas según la fuente.

Por eso ninguno se publica sin que el restaurante lo confirme.

## Lo que el sitio NO afirma

No dice en ningún lado que el restaurante tenga salones privados, espacios
exclusivos, paquetes de eventos, capacidad determinada, decoración
personalizada, menús especiales, premios ni visitas de celebridades.
Tampoco hay reseñas, testimonios ni contadores de seguidores inventados.

Si alguno de esos servicios sí existe, se agrega como texto en
`content/i18n.ts` o como una ocasión nueva en `content/ocasiones.ts`.
