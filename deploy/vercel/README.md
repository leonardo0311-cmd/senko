# Publicación en Vercel (proyecto `rinde`, equipo senko4)

El proyecto de Vercel no está conectado a GitHub. Para publicar sin subir todo el código,
se sube esta carpeta (3 archivos): `npm run build` descarga el commit indicado en
`scripts/build-from-github.sh` desde este repo público, lo compila y deja el resultado en `dist/`.

Para publicar una versión nueva:
1. Commitear y pushear los cambios a la rama `claude/rinde-web`.
2. Cambiar `COMMIT=` en `scripts/build-from-github.sh` por el hash nuevo.
3. Desplegar esta carpeta en el proyecto `rinde` (`vercel deploy --prod` desde acá, o la API con `files`).

Lo más simple a futuro: conectar el repo en Vercel (Settings → Git) con Root Directory vacío
y rama de producción `claude/rinde-web`. Ahí cada push se publica solo y esta carpeta deja de hacer falta.
