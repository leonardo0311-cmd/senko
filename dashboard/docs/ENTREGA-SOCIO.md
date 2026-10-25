# Entrega: panel de turnos de Senko

Documento para quien desarrolla el **bot de WhatsApp**. Explica qué hace el
panel, cómo levantarlo, cómo se enganchan las dos partes y qué falta decidir
entre los dos.

---

## 1. Qué es

El panel es la parte de "atrás" del negocio: donde el dueño ve la plata, maneja
los turnos y da de alta a los profesionales. El bot es la parte de "adelante":
atiende al cliente por WhatsApp, le ofrece horarios y le pide la seña.

**Las dos partes comparten la misma agenda.** No hay sincronización ni copias:
el turno que crea el bot es el mismo registro que ve el dueño en el panel, y al
revés. Si el dueño carga un turno a mano, el bot deja de ofrecer ese horario al
instante.

El panel ya funciona solo, con datos de ejemplo. Lo que falta es que el bot le
hable.

---

## 2. Levantarlo

Necesita **Node 20 o más nuevo**.

```bash
git clone -b claude/cool-hopper-gok5f5 https://github.com/leonardo0311-cmd/senko.git
cd senko/dashboard
npm install
cp .env.example .env.local     # editar las claves, ver abajo
npm run db:seed                # datos de ejemplo
npm run dev                    # http://localhost:3000
```

Usuarios de ejemplo: `dueno@senko.app` / `senko1234` (dueño) y
`camila@senko.app` / `senko1234` (profesional).

### Variables de entorno

| Variable | Qué es |
|---|---|
| `SENKO_SESSION_SECRET` | Firma las cookies de sesión del panel. `openssl rand -hex 32`. |
| `SENKO_BOT_API_KEY` | **La que te interesa.** Clave compartida con la que el bot llama a `/api/bot/*`. |
| `SENKO_DB_PATH` | Opcional. Archivo SQLite, por defecto `./data/senko.db`. |
| `TZ` | Zona horaria del negocio. Importante: ver el punto 6. |

> `npm run db:reset` borra y recrea la base. **Parar el servidor antes**, si no
> se queda con el archivo viejo abierto.

---

## 3. Cómo se engancha el bot

Todo pasa por `/api/bot/*`, con la cabecera:

```
x-senko-bot-key: <SENKO_BOT_API_KEY>
```

La referencia completa, con el JSON de cada request y cada respuesta, está en
[`API-BOT.md`](API-BOT.md). Resumen:

| | Endpoint | Para qué |
|---|---|---|
| `GET` | `/api/bot/catalogo` | Servicios, precios por método de pago, señas, profesionales y datos de transferencia. |
| `GET` | `/api/bot/disponibilidad` | Huecos libres de un profesional para uno o varios días. |
| `POST` | `/api/bot/turnos` | Crear el turno cuando el cliente elige horario. |
| `GET` | `/api/bot/turnos` | Turnos de un cliente, o de un rango. |
| `PATCH` | `/api/bot/turnos/:id` | Mover, confirmar o cancelar. |
| `DELETE` | `/api/bot/turnos/:id` | Cancelar (no borra, para no perder el historial). |
| `POST` | `/api/bot/senas` | Registrar la seña que informó el cliente. |
| `GET` | `/api/bot/notificaciones` | Avisos para reenviarle al dueño por WhatsApp. |
| `POST` | `/api/bot/notificaciones` | Confirmar qué avisos ya salieron. |

### Flujo de una reserva

```
1. GET  /api/bot/catalogo                       qué ofrecer y a qué precio
2. GET  /api/bot/disponibilidad?...             horarios libres
3. POST /api/bot/turnos  (con ref_externa)      reservar; devuelve la seña a pedir
4. el bot le pasa alias + monto, espera el comprobante
5. POST /api/bot/senas                          queda "por acreditar"
6. el dueño la acredita desde el panel          el turno pasa a tener la seña cubierta
7. PATCH /api/bot/turnos/:id {"estado":"cancelado"}   si el cliente se baja
```

### Tres cosas que conviene saber antes de escribir código

**El bot nunca hace cuentas de plata.** Manda montos a precio general y el
servidor aplica el recargo o el descuento del método. Hay un precio de lista por
servicio y cada método de pago tiene un porcentaje con signo, configurable desde
el panel: hoy efectivo −10%, transferencia por alias −10%, débito +5%, crédito
+15%. `catalogo` y cada turno traen `precio_por_metodo` ya calculado, listo para
copiar y pegar en el mensaje de WhatsApp.

**Mandá siempre `ref_externa`** en `POST /api/bot/turnos`, con el id del turno
del lado del bot. Si reintentás con la misma referencia no se duplica: responde
`200` con `duplicado: true` y el turno que ya existe. Después podés usar esa
misma referencia en lugar del id interno en `PATCH`, `DELETE` y `POST /senas`.

**Los avisos se entregan una sola vez.** `GET /api/bot/notificaciones` devuelve
los pendientes y los marca como enviados en la misma llamada. Si preferís
confirmarlos recién cuando WhatsApp acepta el mensaje, leelos con `marcar=false`
y confirmá después con `POST`. No hay webhook: consultalo cada pocos minutos.

---

## 4. Qué hace el panel que al bot le sirve

- **Cobros separados por método**, por cliente y por profesional, con el recargo
  y el descuento discriminados.
- **Señas**: el dueño acredita las transferencias que informó el cliente. Hasta
  que no las acredita, el turno figura con la seña sin cubrir y el saldo entero.
- **Usuarios**: cada profesional entra con su email, tiene su ocupación, los
  servicios que atiende y sus días y horarios. Eso último es lo que cruza
  `disponibilidad` con los turnos tomados.
- **Avisos**: el profesional marca desde el turno que un cliente se retrasa (con
  los minutos) o que no vino. Eso genera la notificación que el bot le reenvía al
  dueño.

## 5. Qué NO hace

Para que no haya sorpresas:

- **No manda mensajes de WhatsApp.** Eso es del bot. El panel deja los avisos
  listos en `/api/bot/notificaciones` con el texto redactado y el teléfono del
  destinatario.
- **No cobra de verdad.** Registra lo que se cobró; no hay pasarela de pago ni
  conciliación automática con el banco. La seña la acredita el dueño a mano
  cuando ve la plata.
- **No valida los horarios de trabajo al crear un turno.** Un turno fuera de
  horario se puede crear igual (el dueño a veces encaja a alguien). Los horarios
  afectan qué ofrece `disponibilidad`, no qué se puede guardar.
- **No tiene recordatorios automáticos** ni vencimiento real de la seña. El campo
  "la seña vence en N horas" es un dato que el panel le informa al bot; quien
  decide liberar el turno es el bot o el dueño.

---

## 6. Lo que hay que decidir entre los dos

**a) Dónde vive la base.** Hoy es SQLite en un archivo, pensado para correr en
una sola máquina. Si el bot y el panel van a estar en servidores distintos, hay
que pasar a Postgres (Supabase o similar). La capa de datos está aislada en
`src/lib/repo/` y `src/lib/db.ts`: migrar es reescribir esos módulos, el resto de
la app no toca SQL. Si el bot ya tiene su propio esquema de turnos, hay que
definir cuál manda antes de conectar nada.

**b) Zona horaria.** Los turnos se guardan en UTC y se muestran en la zona del
servidor. **Los dos procesos tienen que correr con el mismo `TZ`**
(`America/Argentina/Buenos_Aires`), o los horarios van a bailar. En las fechas
que manda el bot conviene siempre incluir la zona:
`2026-10-28T14:00:00-03:00`.

**c) Dónde se publica.** Mientras tanto corre en local. Para que el dueño lo abra
desde el celular hay que subirlo a algún lado, y eso depende de (a).

---

## 7. Para probar sin el bot

```bash
KEY=$(grep SENKO_BOT_API_KEY .env.local | cut -d= -f2)
B=http://localhost:3000/api/bot

curl -s -H "x-senko-bot-key: $KEY" "$B/catalogo" | jq '.servicios[0]'

curl -s -H "x-senko-bot-key: $KEY" \
  "$B/disponibilidad?servicioId=srv_seed0002&fecha=$(date +%F)&dias=7" | jq '.primer_hueco'
```

Los ids `srv_seed*` y `usr_seed*` son los de los datos de ejemplo: salen de
`catalogo`.

---

## 8. Dónde está cada cosa

```
dashboard/
  README.md              cómo funciona el panel, pantalla por pantalla
  docs/API-BOT.md        referencia de la API, con ejemplos
  docs/ENTREGA-SOCIO.md  este documento
  src/lib/
    db.ts                conexión y esquema (único lugar con DDL)
    precios.ts           motor de precios: ajustes por método, cálculo de seña
    disponibilidad.ts    huecos libres cruzando horarios y turnos tomados
    bot.ts               autenticación y serialización de la API del bot
    repo/                todo el SQL, agrupado por tabla
  src/app/api/bot/       los endpoints
  src/app/(panel)/       las pantallas
```
