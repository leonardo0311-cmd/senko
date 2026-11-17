# ALK TRAVEL — Estudiantes viaja a Montevideo

Reel animado para Instagram. Final de la Copa Libertadores: Estudiantes vs. Palmeiras en el Estadio Centenario de Montevideo.

1080×1920 (9:16) · 30 fps · 20 s · con sonido

**Archivo final:** `output/alk-estudiantes-viaja-a-montevideo-reel.mp4`

> *La pasión no tiene fronteras. ¡Vamos Pincha!*

## Secuencia

| Tiempo | Escena | Texto en pantalla |
|---|---|---|
| 0:00 – 0:04 | **La final se viene.** Tribuna llena de hinchas pincharratas (camisetas a rayas rojas y blancas, banderas rojo-blanco-rojo, bengalas, papelitos). La cámara sube por encima del estadio, recorre La Plata de noche (su cuadrado con diagonales) y llega a un mapa 3D de Argentina y Uruguay. Buenos Aires y Montevideo quedan marcados y aparece la ruta roja y blanca. | ¡EL PINCHA VA POR LA GLORIA ETERNA! · BUENOS AIRES · MONTEVIDEO · ARGENTINA · URUGUAY |
| 0:04 – 0:08 | **Opción 1, el micro.** Micro de dos pisos con el cartel "MONTEVIDEO". Los hinchas suben con banderas y después el micro sale a la ruta al atardecer. | OPCIÓN 1 · VIAJÁ EN MICRO · IDA Y VUELTA |
| 0:08 – 0:12 | **Opción 2, el Buquebus.** Catamarán de alta velocidad tipo "Francisco" cruzando el Río de la Plata al atardecer, con su estela. Después, el mapa con la ruta por el río de Buenos Aires a Montevideo. | OPCIÓN 2 · VIAJÁ EN BUQUEBUS · IDA Y VUELTA · RÍO DE LA PLATA |
| 0:12 – 0:15.6 | **Llegada.** Las dos rutas se unen en Montevideo: el micro por tierra en rojo (vía Gualeguaychú – Fray Bentos) y el Buquebus por el río en blanco. Después, el Estadio Centenario con la Torre de los Homenajes y sus torres de luz, lleno de hinchas rojiblancos, con banderas, humo y papelitos. | MONTEVIDEO NOS ESPERA · ESTUDIANTES VS. PALMEIRAS · FINAL COPA LIBERTADORES |
| 0:15.6 – 0:20 | **Llamado a la acción.** Las dos opciones aparecen como tarjetas del mismo tamaño, una al lado de la otra. Después, el pedido de escribir "ESTUDIANTES" por mensaje, y el cierre con el logo de ALK TRAVEL. | ¡VAMOS PINCHA! · ELEGÍ CÓMO VIAJAR A LA FINAL · MICRO / IDA Y VUELTA · BUQUEBUS / IDA Y VUELTA · ¿QUERÉS MÁS INFORMACIÓN? · ESCRIBINOS ESTUDIANTES · Y TE CONTAMOS TODOS LOS DETALLES · logo ALK TRAVEL |

Las dos opciones se presentan como alternativas, nunca como un paquete combinado. Cada una tiene su escena con el mismo diseño ("OPCIÓN 1" y "OPCIÓN 2"). Al final están en tarjetas iguales con una "o" entre ellas. No hay aviones ni aeropuertos, y no se inventan precios.

Todo el texto está en español y queda dentro de la zona segura de Reels.

## Notas

- **Escudo de Estudiantes:** no venía en los archivos recibidos. Para no inventarlo no aparece en el video: la identidad del club la dan los colores y los textos. Si lo envían, se puede sumar a la placa final sin deformarlo.
- **Micro:** es un doble piso de larga distancia con una pintura propia, blanca y roja. No lleva logos de otras empresas. La foto de referencia (Andesmar) se usó solo para el tipo de vehículo y sus proporciones.
- **Buquebus:** es un catamarán tipo Incat de 99 m como el "Francisco": doble casco, banda de ventanas oscuras envolvente, dos chimeneas traseras y los colores del casco.
- **Mapa:** usa datos reales (Natural Earth 1:10m, edición Argentina). La ruta del micro va por tierra, cruzando el río Uruguay en Fray Bentos. La del Buquebus va directo por el Río de la Plata.
- **Logo:** es el original de ALK TRAVEL, sin redibujar.
- **Sonido:** está sintetizado y no tiene música con derechos. Incluye bombo y redoblante, motor del micro, agua y bocina del barco, tribuna e impactos. Si prefieren un audio de Instagram, silencien el original al publicar.

## Volver a generar

Requiere Node 18+, Python 3 con `numpy`, `Pillow` y `scipy`, `ffmpeg`, y Playwright con Chromium.

```bash
npm install
npm run prep                     # (solo si faltan) datos del mapa + recorte del logo
python3 tools/soundtrack.py      # audio -> output/soundtrack.wav
node render.mjs                  # video final
```

Para revisar sin renderizar todo, `node render.mjs --still 4.5,9,17.5` genera cuadros sueltos y `node render.mjs --scale 0.5 --mb 1` hace una vista previa rápida.

Los textos están en `scene/js/overlay.js`, y los tiempos y movimientos de cámara en `scene/js/timeline.js`.
