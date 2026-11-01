#!/bin/sh
# Compila la web de RINDE desde un commit fijo del repo público en GitHub.
# Código: https://github.com/leonardo0311-cmd/senko/tree/claude/rinde-web
set -e
COMMIT=69c30586e19ae417ef1e463c065537b37ace4430
rm -rf .rinde-src dist
mkdir .rinde-src
curl -fsSL "https://codeload.github.com/leonardo0311-cmd/senko/tar.gz/$COMMIT" | tar -xz --strip-components=1 -C .rinde-src
cd .rinde-src
npm ci --no-audit --no-fund
npm run build
cd ..
mv .rinde-src/dist dist
