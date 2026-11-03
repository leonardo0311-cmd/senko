# Datos pendientes de confirmación

Este documento lista **todo lo que el sitio no publica porque no pudo verificarse**,
dónde se completa cada dato y qué pasa en el sitio cuando se completa.

El criterio que se siguió fue estricto: **nada inventado**. Ni un número de teléfono,
ni una dirección, ni un horario, ni una matrícula profesional, ni una cobertura médica.
Donde faltaba el dato, el sitio lo dice y ofrece el canal de contacto que sí está activo.

Casi todo se completa en un único archivo: **`src/data/site.ts`**.

---

## 1. Qué sí está confirmado

Esto se tomó de los canales públicos del propio consultorio y está publicado:

| Dato | Valor | Fuente |
|---|---|---|
| Nombre comercial | CKC — Consultorio Kinésico Canning | Instagram y Facebook oficiales |
| Instagram | [@ckc.kinesiocanning](https://www.instagram.com/ckc.kinesiocanning/) | Perfil oficial |
| Facebook | [Consultorio Kinésico Canning](https://www.facebook.com/kinesio.canning/) | Página oficial |
| Localidad | Canning, Provincia de Buenos Aires | Nombre y perfiles del consultorio |
| Áreas de atención | Kinesiología deportiva · Tratamiento y prevención de lesiones · Prevención de caídas · Suelo pélvico · MEP (líneas Sport y Beauty) | Descripción de los perfiles de Instagram y Facebook |

> **Nota sobre el acceso a Instagram.** No fue posible abrir el perfil desde el entorno
> de desarrollo: el dominio `instagram.com` está fuera de los dominios habilitados en la
> red de esta sesión. La información de arriba se obtuvo de los resúmenes públicos de los
> perfiles. **Conviene revisar el perfil directamente** para confirmar colores, logotipo,
> fotografías y si hay áreas de atención que no figuren en la descripción.

---

## 2. Pendientes bloqueantes

Sin estos datos el sitio funciona, pero la conversión queda limitada.

### 2.1 Número de WhatsApp — `CONTACTO.whatsapp`

**El más importante de todos.** Es el canal de conversión principal del sitio.

```ts
// src/data/site.ts
whatsapp: '5491112345678',  // formato: 54 + 9 + área sin 0 + número sin 15
```

- **Hoy:** todos los botones "Solicitar turno" llevan a `/contacto/#canales`, donde se
  explica la situación y se ofrece Instagram como canal activo. Ningún botón está roto.
- **Al completarlo:** los ~40 botones del sitio pasan solos a abrir WhatsApp, cada uno con
  un mensaje distinto según la sección desde la que se hace clic (ver `MENSAJES`).
  El formulario de contacto también pasa a abrir la conversación directamente.

### 2.2 Dirección exacta — `UBICACION.direccion` y `UBICACION.mapaEmbedUrl`

```ts
direccion: { calle: 'Nombre de la calle', numero: '0000', detalle: 'Oficina 00', codigoPostal: 'B0000' },
mapaEmbedUrl: 'https://www.google.com/maps/embed?pb=...',  // de Google Maps > Compartir > Insertar un mapa
```

- **Hoy:** el sitio dice "Canning, Provincia de Buenos Aires" y aclara que la dirección
  exacta se pasa por mensaje. En lugar del mapa hay un panel que explica por qué no está.
- **Al completarlo:** aparece en el pie de página, en la página de contacto, en
  instalaciones y en los datos estructurados para buscadores.

> ⚠️ **Dato encontrado pero NO publicado.** Un directorio médico de terceros publica una
> dirección y un teléfono asociados al consultorio. **No se publicaron** porque no pudieron
> verificarse en ningún canal oficial de CKC y la fuente tiene más de dos años. Si el
> consultorio los confirma, se cargan y listo. Se dejan acá para que la confirmación sea
> rápida: **Mariano Castex 5701, oficina 114, Canning (B1804)** y **011 6865-4716**.
> Hay otros centros con direcciones parecidas sobre la misma avenida, así que conviene
> chequearlo bien antes de cargarlo.

### 2.3 Horarios de atención — `HORARIOS.lista` y `HORARIOS.schemaOrg`

```ts
lista: [
  { dias: 'Lunes a viernes', franjas: ['08:00 a 12:00', '14:00 a 20:00'] },
  { dias: 'Sábados', franjas: ['09:00 a 13:00'] },
],
schemaOrg: [
  { dias: ['Mo', 'Tu', 'We', 'Th', 'Fr'], abre: '08:00', cierra: '20:00' },
],
```

- **Hoy:** el sitio invita a consultar la disponibilidad. No se publicó ningún horario.
- **Por qué:** la única referencia horaria encontrada (8 a 12 y 14 a 20) viene de un aviso
  de búsqueda laboral de hace más de dos años y corresponde a la **carga horaria de un
  puesto**, no al horario de atención a pacientes. No es lo mismo.
- **Al completarlo:** aparece en el pie, en contacto y en los datos estructurados, lo que
  permite que Google muestre el horario en los resultados de búsqueda.

---

## 3. Pendientes del equipo profesional

### 3.1 Fichas de los profesionales — `src/data/equipo.ts`

**No se inventó ningún nombre, título, matrícula, formación ni especialidad.** Tratándose
de credenciales sanitarias, un dato falso sería inaceptable y además engañaría a alguien
que está eligiendo dónde atenderse.

```ts
import retrato from '@/imagenes/equipo/nombre-apellido.jpg';

export const PROFESIONALES: Profesional[] = [
  {
    id: 'nombre-apellido',
    nombre: 'Nombre Apellido',
    tituloProfesional: 'Licenciado/a en Kinesiología y Fisiatría',
    matricula: 'M.P. 00000',
    presentacion: 'Dos o tres frases sobre cómo encara la atención.',
    formacion: ['Licenciatura en …, Universidad …', 'Posgrado en …'],
    areas: ['Kinesiología deportiva', 'Suelo pélvico'],
    foto: retrato,
  },
];
```

- **Hoy:** se muestran dos fichas en estado "a completar", con el diseño definitivo y un
  aviso visible que explica por qué están vacías. **Las dos fichas no implican que el
  equipo tenga dos integrantes**: esa cantidad también está por confirmar.
- **Publicar solo credenciales verificables.** La matrícula figura en los registros del
  colegio profesional correspondiente.

---

## 3 bis. Trayectoria, clubes e instituciones

Esto es lo que más convence a alguien que está eligiendo dónde atenderse, y es
lo que el sitio tiene reservado y vacío. Todo en **`src/data/trayectoria.ts`**.

### 3b.1 Año de inicio — `anioInicio`

```ts
anioInicio: 2014,
```

Se carga **el año**, no la cantidad de años: el sitio calcula la cifra solo, así
que nunca queda desactualizada. Con esto se llena el primer número de la franja
del inicio y el título de la sección de trayectoria en Nosotros.

### 3b.2 Cifras de la franja — `CIFRAS`

Faltan la cantidad de **clubes e instituciones** y la de **deportistas
acompañados**. La de áreas de atención ya está cargada en 5.

Conviene usar números que el consultorio pueda respaldar: si alguien pregunta en
la consulta, tiene que cerrar. Mientras falten, el sitio muestra un guion y la
etiqueta «A confirmar» en vez de inventar una cifra.

### 3b.3 Clubes e instituciones — `INSTITUCIONES`

```ts
import escudo from '@/imagenes/instituciones/club-ejemplo.png';

{ id: 'club-ejemplo', nombre: 'Club Ejemplo', tipo: 'Club',
  detalle: 'Atención del plantel de primera', logo: escudo }
```

Si no hay logotipo, la ficha muestra el nombre tipografiado y queda prolija
igual. Los escudos van en `src/imagenes/instituciones/`.

> ⚠️ **Dos cuidados.** Cargar solo instituciones con las que exista un vínculo
> real: nombrar un club con el que no se trabaja es una afirmación falsa sobre un
> tercero. Y antes de publicar nombres o escudos, pedirle autorización a cada
> institución: usar su marca sin permiso puede traerle un problema a CKC aunque
> la relación sea cierta.

### 3b.4 Línea de tiempo — `HITOS`

Tres o cuatro momentos del consultorio (apertura, incorporación de un área, un
vínculo importante). Aparece en Nosotros.

### 3b.5 La afirmación de escala — `afirmacionDeEscala` y `respaldo`

Decir «el más grande de Canning» es una **afirmación comparativa**: en publicidad
sanitaria conviene poder respaldarla (por superficie, cantidad de profesionales,
de áreas o de pacientes), porque un competidor puede cuestionarla.

Por eso el sitio, por defecto, **no usa el superlativo**: comunica la escala con
datos concretos —años, clubes, cinco áreas bajo el mismo techo—, que además
convencen más que un adjetivo.

Si CKC quiere afirmarlo igual, se completa:

```ts
afirmacionDeEscala: 'El centro de kinesiología más grande de Canning',
respaldo: 'Por cantidad de áreas de atención y profesionales',
```

y esa frase pasa a encabezar la sección de trayectoria del inicio.

---

## 4. Pendientes de fotografía

### 4.1 Fotos del consultorio — `src/data/instalaciones.ts`

**No se usaron fotos de otros centros, ni bancos de imágenes, ni imágenes generadas** que
pudieran hacerse pasar por el consultorio, su equipo o sus instalaciones. En su lugar hay
una composición gráfica original de la marca —arcos y trazos que sugieren movimiento— y
cada casillero indica qué fotografía corresponde en ese lugar.

```ts
import recepcion from '@/imagenes/instalaciones/recepcion.jpg';

{ id: 'recepcion', titulo: 'Recepción', imagen: recepcion,
  alt: 'Recepción del consultorio con mostrador y sala de espera' }
```

1. Guardar los archivos en `src/imagenes/instalaciones/`.
2. Importarlos y asignarlos al campo `imagen`.
3. Escribir en `alt` una descripción **real** de lo que se ve (importa para accesibilidad y SEO).

Astro optimiza el peso, genera formatos modernos y versiones para cada pantalla, y activa
la carga diferida. Al tener foto, el casillero habilita solo la ampliación en pantalla completa.

**Si algún espacio de la lista no existe en el consultorio, hay que borrar esa entrada.**
No debe quedar publicado nada que no corresponda.

### 4.2 Otras fotos pendientes

| Dónde | Qué foto va |
|---|---|
| Inicio, sección principal | Imagen real del consultorio o de una sesión |
| Nosotros | El consultorio o el equipo |
| Cada página de servicio | Una foto propia del área (6 en total) |
| Equipo | Retrato profesional de cada integrante |
| Cada nota del blog | Imagen relacionada con el tema |
| Imagen para compartir en redes | Idealmente una foto real con el logotipo, 1200×630 px, en `public/og/ckc-og.png` |

---

## 5. Pendientes administrativos

Todo en `src/data/site.ts`, sección `ADMINISTRACION`.

| Campo | Qué falta | Dónde impacta |
|---|---|---|
| `coberturas` | Obras sociales y prepagas con las que se trabaja | Preguntas frecuentes |
| `mediosDePago` | Medios de pago aceptados | Preguntas frecuentes |
| `requiereOrdenMedica` | Si hace falta orden médica o derivación | Preguntas frecuentes |
| `politicaDeTurnos` | Condiciones de aviso, reprogramación y cancelación | Preguntas frecuentes |

**Hoy** ninguna de estas preguntas afirma nada: explican la situación general y derivan la
consulta al consultorio. Al confirmarse los datos conviene **reescribir esas cuatro
respuestas** en `src/data/preguntas.ts` para que sean concretas. Cada una tiene un campo
`pendiente` con la nota de qué falta; esa nota **solo se ve en modo desarrollo** y nunca
se publica.

---

## 6. Identidad visual

### 6.1 Logotipo — `BRAND.logoSrc`

**CKC ya tiene un logotipo propio** y no se creó ni se modificó uno nuevo. Como no fue
posible acceder al archivo original, el sitio muestra un **logotipo tipográfico
provisional**, armado solo con el nombre real del consultorio y la tipografía del sitio.

```ts
logoSrc: '/marca/ckc-logo.svg',   // colocar el archivo en public/marca/
```

Al completarlo, el logotipo real reemplaza al provisional en el encabezado, el menú móvil
y el pie de página. Se recomienda SVG; si es PNG, a 2× el tamaño de visualización.

### 6.2 Colores — `src/styles/tokens.css`

La paleta actual es **provisional**: neutros cálidos con verde petróleo y terracota. Se
eligió con el criterio pedido (profesionalismo y bienestar, sin aspecto de empresa
tecnológica), pero **no son los colores de la marca**, que no pudieron tomarse del perfil.

Para adoptar la identidad real alcanza con cambiar **seis valores** al principio del
archivo. Todo el resto del sitio —estados, bordes, degradados, gráficos— deriva de ellos:

```css
--ckc-primario:        #1f6f68;   /* color principal        */
--ckc-primario-oscuro: #113f3b;   /* fondos y títulos       */
--ckc-primario-claro:  #e6f0ee;   /* fondos suaves          */
--ckc-acento:          #c0764a;   /* acentos cálidos        */
--ckc-acento-claro:    #f6ece4;
--ckc-arena:           #f0eae1;   /* secciones alternadas   */
```

### 6.3 Tipografías

Newsreader (títulos) e Inter (texto), servidas desde el propio dominio. Si la marca usa
otras, se cambian en `--ckc-fuente-titulo` y `--ckc-fuente-texto` y se ajusta la
importación en `src/layouts/Base.astro`.

---

## 7. Pendientes técnicos

| Campo | Para qué |
|---|---|
| `src/data/site-url.mjs` → `SITE` | **Obligatorio antes de publicar.** Dominio real: se usa en las URL canónicas, el sitemap y las metaetiquetas para redes. También hay que actualizarlo en `public/robots.txt`. |
| `FORMULARIO.endpoint` | Si se quiere recibir los formularios por correo en vez de por WhatsApp. Ver más abajo. |
| `ANALITICA.googleSearchConsole` | Verificar el sitio en Search Console |
| `ANALITICA.ga4` | Google Analytics 4. Si se activa, **revisar la política de privacidad** y evaluar si hace falta un cartel de consentimiento. |
| `LEGAL.responsableDatos` | Razón social y domicilio legal para la política de privacidad |

### Sobre el formulario de contacto

**El sitio no simula envíos.** Hoy el formulario valida los datos y arma un mensaje
ordenado que la persona envía por WhatsApp; no muestra ningún cartel de "mensaje enviado"
porque no hay servidor que lo reciba, y eso está explicado de forma visible en la página.

Si se quiere recepción por correo, hay que contratar un servicio de formularios
(Formspree, Basin, Web3Forms o una función propia) y cargar la URL en `FORMULARIO.endpoint`.
Recién entonces el formulario hace un envío real y muestra la confirmación.

---

## 8. Contenido a revisar con el consultorio

Lo siguiente está escrito y publicado, pero **conviene que lo revise un profesional del
consultorio** antes de darlo por definitivo:

1. **La página de MEP** (`/servicios/mep/`). La sigla se interpretó como
   **Microelectrólisis Percutánea**, que es su uso corriente en kinesiología deportiva en
   Argentina y es coherente con las dos líneas "Sport" y "Beauty" que menciona CKC. **El
   consultorio no publica la sigla desarrollada**, así que la página está redactada con
   prudencia y sin describir el procedimiento en detalle. Si la sigla significa otra cosa,
   hay que reescribirla.

2. **La página "Cómo trabajamos"**. Describe un recorrido de atención con criterios
   generales de la práctica kinésica. Hay que confirmar que coincida con la modalidad real:
   duración de las consultas, organización de los turnos, si el tratamiento empieza en la
   primera consulta.

3. **La historia institucional** (`/nosotros/`). No se inventó fecha de fundación, historia
   familiar ni trayectoria. Si el consultorio quiere contar su historia, la sección está
   preparada para ampliarse.

4. **Todo el contenido clínico.** Fue redactado con criterio conservador: no promete
   resultados, no garantiza que el dolor desaparezca, no fija plazos de recuperación y no
   indica ejercicios ni técnicas para casos particulares. Aun así, **debe validarlo un
   kinesiólogo matriculado del consultorio** antes de publicarse.

5. **La autoría de las notas del blog.** Hoy se atribuyen al consultorio como organización
   en los datos estructurados. Si las firma un profesional concreto, corresponde declararlo
   con su nombre verificado en `src/pages/blog/[...slug].astro`.

6. **La política de privacidad.** Describe con exactitud lo que el sitio hace hoy con los
   datos, pero conviene una revisión legal antes de publicarla.

---

## 9. Lista rápida antes de publicar

- [ ] Dominio real en `src/data/site-url.mjs` y en `public/robots.txt`
- [ ] Número de WhatsApp en `CONTACTO.whatsapp`
- [ ] Dirección exacta y mapa en `UBICACION`
- [ ] Horarios en `HORARIOS`
- [ ] Teléfono y correo, si corresponde
- [ ] Año de inicio en `anioInicio` (los años se calculan solos)
- [ ] Cantidad de clubes y de deportistas en `CIFRAS`
- [ ] Clubes e instituciones en `INSTITUCIONES`, con su autorización
- [ ] Fichas del equipo con credenciales verificadas
- [ ] Fotografías propias del consultorio, el equipo y las instalaciones
- [ ] Logotipo real en `BRAND.logoSrc`
- [ ] Colores de la marca en `src/styles/tokens.css`
- [ ] Coberturas, medios de pago y política de turnos
- [ ] Reescribir las cuatro respuestas administrativas de las preguntas frecuentes
- [ ] Revisión profesional de todo el contenido clínico
- [ ] Revisión legal de la política de privacidad
- [ ] Imagen propia para compartir en redes
- [ ] Verificar el sitio en Google Search Console y crear la ficha de Google Business Profile
