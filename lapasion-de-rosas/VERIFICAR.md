# Datos pendientes de confirmación

El sitio **no publica ningún dato que el restaurante no haya confirmado**.
Cada dato sensible lleva un flag `verificado` en `content/site.ts`. Mientras
sea `false`, la página no muestra el valor: invita a consultar en su lugar.

Es preferible que el sitio diga "escribinos" antes que publicar una dirección
o un horario equivocado y que alguien viaje a Ezeiza un día que está cerrado.

## Lo más urgente

| # | Dato | Dónde se edita | Qué pasa hoy |
|---|---|---|---|
| 1 | **La carta** | `content/menu.ts` | ⚠️ Hay platos y precios **de ejemplo** con un aviso naranja visible. Poné `cartaVerificada = true` sólo cuando los reemplaces por los reales. **No publiques el sitio así.** |
| 2 | **WhatsApp** | `contacto.whatsapp` | Sin número no hay botón de reserva: el sitio cae a Instagram, y si tampoco está, muestra un aviso. |
| 3 | **Dirección** | `contacto.direccion` | Se muestra "Ezeiza, Provincia de Buenos Aires · dirección exacta al confirmar la reserva". |
| 4 | **Horarios** | `contacto.horarios` | Se muestra "Días y horarios a confirmar · escribinos". |
| 5 | **Instagram** | `redes.instagram` | La sección del feed **no se renderiza** hasta confirmarlo. |
| 6 | **Fotos** | `content/medios.ts` | Composiciones provisionales marcadas, con el encuadre sugerido para la sesión de fotos. |
| 7 | **Logotipo** | `marca.logo` | Se compone el nombre tipográficamente. No se redibujó ningún logo. |
| 8 | Teléfono y correo | `contacto.telefono`, `contacto.email` | No aparecen en el pie. |
| 9 | Google Maps | `contacto.mapaUrl` | El enlace "Ver en mapa" no aparece. |

## Cómo confirmar un dato

```ts
// Antes
whatsapp: dato("", false, "PENDIENTE..."),
// Después
whatsapp: dato("5491155550000", true),
```

La sección correspondiente aparece sola.

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
