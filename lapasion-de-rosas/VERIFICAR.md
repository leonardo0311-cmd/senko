# Datos pendientes de confirmación

Este sitio **no publica ningún dato que el restaurante no haya confirmado**.
Cada dato sensible vive en `content/site.ts` con un flag `verificado`. Mientras
sea `false`, la página no muestra el valor: en su lugar invita a consultar.

Esto es deliberado. Es preferible que el sitio diga "consultanos" antes que
publicar una dirección o un horario equivocado, y que alguien viaje a Ezeiza
un día que el restaurante está cerrado.

## Cómo confirmar un dato

1. Abrí `content/site.ts`.
2. Buscá el campo, escribí el valor real y poné `verificado: true`.
3. Listo: la sección correspondiente aparece sola.

```ts
// Antes
whatsapp: dato("", false, "PENDIENTE..."),

// Después
whatsapp: dato("5491155550000", true),
```

---

## Lista de pendientes

| Dato | Campo en `content/site.ts` | Qué pasa mientras no esté | Por qué está pendiente |
|---|---|---|---|
| **WhatsApp oficial** | `contacto.whatsapp` | El botón flotante no aparece y los botones de consulta llevan al formulario. El formulario avisa que falta el canal. | Las fuentes públicas listan números distintos y desactualizados. |
| **Teléfono** | `contacto.telefono` | No se muestra en el pie. | Sin confirmar. |
| **Correo** | `contacto.email` | No se muestra en el pie. | Sin confirmar. |
| **Dirección exacta** | `contacto.direccion` | Se muestra sólo "Ezeiza, Provincia de Buenos Aires" + "Te pasamos la dirección exacta al confirmar tu reserva". | Fuentes públicas en conflicto: *José A. Berutti 287* vs. *Arturo U. Illia 710*. |
| **Enlace de Google Maps** | `contacto.mapaUrl` | El botón "Cómo llegar" no aparece. | Sin confirmar. |
| **Coordenadas** | `contacto.coordenadas` | El mapa no se carga. | Depende de la dirección. |
| **Horarios** | `contacto.horarios` | Se muestra "Trabajamos con reserva previa. Consultanos por los días y turnos disponibles." | Fuentes públicas en conflicto entre sí. |
| **Perfil de Instagram** | `redes.instagram` | La sección de notoriedad entera no se renderiza. | Hay que confirmar que `@la_pasion_de_rosas` sea el perfil oficial vigente. |
| **Seguidores** | `redes.seguidores` | No se muestra ningún número. | El brief menciona +160.000. **No se publica un contador sin confirmar ni actualizar.** |
| **Carta** | `content/menu.ts` → `categorias` | Se muestra una invitación a consultar la propuesta del día. | **No se inventaron platos, precios ni técnicas de cocción.** |
| **Formatos de servicio** | `content/menu.ts` → `formatosServicio.verificado` | El bloque no aparece. | Fuentes públicas mencionan "Menú por pasos" y "Carta abierta", sin confirmación del restaurante. |
| **Logotipo oficial** | `marca.logo.archivo` | Se compone el nombre tipográficamente. **No se redibujó el logotipo.** | Falta el archivo original. |
| **Fotografías y video** | `content/medios.ts` | Composiciones provisionales marcadas como tales, con el encuadre sugerido. | Falta el material fotográfico. |

---

## Lo que el sitio NO afirma

Por pedido explícito del brief, y porque no hay forma de verificarlo, la página
no dice en ningún lado que el restaurante tenga:

- salones privados, espacios exclusivos o mesas reservadas;
- paquetes de eventos, capacidad máxima o decoración personalizada;
- confidencialidad, aislamiento acústico o equipamiento para reuniones;
- premios, visitas de celebridades o acuerdos comerciales;
- menús especiales, tortas o servicios adicionales.

Tampoco hay reseñas, testimonios ni contadores inventados.

Si alguno de estos servicios sí existe, se puede sumar como texto en
`content/site.ts` o como una experiencia nueva en `content/experiencias.ts`.
