#!/usr/bin/env bash
# Construye el sitio para GitHub Pages, que sirve desde /<repo>/.
#
#   bash scripts/construir-pages.sh
#
# Deja todo en docs/, que es de donde Pages publica. Tres cosas hacen que
# funcione en un subdirectorio:
#   - assetPrefix "." y NEXT_PUBLIC_BASE_PATH "." → rutas relativas a la página.
#   - .nojekyll → si no, Pages pasa el sitio por Jekyll, que ignora las
#     carpetas que empiezan con guión bajo, y _next desaparece entero.
#   - el <link> del favicon lo emite Next en absoluto; se pasa a relativo.
set -euo pipefail
cd "$(dirname "$0")/.."

SITIO="${NEXT_PUBLIC_SITE_URL:-https://leonardo0311-cmd.github.io/senko}"

rm -rf out docs
STATIC_EXPORT=1 NEXT_PUBLIC_BASE_PATH=. NEXT_PUBLIC_SITE_URL="$SITIO" npx next build

cp -r out docs
touch docs/.nojekyll
# Next emite el favicon en ruta absoluta, y lo hace dos veces: en el <link> del
# HTML y, escapado, dentro del payload con el que React hidrata. Si sólo se
# arregla el primero, React vuelve a pedir la ruta absoluta y da 404.
python3 - <<'PY'
import pathlib
n = 0
for f in pathlib.Path('docs').rglob('*.html'):
    t = f.read_text(encoding='utf-8')
    o = t.replace('href="/icon', 'href="./icon').replace('href\\":\\"/icon', 'href\\":\\"./icon')
    if o != t:
        f.write_text(o, encoding='utf-8'); n += 1
print(f'favicon relativizado en {n} archivo(s)')
PY

echo
echo "docs/ listo para GitHub Pages ($(du -sh docs | cut -f1))"
echo "rutas absolutas que quedan en el HTML:"
grep -o '\(src\|href\)="/[^"]*"' docs/index.html | sort -u || echo "  ninguna"
