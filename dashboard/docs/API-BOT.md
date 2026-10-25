# API para el bot de WhatsApp

Referencia de los endpoints que consume el bot de turnos. Pensada para que el
bot **no tenga que hacer ninguna cuenta de plata**: manda montos a precio
general y el servidor devuelve el recargo o descuento ya aplicado.

## Autenticación

Todas las llamadas llevan la cabecera:

```
x-senko-bot-key: <valor de SENKO_BOT_API_KEY>
```

Sin ella o con una clave distinta: `401`. Si el servidor no tiene la variable
configurada: `503`.

## Convenciones

- Respuestas siempre JSON con `ok: true | false`. Cuando `ok` es `false` viene
  `error` con un mensaje en castellano, apto para mostrarle al cliente.
- **Los montos van en centavos** (`*_centavos`). Donde sirve para redactar el
  mensaje de WhatsApp, viene también en pesos enteros (`*_pesos`).
- Las fechas son ISO 8601. Mandalas **con zona** (`2026-10-28T14:00:00-03:00`) y
  no te preocupes por la conversión.
- Los porcentajes son números con signo: `15` es +15% (recargo), `-10` es −10%
  (descuento).

| Código | Cuándo |
|---|---|
| `200` / `201` | Salió bien. |
| `400` | Faltan datos o están mal formados. `error` dice cuáles. |
| `401` | Clave del bot inválida o ausente. |
| `404` | El turno, servicio o profesional no existe. |
| `409` | Conflicto real: horario ocupado, seña ya cubierta, servicio desactivado. |
| `503` | Falta `SENKO_BOT_API_KEY` en el servidor. |

---

## `GET /api/bot/catalogo`

Todo lo que el bot necesita para armar la conversación. Conviene cachearlo unos
minutos.

```bash
curl -H "x-senko-bot-key: $KEY" https://panel.tu-dominio.com/api/bot/catalogo
```

```jsonc
{
  "ok": true,
  "negocio": "Estudio Senko",
  "transferencia": { "alias": "estudio.senko.mp", "cbu": "000...", "titular": "Estudio Senko SRL" },
  "sena_vence_en_horas": 24,
  "metodos_pago": [
    { "clave": "efectivo",      "etiqueta": "Efectivo",              "ajuste_pct": -10 },
    { "clave": "transferencia", "etiqueta": "Transferencia / alias", "ajuste_pct": -10 },
    { "clave": "debito",        "etiqueta": "Tarjeta de débito",     "ajuste_pct": 5 },
    { "clave": "credito",       "etiqueta": "Tarjeta de crédito",    "ajuste_pct": 15 }
  ],
  "profesionales": [
    { "id": "usr_...", "nombre": "Camila Ruiz", "servicios": ["srv_..."] }
  ],
  "servicios": [
    {
      "id": "srv_...",
      "nombre": "Coloración completa",
      "duracion_min": 120,
      "precio_general_centavos": 5500000,
      "precio_general_pesos": 55000,
      "sena": { "tipo": "porcentaje", "valor": 40, "centavos": 2200000, "pesos": 22000 },
      "saldo_centavos": 3300000,
      "precio_por_metodo": [
        { "metodo": "efectivo",      "ajuste_pct": -10, "total_centavos": 4950000, "total_pesos": 49500 },
        { "metodo": "transferencia", "ajuste_pct": -10, "total_centavos": 4950000, "total_pesos": 49500 },
        { "metodo": "debito",        "ajuste_pct": 5,   "total_centavos": 5775000, "total_pesos": 57750 },
        { "metodo": "credito",       "ajuste_pct": 15,  "total_centavos": 6325000, "total_pesos": 63250 }
      ],
      "profesionales": [{ "id": "usr_...", "nombre": "Camila Ruiz" }]
    }
  ]
}
```

`precio_por_metodo` es, tal cual, la tabla que el bot le manda al cliente cuando
pregunta cuánto sale.

---

## `GET /api/bot/disponibilidad`

| Parámetro | Obligatorio | Qué es |
|---|---|---|
| `servicioId` | sí | Define la duración del hueco. |
| `fecha` | sí | `AAAA-MM-DD`, primer día a mirar. |
| `profesionalId` | no | Sin esto, devuelve los de todos los que atienden ese servicio. |
| `dias` | no | Cuántos días seguidos barrer desde `fecha` (1 a 31, por defecto 1). |

```bash
curl -H "x-senko-bot-key: $KEY" \
  "$BASE/api/bot/disponibilidad?servicioId=srv_...&fecha=2026-10-28&dias=7"
```

```jsonc
{
  "ok": true,
  "servicio": { "id": "srv_...", "nombre": "Coloración completa", "duracion_min": 120 },
  "primer_hueco": { "profesionalId": "usr_...", "inicio": "2026-10-28T11:30:00.000Z", "fin": "2026-10-28T13:30:00.000Z" },
  "disponibilidad": [
    {
      "profesional": { "id": "usr_...", "nombre": "Camila Ruiz" },
      "dias": [{ "fecha": "2026-10-28", "huecos": [{ "inicio": "...", "fin": "..." }] }]
    }
  ]
}
```

Cruza los horarios de trabajo configurados con los turnos ya tomados, en pasos
de 15 minutos, y descarta los horarios que ya pasaron. `primer_hueco` es un
atajo para ofrecer "el primero que haya".

---

## `POST /api/bot/turnos`

Crea el turno cuando el cliente eligió horario. Si el teléfono no está
registrado, **crea el cliente solo**.

```jsonc
{
  "telefono": "+5491166778899",      // obligatorio
  "nombre": "Martina Gómez",          // obligatorio
  "servicio_id": "srv_...",           // obligatorio
  "profesional_id": "usr_...",        // obligatorio
  "inicio": "2026-10-28T14:00:00-03:00", // obligatorio, el fin lo calcula el servidor
  "ref_externa": "wa-5491166778899-17", // recomendado: ver idempotencia
  "estado": "pendiente",              // "pendiente" (default) | "confirmado"
  "notas": "Pidió con Camila"
}
```

**`201`** devuelve `{ ok: true, turno: {...} }` (ver *Forma de un turno*).

**Idempotencia.** Mandá siempre `ref_externa` con el id del turno en el bot. Si
reintentás con la misma referencia no se duplica: responde `200` con
`duplicado: true` y el turno que ya existe.

**`409` horario ocupado** incluye los turnos de ese profesional ese día, por si
el bot quiere ofrecer otra cosa sin volver a pedir disponibilidad:

```jsonc
{ "ok": false, "error": "Ese horario ya está ocupado para ese profesional.",
  "ocupados": [{ "inicio": "...", "fin": "..." }] }
```

También da `409` si el profesional no atiende ese servicio o está desactivado.

---

## `GET /api/bot/turnos`

| Parámetro | Qué filtra |
|---|---|
| `telefono` | Turnos de ese cliente. Para contestar "¿cuándo tengo turno?". |
| `profesionalId` | Agenda de un profesional. |
| `desde` / `hasta` | Rango ISO. Por defecto, de ahora a 90 días. |

```jsonc
{ "ok": true, "turnos": [ /* turnos en la forma de abajo */ ] }
```

---

## `PATCH /api/bot/turnos/:id`

`:id` acepta el id interno (`trn_...`) **o** la `ref_externa` del bot.

```jsonc
{
  "inicio": "2026-10-29T16:00:00-03:00",  // mover
  "estado": "confirmado",                  // pendiente|confirmado|completado|cancelado|ausente
  "servicio_id": "srv_...",                // cambiar servicio (recalcula precio y duración)
  "notas": "Reprogramado por el cliente"
}
```

Todos los campos son opcionales, pero tiene que venir al menos uno. Si el nuevo
horario choca con otro turno: `409`.

Cancelar es `{"estado":"cancelado"}`: el horario **vuelve a quedar libre** al
instante, tanto para el bot como para el panel.

## `DELETE /api/bot/turnos/:id`

Atajo de cancelar. No borra el registro, para no perder el historial de cobros.

---

## `POST /api/bot/senas`

Registra la seña que el cliente dice haber pagado.

```jsonc
{
  "turno_id": "wa-5491166778899-17",  // id interno o ref_externa
  "metodo": "transferencia",           // efectivo | transferencia | debito | credito
  "monto_base_centavos": 2200000,      // opcional: si no va, usa la seña del servicio
  "acreditada": false,                 // opcional, ver abajo
  "referencia": "TRF-9001"             // opcional: nº de operación
}
```

- **`monto_base_centavos` es a PRECIO GENERAL.** El recargo o descuento del
  método lo calcula el servidor. El bot nunca aplica porcentajes.
- **`acreditada`** por defecto es `false` para transferencia (queda esperando que
  el dueño confirme que vio la plata) y `true` para los demás métodos.

**`201`:**

```jsonc
{
  "ok": true,
  "pago": {
    "id": "pag_...", "estado": "pendiente", "metodo": "transferencia",
    "monto_base_centavos": 2200000,
    "ajuste_pct": -10, "ajuste_centavos": -220000,
    "a_cobrar_centavos": 1980000, "a_cobrar_pesos": 19800
  },
  "turno": { /* turno actualizado */ }
}
```

Da `409` si el turno está cancelado, si ya está pago por completo, si el monto
supera el saldo, si el método está desactivado, o si **ya hay una seña esperando
acreditación** (en ese caso devuelve `pago_pendiente` con los datos de la que ya
existe, para que un reintento del bot no la cuente dos veces).

---

## `GET /api/bot/notificaciones`

Avisos que el panel generó y todavía no salieron por WhatsApp: demoras que cargó
un profesional, ausencias y comentarios. El bot los lee y se los manda al dueño.

| Parámetro | Qué hace |
|---|---|
| `limite` | Cuántos traer (1 a 200, por defecto 50). |
| `marcar` | `false` los devuelve **sin** consumirlos. Por defecto los marca como enviados. |

```bash
curl -H "x-senko-bot-key: $KEY" "$BASE/api/bot/notificaciones?limite=20"
```

```jsonc
{
  "ok": true,
  "marcadas": true,
  "avisos": [
    {
      "id": "ntf_...",
      "tipo": "demora",                       // demora | ausencia | comentario | sena
      "titulo": "Valentina Sosa se retrasa 30 min",
      "cuerpo": "Coloración completa de las 10:00 con Camila Ruiz. Está en el subte.",
      "creado_en": "2026-10-25T18:36:00.000Z",
      "autor": "Camila Ruiz",
      "turno": { "id": "trn_...", "inicio": "...", "cliente": "Valentina Sosa" },
      "destinatario": { "id": "usr_...", "nombre": "Leonardo", "telefono": "+5491122334455" }
    }
  ]
}
```

`titulo` y `cuerpo` ya vienen redactados para mandarlos tal cual por WhatsApp, y
`destinatario.telefono` es a quién mandárselos.

**Cada aviso se entrega una sola vez.** Al leerlos quedan marcados, así que una
segunda llamada no los repite. Si preferís confirmarlos recién cuando WhatsApp
acepta el mensaje, leelos con `marcar=false` y después confirmá:

## `POST /api/bot/notificaciones`

```jsonc
{ "ids": ["ntf_...", "ntf_..."] }
```

```jsonc
{ "ok": true, "marcadas": 2 }
```

Conviene consultarlo cada pocos minutos; no hay webhook.

---

## Forma de un turno

La devuelven todos los endpoints de turnos:

```jsonc
{
  "id": "trn_...",
  "ref_externa": "wa-...",
  "estado": "confirmado",
  "origen": "bot",
  "inicio": "2026-10-28T17:00:00.000Z",
  "fin": "2026-10-28T19:00:00.000Z",
  "cliente":     { "id": "cli_...", "nombre": "Martina Gómez", "telefono": "+5491166778899" },
  "profesional": { "id": "usr_...", "nombre": "Camila Ruiz" },
  "servicio":    { "id": "srv_...", "nombre": "Coloración completa" },
  "precio_general_centavos": 5500000,
  "precio_general_pesos": 55000,
  "sena": {
    "esperada_centavos": 2200000, "esperada_pesos": 22000,
    "falta_centavos": 0, "cubierta": true,
    "alias": "estudio.senko.mp", "vence_en_horas": 24
  },
  "imputado_centavos": 2200000,
  "saldo_centavos": 3300000,
  "precio_por_metodo": [ /* igual que en el catálogo */ ]
}
```

`imputado_centavos` cuenta **solo los pagos acreditados**, a precio general. Por
eso una seña por transferencia todavía sin confirmar deja `cubierta: false` y el
saldo completo: recién cuando el dueño la acredita en el panel pasa a contar.

---

## Flujo típico de una reserva

```
1. GET  /api/bot/catalogo                      → qué ofrecer y a qué precio
2. GET  /api/bot/disponibilidad?...            → horarios libres
3. POST /api/bot/turnos  (ref_externa!)        → reservar; devuelve la seña a pedir
4. el bot le pasa alias + monto y espera el comprobante
5. POST /api/bot/senas                         → queda "por acreditar"
6. el dueño la acredita desde el panel         → el turno pasa a tener la seña cubierta
7. PATCH /api/bot/turnos/:id {"estado":"cancelado"}  si el cliente se baja
```
