# Maly Bar y Music — Outro neón

Animación de cierre (6.5 s, 30 fps, con sonido de neón) para poner al final de los videos.

| Archivo | Formato | Uso |
|---|---|---|
| `output/maly-outro-vertical.mp4` | 1080×1920 (9:16) | Reels, TikTok, Stories |
| `output/maly-outro-square.mp4` | 1080×1080 (1:1) | Feed de Instagram/Facebook |
| `output/maly-outro-horizontal.mp4` | 1920×1080 (16:9) | YouTube, pantallas |

Secuencia: las palmas y hojas (azul/morado) se encienden parpadeando como neón → el flamenco, el aro y "Maly" (rosa) se encienden con un destello → pasa un brillo por el logo → aparece "¡TE ESPERAMOS!" → el neón parpadea y se apaga a negro.

## Cambiar el texto o volver a generar

```bash
python3 render_outro.py --tagline "@malybar"      # texto propio bajo el logo
python3 render_outro.py --tagline ""              # sin texto
python3 render_outro.py --formats vertical --no-audio
```

Requiere Python 3, Pillow, numpy y ffmpeg.
