# ALK TRAVEL — "El mundo en movimiento"

Reel de 15 s (1080×1920, 60 fps, con música) para Instagram Reels, TikTok y Stories.
Toda la animación está escrita en código: un solo HTML donde cada cuadro es una función del tiempo, con banda sonora generada con Web Audio.

| Archivo | Qué es |
|---|---|
| `output/alk-travel-reel.mp4` | Video final: 1080×1920, 60 fps, H.264 High + AAC 320 kbps, 15,0 s. Sube este archivo |
| `output/alk-travel-soundtrack.wav` | Banda sonora sola (48 kHz, estéreo, ≈ -14 LUFS) |
| `output/storyboard.png` | Un cuadro por tiempo musical (30 tiempos) sacado del video final; cada fila es una técnica |
| `alk-travel.html` | La animación: se puede abrir en el navegador; `seek(t)` dibuja cualquier instante |
| `render.js` | Renderiza audio, cuadros de control y el video final |
| `assets/alk-logo.svg` | Logo oficial vectorizado (blanco, fondo transparente) |
| `assets/src/alk-logo-reference.webp` | Imagen de referencia del logo desde la que se vectorizó |

## Idea

Arranca con el avión del logo: la cámara entra en la "A", el avión sale de su lugar, gira hacia arriba y despega dejando una estela; la cámara lo sigue hasta "EL MUNDO TE ESPERA". Después, un círculo blanco (el mundo) recorre la ruta: es la O de "MUNDO", se convierte en el Pan de Azúcar, sube como el sol de Miami, se transforma en el reloj del Big Ben y termina como el punto que cierra la línea bajo el logo.

| Tiempos | Técnica | Qué pasa |
|---|---|---|
| 1–6 (0–3 s) | Tipografía cinética | Despegue del avión de la A → "EL MUNDO TE ESPERA" → "VIVÍ BRASIL" |
| 7–12 (3–6 s) | Morphing de formas | Pan de Azúcar, Cristo Redentor, olas de Copacabana + **"≈ USD 200 MENOS QUE EN CUALQUIER PÁGINA WEB"** → los brazos del Cristo se vuelven las alas de un hotel art déco; letrero "MIAMI" |
| 13–18 (6–9 s) | 2D → 3D | El afiche de Miami se separa en capas, el piso se pliega, el hotel se extruye y la cámara lo rodea |
| 19–24 (9–12 s) | Datos / UI | El sol se vuelve reloj: MIAMI 07:00 → LONDRES 12:00 (+5 H), Big Ben, "EXPLORÁ INGLATERRA", 13.826 km |
| 25–30 (12–15 s) | Cierre | El Tower Bridge abre sus básculas y sube el logo; **"SIN IMPUESTOS — PRECIOS MÁS BAJOS QUE CUALQUIER PÁGINA WEB"**; "TU PRÓXIMO VIAJE COMIENZA ACÁ" |

El mensaje de precio aparece dos veces: el ejemplo concreto en Brasil (≈ USD 200 menos, en pantalla 2 s) y el argumento al cierre (sin impuestos, más barato que cualquier página web), que además es el primer cuadro del video (la portada).

120 BPM: bombo en cada tiempo, riser hacia el último compás, golpe en cada cambio de escena, sonido de turbina en el despegue. El último cuadro es igual al primero, así que el reel loopea sin corte.

Colores: solo `#4565D1`, `#FFFFFF` y `#0C1014`. Tipografía: Inter Display (incrustada en el HTML).

## Logo

El logo es el oficial, vectorizado desde `assets/src/alk-logo-reference.webp`: siempre se escala de forma uniforme, nunca se deforma. Solo en la apertura el avión sale de la "A"; en el cierre el logo está completo.

Si cambia el logo, reemplazá la imagen de referencia y volvé a vectorizar (actualiza el SVG y el HTML):

```bash
python3 tools/trace_logo.py
```

## Volver a generar

```bash
node render.js audio          # banda sonora → output/alk-travel-soundtrack.wav
node render.js beats          # un cuadro por tiempo → work/beats (para revisar)
node render.js frames 3.5 9.7 # cuadros puntuales → work/frames
node render.js video          # video final → output/alk-travel-reel.mp4
```

Cada cuadro de salida es el promedio de 3 sub-cuadros (ffmpeg `tmix`) para el desenfoque de movimiento, además del desenfoque direccional que sigue la velocidad de cada movimiento.

Requiere Node 18+, Playwright con Chromium y ffmpeg. Para vectorizar el logo: Python 3 con `numpy`, `pillow`, `opencv-python-headless` y `potracer`. Para cambiar la tipografía incrustada: `python3 tools/embed_fonts.py` (necesita `fonttools` y `brotli`).
