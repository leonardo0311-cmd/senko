# ALK TRAVEL — ¡Boca viaja a Colombia!

Reel animado para Instagram (1080×1920, 9:16, 30 fps, 19 s, con sonido).

**Archivo final:** `output/alk-boca-viaja-a-colombia-reel.mp4`

> *Donde juega Boca, viaja su gente.*

## Secuencia

| Tiempo | Escena | Texto en pantalla |
|---|---|---|
| 0:00 – 0:04 | **La partida.** Vuelo nocturno sobre Buenos Aires (Av. 9 de Julio, el Obelisco, el Río de la Plata). La cámara sube sin cortes desde la ciudad hasta un mapa 3D de Sudamérica. Un marcador amarillo señala Buenos Aires y la ruta luminosa empieza a dibujarse. | ¡LA PASIÓN SE PREPARA PARA VIAJAR! · BUENOS AIRES · ARGENTINA |
| 0:04 – 0:08 | **El viaje.** Despegue sobre el río con la ciudad de fondo. Paso por las ventanillas con la hinchada festejando adentro. El avión recorre la ruta sobre el mapa y Colombia se ilumina. | DESTINO: COLOMBIA · COLOMBIA |
| 0:08 – 0:13 | **La llegada.** Del mapa a una ciudad colombiana de noche, rodeada de montañas. El avión pasa sobre el estadio. La cámara entra al estadio: tribunas azul-amarillo-azul, telón gigante, banderas, humo de bengalas, papelitos y reflectores. | DONDE JUEGA BOCA, VIAJA SU GENTE. |
| 0:13 – 0:19 | **La oferta.** Barrido con los colores de Boca hacia la placa final (azul noche con la ruta dorada de fondo). | ¡BOCA VIAJA A COLOMBIA! · IDA Y VUELTA EN AVIÓN · USD 1.400 · SOLO PASAJE AÉREO · logo ALK TRAVEL |

Todo el texto está en español y queda dentro de la zona segura de Reels: no hay nada importante en los 250 px de arriba ni en los ~450 px de abajo, que es donde Instagram pone su interfaz.

## Qué hay en el video y de dónde sale

Todas las imágenes se generan por código (3D en tiempo real con three.js, renderizado cuadro por cuadro). No hay fotos de stock ni imágenes generadas con IA.

- **Logo:** el original de ALK TRAVEL (`assets/alk-logo-original.webp`), recortado como marca blanca sin redibujarlo ni deformarlo (`assets/alk-logo-white.png`, generado con `tools/extract_logo.py`).
- **Mapa:** costas y fronteras reales de Natural Earth 1:10m (edición “punto de vista Argentina”, con Malvinas argentinas), relieve y luces nocturnas de la NASA. Las únicas etiquetas del mapa son BUENOS AIRES, ARGENTINA y COLOMBIA.
- **Avión:** bimotor de fuselaje ancho, modelado por código con proporciones reales. La pintura tiene detalles sutiles de Boca: franja amarilla, panza azul y cola azul cruzada por una banda amarilla. No lleva logos ni nombres de aerolíneas.
- **Hinchas:** camisetas azules con la banda amarilla, camisetas amarillas, bufandas y banderas azul-amarillo-azul. No se usan escudos de ningún club.
- **Tipografía:** Barlow / Barlow Condensed (Google Fonts, licencia OFL), incluidas en `assets/fonts`.
- **Sonido:** sintetizado desde cero (`tools/soundtrack.py`): bombo y redoblante de tribuna, whooshes en cada transición, turbinas, rugido de estadio e impactos en los textos. No hay música con derechos.

Si prefieren usar un audio en tendencia de Instagram, pueden silenciar el sonido original al publicar.

## Volver a generar

Requiere Node 18+, Python 3 con `numpy`, `Pillow` y `scipy`, `ffmpeg`, y Playwright con Chromium.

```bash
npm install                      # three.js
npm run prep                     # (solo si faltan) datos del mapa + recorte del logo
python3 tools/soundtrack.py      # audio -> output/soundtrack.wav
node render.mjs                  # video final -> output/alk-boca-viaja-a-colombia-reel.mp4
```

Opciones útiles:

```bash
node render.mjs --still 3.5,7.9,15            # cuadros sueltos en PNG para revisar
node render.mjs --scale 0.5 --mb 1            # vista previa rápida a media resolución
node render.mjs --from 13.4 --to 19           # rehacer solo un tramo (los cuadros quedan en frames/)
```

Los textos están en `scene/js/overlay.js`, y los tiempos y movimientos de cámara en `scene/js/timeline.js`.
