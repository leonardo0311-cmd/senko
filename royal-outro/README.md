# Logo "R" con corona: animación de entrada y salida

Animación en el estilo del GIF de *Del Sol*: el logo se arma pieza por pieza, se queda quieto y luego se desarma en orden inverso. Dura 6.4 s a 30 fps.

| Archivo | Formato | Uso |
|---|---|---|
| `output/royal-logo-sin-fondo.gif` | 600×600, fondo transparente, en loop | Web, WhatsApp, presentaciones |
| `output/royal-logo-alpha.webm` | 1080×1080, VP9 con transparencia | Superponer en CapCut, DaVinci o la web |
| `output/royal-logo-square.mp4` | 1080×1080 (1:1) sobre el mármol original | Feed de Instagram/Facebook |
| `output/royal-logo-vertical.mp4` | 1080×1920 (9:16) | Reels, TikTok, Stories |
| `output/royal-logo-horizontal.mp4` | 1920×1080 (16:9) | YouTube, pantallas |

Secuencia (paralela a la del sol):

1. El aro se dibuja desde abajo hacia arriba por ambos lados, con puntas brillantes (como la línea del horizonte).
2. La "R" sube desde dentro del aro (como el sol al salir).
3. La corona aparece de golpe con un pequeño rebote (como los rayos).
4. Un destello pasa en diagonal por el logo.
5. El logo se queda quieto unos 2 s. Luego sale la corona, baja la R y el aro se borra.

## Volver a generar

```bash
python3 render_logo.py                    # todo
python3 render_logo.py --only gif,square  # solo algunos
python3 render_logo.py --only mov         # MOV con alfa (PNG) para Premiere/Final Cut, ~80 MB
```

El MOV no se guarda en git por su tamaño. Los tiempos de cada paso están en las constantes `RING_IN`, `LETTER_IN`, `CROWN_IN`, etc. del script.

Requiere Python 3, Pillow, numpy y ffmpeg. La imagen fuente (`assets/royal-logo.jpg`) es de 447 px, así que en 1080 px el logo se ve un poco suave. Con una versión en mayor resolución basta con reemplazar ese archivo y ajustar las medidas `CX`, `CY`, `R_IN` y `R_OUT`.
