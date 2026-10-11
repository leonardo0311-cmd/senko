# Flyer: El Polaco en vivo en Maly

Flyer neón con la estética de Maly Bar y Music (rosa, cian y violeta sobre fondo morado, con el logo arriba).

| Archivo | Tamaño | Uso |
|---|---|---|
| `output/flyer-polaco-feed.png` | 1080×1350 (4:5) | Publicación en el feed de Instagram o Facebook |
| `output/flyer-polaco-story.png` | 1080×1920 (9:16) | Stories, estados de WhatsApp |

## Cambiar datos y volver a generar

```bash
python3 render_flyer.py --hora "22:00 HS"
python3 render_flyer.py --hora "21 HS" --info "RESERVAS AL 11 1234-5678"
```

`--hora` se agrega junto a "¡NO TE LO PIERDAS!". `--info` reemplaza la línea de abajo, que por defecto dice "RESERVA TU MESA POR MENSAJE DIRECTO".

Requiere Python 3, Pillow y numpy. Las fuentes (Pacifico, Monoton y Bebas Neue, de Google Fonts, licencia OFL) están en `assets/fonts`. El logo se toma de `../maly-outro/assets/maly-logo.png`.

---

# Flyer con foto (estilo "Gran Apertura")

`render_flyer_foto.py` arma el flyer con el mismo estilo que el de la Gran Apertura:

- Hojas de monstera de fondo, dibujadas por el script.
- Logo de Maly arriba a la izquierda y título neón "SHOW / EN VIVO".
- Fecha en cian, foto del artista recortada en el centro y nombre grande en rosa.
- Fila de info con íconos, dirección y botón neón "RESERVÁ TU MESA POR WHATSAPP".

| Archivo | Tamaño |
|---|---|
| `output/flyer-show-story.png` | 1080×1920 (Stories, estados) |
| `output/flyer-show-feed.png` | 1080×1350 (feed) |

```bash
pip install "rembg[cpu]"     # solo si la foto tiene fondo (recorte automático)
python3 render_flyer_foto.py --foto fotos/polaco.jpg
python3 render_flyer_foto.py --foto polaco.png --hora "21 HS" --extra "CENA • SHOW • BAILE"
```

Sin `--foto` se genera con una silueta en el lugar de la foto. Para cambiar cualquier texto usa `--artista`, `--titulo` (líneas separadas con `|`), `--fecha`, `--lugar`, `--hora`, `--extra`, `--direccion` y `--boton`.
