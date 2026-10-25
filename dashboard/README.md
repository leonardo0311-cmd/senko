# Senko · Panel de turnos y cobros

Dashboard del bot de WhatsApp de **Senko Intelligence**. El bot atiende a los
clientes, les reparte el calendario y les cobra la seña; este panel es donde el
dueño ve la plata y donde cada profesional ve su agenda.

Comparte la misma base que el bot, así que **el calendario es uno solo**: lo que
reserva el bot aparece acá al instante, y lo que se carga acá le bloquea el
horario al bot.

---

## Arrancar en 3 pasos

```bash
npm install
cp .env.example .env.local     # y editá las claves (ver abajo)
npm run db:seed                # carga datos de ejemplo para ver todo andando
npm run dev                    # http://localhost:3000
```

Usuarios de ejemplo (los crea `db:seed`):

| Rol | Email | Contraseña |
|---|---|---|
| Dueño | `dueno@senko.app` | `senko1234` |
| Profesional | `camila@senko.app` | `senko1234` |
| Profesional | `nicolas@senko.app` | `senko1234` |
| Profesional | `sofia@senko.app` | `senko1234` |

> Los datos de ejemplo son para ver el panel con contenido. Antes de usarlo en
> serio: `npm run db:reset`, creá tu usuario de dueño y cargá tus servicios.

### Variables de entorno

| Variable | Para qué |
|---|---|
| `SENKO_SESSION_SECRET` | Firma las cookies de sesión. Generala con `openssl rand -hex 32`. |
| `SENKO_BOT_API_KEY` | Clave que usa el bot para llamar a `/api/bot/*`. Generala igual. |
| `SENKO_DB_PATH` | Opcional. Ruta del archivo SQLite (por defecto `./data/senko.db`). |
| `TZ` | Zona horaria del negocio. Los turnos se guardan en UTC y se muestran en la zona del servidor. |

### Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta el panel en modo desarrollo. |
| `npm run build` / `npm start` | Compila y sirve la versión de producción. |
| `npm run typecheck` | Chequea tipos sin compilar. |
| `npm run db:seed` | Completa la base con datos de ejemplo. |
| `npm run db:reset` | Borra la base y la vuelve a crear desde cero. |

> **Ojo con `db:reset`:** parar el servidor antes. Si está corriendo, se queda
> con el archivo viejo abierto y vas a ver datos que ya no existen.

---

## Qué hay adentro

### Clientes y gastos — el apartado de la plata

Es la pantalla que pediste: **cuánto gastó cada cliente, separado por efectivo,
transferencia, tarjeta de débito y tarjeta de crédito**, con tres cifras por
cliente:

- **Total gastado** — lo que realmente entró en caja, con recargos y descuentos
  ya aplicados.
- **A precio general** — lo mismo medido al precio de lista, sin ajustes. Sirve
  de base de comparación.
- **Ajustes** — la diferencia. En verde lo que entró de más por tarjeta, en
  amarillo lo que resignaste por efectivo o alias.

Las columnas se ordenan tocando el encabezado y el pie de la tabla cierra los
totales del período. Tocando un cliente se abre su ficha con el historial de
turnos y cada pago con su ajuste discriminado.

### Cómo se arma el precio

1. Cada **servicio** tiene un **precio general** (el precio de lista, sin ajustes).
2. Cada **método de pago** tiene un **porcentaje configurable y con signo**:
   positivo es recargo, negativo es descuento. Los valores de ejemplo son
   efectivo −10%, transferencia por alias −10%, débito +5%, crédito +15%; se
   cambian en **Configuración** sin tocar código.
3. La **seña** se calcula sobre el precio general (un porcentaje del servicio o
   un monto fijo), antes de cualquier ajuste.
4. El ajuste se aplica **a cada pago por separado**, no al total del turno. Así
   un cliente puede señar por transferencia con descuento y pagar el saldo con
   crédito con recargo, y cada tramo queda con su propio porcentaje.

Los pagos ya registrados **guardan el porcentaje con el que se cobraron**, así
que cambiar los porcentajes no reescribe el historial: rige del próximo pago en
adelante.

Toda la plata se guarda en **centavos (enteros)** para no arrastrar errores de
redondeo; el ajuste se redondea al centavo más cercano.

### Señas

Pantalla aparte para la seña:

- Las que el cliente dice que transfirió y están **esperando que las acredites**,
  con botones de acreditar y rechazar.
- Los **turnos próximos sin seña cubierta** (los que conviene reclamar o
  liberar), que en el calendario además llevan un punto amarillo.
- El historial de señas acreditadas y el saldo que queda por cobrar.
- El alias, el CBU y el plazo de vencimiento que el bot le informa al cliente.

### Calendario

Grilla semanal con los turnos ubicados en su hora real. El dueño ve a todos los
profesionales (con filtro por cada uno) y cada profesional ve **solo los suyos**.
Si dos atienden a la misma hora, los turnos se escalonan en lugar de taparse.

Tocando un turno se abre el detalle: estado, precio según cada método, registrar
la seña o el saldo, marcar hecho, no vino o cancelar.

### Usuarios

El dueño da de alta profesionales con:

- **Email y contraseña** para entrar al panel.
- **Ocupación** (colorista, peluquero, manicura…), que es texto libre.
- **Color** con el que se los ve en el calendario.
- **Servicios que atiende** cada uno: el bot solo le ofrece esos a los clientes.
- **Días y horarios de trabajo**, uno por día de la semana. Es lo que cruza el bot
  con los turnos ya tomados para saber qué horarios puede ofrecer.

Cada profesional ve **solo su propia agenda**: ni la de sus compañeros ni la
facturación del negocio.

| | Dueño | Profesional |
|---|---|---|
| Resumen y facturación del negocio | sí | no |
| Calendario | completo, con filtro por profesional | solo el suyo |
| Crear, mover y cancelar turnos | sí | no |
| Cobrar y acreditar señas | sí | no |
| Comentar un turno | sí | **sí, en los suyos** |
| Avisar demora o ausencia | — | **sí** |
| Clientes y gastos · Pagos | sí | no |
| Usuarios y Configuración | sí | no |
| Avisos | todos | los suyos |

El profesional es **solo lectura** sobre sus turnos: ve, comenta y avisa. La plata
y los estados los maneja el dueño.

Un profesional desactivado **no se borra**: conserva su historial de cobros pero
pierde el acceso. Lo mismo con los servicios que ya tienen turnos.

### Avisos

Cuando un cliente se retrasa, el profesional lo marca desde el turno —con los
minutos y una nota opcional— y al dueño le entra un aviso en el panel: la
campanita del menú lleva el contador y la pantalla **Avisos** muestra la bandeja.
Lo mismo si el cliente no vino, o si el profesional deja un comentario.

En el calendario, un turno con comentarios muestra `✎3`, y uno con demora
avisada muestra `+30′`, así se ve sin abrirlo.

Los avisos quedan dentro del panel. Para que además lleguen al WhatsApp del
dueño, el bot los lee de `GET /api/bot/notificaciones` y los marca como
enviados.

---

## Conectarlo con el bot

El bot de WhatsApp llama a `/api/bot/*` con la cabecera
`x-senko-bot-key: <SENKO_BOT_API_KEY>`.

- **[`docs/ENTREGA-SOCIO.md`](docs/ENTREGA-SOCIO.md)** — para pasarle a quien
  desarrolla el bot: cómo levantarlo, cómo se enganchan las dos partes, qué no
  hace el panel y qué falta decidir entre los dos.
- **[`docs/API-BOT.md`](docs/API-BOT.md)** — la referencia de la API, con el JSON
  de cada request y cada respuesta.

| | Endpoint | Para qué |
|---|---|---|
| `GET` | `/api/bot/catalogo` | Servicios, precios por método, señas, profesionales y datos de transferencia. |
| `GET` | `/api/bot/disponibilidad` | Huecos libres de un profesional para uno o varios días. |
| `POST` | `/api/bot/turnos` | Crear el turno cuando el cliente elige horario. |
| `GET` | `/api/bot/turnos` | Turnos de un cliente o de un rango. |
| `PATCH` | `/api/bot/turnos/:id` | Mover, confirmar o cancelar. |
| `DELETE` | `/api/bot/turnos/:id` | Cancelar (no borra, para no perder el historial). |
| `POST` | `/api/bot/senas` | Registrar la seña que informó el cliente. |
| `GET` | `/api/bot/notificaciones` | Avisos sin mandar (demoras, ausencias, comentarios) para reenviar por WhatsApp. |
| `POST` | `/api/bot/notificaciones` | Confirmar qué avisos ya se enviaron. |

La API se encarga de que el bot **nunca tenga que hacer cuentas de plata**:
manda montos a precio general y el servidor devuelve el recargo o descuento ya
aplicado. Así el panel y el bot no pueden discrepar.

---

## Cómo está armado

```
src/
  lib/
    db.ts            conexión y esquema SQLite (único lugar con DDL)
    precios.ts       motor de precios: ajustes por método y cálculo de seña
    dinero.ts        centavos, formato en pesos y porcentajes
    auth.ts          sesiones por cookie firmada + scrypt
    disponibilidad.ts  huecos libres cruzando horarios y turnos tomados
    bot.ts           autenticación y serialización de la API del bot
    repo/            TODO el SQL vive acá, agrupado por tabla
  app/
    (panel)/         pantallas del panel (requieren sesión)
    api/bot/         API que consume el bot de WhatsApp
  components/        UI compartida y gráficos
```

**Para cambiar de base de datos** (a la del bot, Postgres o Supabase) hay que
reescribir `src/lib/db.ts` y los módulos de `src/lib/repo/`, nada más: el resto
de la app trabaja contra los tipos de `src/lib/types.ts` y nunca ve una
consulta SQL.

### Decisiones que conviene conocer

- **Plata en centavos enteros**, nunca en punto flotante.
- **El historial no se reescribe**: cada pago guarda su propio `ajuste_pct`.
- **Cancelar libera el horario**; cancelado y ausente no ocupan lugar en la agenda.
- **Nada se borra si tiene historial**: profesionales y servicios con turnos se
  desactivan en lugar de eliminarse.
- **El servidor siempre recalcula** los ajustes aunque el cliente o el bot manden
  un total, así que no hay forma de cobrar un precio que no salga de la
  configuración.
- **Avisar una ausencia no cambia el estado del turno.** El profesional informa;
  decidir si se cancela o se cobra es del dueño.
- **Los avisos se entregan una sola vez al bot**: al leerlos quedan marcados, así
  no se repiten en la próxima consulta.
