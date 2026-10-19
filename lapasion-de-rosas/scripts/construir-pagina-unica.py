#!/usr/bin/env python3
"""Construye una pagina HTML unica y autocontenida a partir del export estatico.

    STATIC_EXPORT=1 ASSET_PREFIX=./estaticos npm run build
    python3 scripts/construir-pagina-unica.py pagina-unica.html

El servicio de artifacts envuelve la pagina en su propio esqueleto de documento,
asi que esta salida no lleva doctype/html/head/body propios. Tampoco lleva
rutas externas: CSS, fuentes e imagenes van embebidos.
"""
import base64, re, pathlib, sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
OUT = RAIZ / 'out'
DESTINO = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'pagina-unica.html')

html = (OUT / 'index.html').read_text(encoding='utf-8')

# ---- cuerpo ----------------------------------------------------------------
i = html.index('<body'); i = html.index('>', i) + 1
cuerpo = html[i:html.rindex('</body>')]

# fuera el runtime de Next: sin React no hay hidratacion que falle
cuerpo = re.sub(r'<script\b[^>]*>.*?</script>', '', cuerpo, flags=re.S)
cuerpo = re.sub(r'<script\b[^>]*/?>', '', cuerpo)
cuerpo = re.sub(r'<div hidden="">.*?</div>', '', cuerpo, flags=re.S, count=1)
cuerpo = re.sub(r'<!--\$-->|<!--/\$-->|<!--\$\?-->|<!--/\$\?-->', '', cuerpo)

# el selector de idioma necesita el diccionario de React: fuera en esta version
cuerpo = re.sub(r'<button type="button" class="lang-toggle".*?</button>', '', cuerpo, flags=re.S, count=1)

# ---- CSS con las fuentes embebidas ----------------------------------------
css_rel = re.search(r'href="[^"]*/(?P<n>[\w.-]+\.css)"', html).group('n')
css_path = next(OUT.glob(f'_next/static/chunks/{css_rel}'))
css = css_path.read_text(encoding='utf-8')

# Next emite 65 reglas @font-face (una por peso y subconjunto) que repiten los
# mismos 13 woff2. Embeberlas sumaba 2 MB de base64 duplicado, asi que las
# servimos desde Google Fonts, el unico origen de hojas que el contrato permite.
fuentes = len(re.findall(r'@font-face\{', css))
css = re.sub(r'@font-face\{[^}]*\}', '', css)

# Las variables de fuente viajaban en la clase del <html>, etiqueta que en un
# artifact pertenece al esqueleto del servicio. Las declaramos nosotros.
css = (
    ':root{--fuente-serif:"Instrument Serif";--fuente-sans:"Inter Tight"}\n' + css
)
ENLACE_FUENTES = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2'
    '?family=Instrument+Serif:ital@0;1'
    '&family=Inter+Tight:wght@300;400;500&display=swap">\n'
)

# ---- imagenes embebidas ----------------------------------------------------
cache = {}
def _datauri(nombre):
    if nombre not in cache:
        f = OUT / 'fotos' / f'{nombre}.webp'
        cache[nombre] = 'data:image/webp;base64,' + base64.b64encode(f.read_bytes()).decode()
    return cache[nombre]

imagenes = 0
def _picture(m):
    """Deja un solo <img> con la foto embebida en WebP."""
    global imagenes
    bloque = m.group(0)
    img = re.search(r'<img\b[^>]*>', bloque).group(0)
    # El prefijo depende de cómo se construyó: NEXT_PUBLIC_BASE_PATH lo deja
    # como "./fotos". Sin aceptar las dos formas, esto reventaba con un
    # AttributeError seco en vez de decir qué pasó.
    m = re.search(r'src="\.?/fotos/([\w-]+)\.webp"', img)
    if not m:
        sys.exit(f'no se encontró la ruta de la foto en: {img[:120]}')
    nombre = m.group(1)
    imagenes += 1
    return re.sub(r'src="\.?/fotos/[\w-]+\.webp"', lambda _: f'src="{_datauri(nombre)}"', img, count=1)
cuerpo = re.sub(r'<picture>.*?</picture>', _picture, cuerpo, flags=re.S)

# El logotipo no pasa por <picture>: va como <img> suelto.
logos = [0]
def _logo(m):
    logos[0] += 1
    f = OUT / 'marca' / m.group(1)
    b64 = base64.b64encode(f.read_bytes()).decode()
    return f'src="data:image/webp;base64,{b64}"'
cuerpo = re.sub(r'src="\.?/marca/([\w-]+\.webp)"', _logo, cuerpo)

restantes = re.findall(r'(?:src|srcSet|href)="\.?/(?:fotos|marca)/[^"]*"', cuerpo)
if restantes:
    sys.exit(f'quedaron rutas externas: {restantes[:5]}')

# React escribe srcSet/fetchPriority; en HTML plano van en minuscula
cuerpo = cuerpo.replace('fetchPriority=', 'fetchpriority=').replace('srcSet=', 'srcset=')

# ---- comportamiento, en vanilla --------------------------------------------
JS = r'''
(function () {
  var raiz = document.documentElement, cuerpo = document.body;
  if (!raiz.lang) raiz.lang = 'es-AR';

  /* Revelado al entrar en pantalla */
  raiz.classList.add('js-reveal-ready');
  var piezas = [].slice.call(document.querySelectorAll('.reveal'));
  function mostrar(el) { el.classList.add('in'); }
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { mostrar(e.target); obs.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    piezas.forEach(function (el) {
      if (el.getBoundingClientRect().top < innerHeight * 1.05) mostrar(el); else obs.observe(el);
    });
  } else { piezas.forEach(mostrar); }
  /* red de seguridad: nada queda invisible */
  setTimeout(function () { document.querySelectorAll('.reveal:not(.in)').forEach(mostrar); }, 4000);

  /* Cabecera solida al bajar */
  var cab = document.querySelector('.site-header');
  function alScrollear() { if (cab) cab.classList.toggle('solid', scrollY > 24); }
  addEventListener('scroll', alScrollear, { passive: true });
  alScrollear();

  /* Menu movil.
     React le pone la clase 'open' al propio <nav>, que es la que lo trae a
     pantalla; sin eso el panel se quedaba fuera por mas que el boton
     cambiara de estado. */
  var boton = document.querySelector('.nav-toggle');
  var panel = document.querySelector('.main-nav');
  function cerrar() {
    if (!boton) return;
    boton.setAttribute('aria-expanded', 'false');
    boton.setAttribute('aria-label', 'Abrir menu');
    cuerpo.classList.remove('menu-open');
    if (panel) panel.classList.remove('open');
  }
  if (boton) {
    boton.addEventListener('click', function () {
      var abierto = boton.getAttribute('aria-expanded') !== 'true';
      boton.setAttribute('aria-expanded', String(abierto));
      boton.setAttribute('aria-label', abierto ? 'Cerrar menu' : 'Abrir menu');
      cuerpo.classList.toggle('menu-open', abierto);
      if (panel) panel.classList.toggle('open', abierto);
    });
    document.querySelectorAll('.main-nav a').forEach(function (a) { a.addEventListener('click', cerrar); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(); });
  }

  /* Cursor propio, solo con mouse fino */
  var punto = document.querySelector('.cur-dot'), aro = document.querySelector('.cur-ring');
  if (punto && aro && matchMedia('(pointer: fine)').matches &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var x = 0, y = 0, ax = 0, ay = 0, visible = false, animando = false;
    function cuadro() {
      ax += (x - ax) * 0.18; ay += (y - ay) * 0.18;
      punto.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      aro.style.transform = 'translate3d(' + ax + 'px,' + ay + 'px,0)';
      if (Math.abs(x - ax) > 0.1 || Math.abs(y - ay) > 0.1) requestAnimationFrame(cuadro);
      else animando = false;
    }
    addEventListener('mousemove', function (e) {
      x = e.clientX; y = e.clientY;
      if (!visible) { visible = true; ax = x; ay = y; cuerpo.classList.add('has-cursor'); }
      if (!animando) { animando = true; requestAnimationFrame(cuadro); }
    }, { passive: true });
    document.addEventListener('mouseover', function (e) {
      var d = e.target;
      if (!d || !d.closest) return;
      var ver = d.closest('[data-cursor="view"]');
      var enlace = d.closest('a,button,[data-cursor="link"]');
      cuerpo.classList.toggle('cur-view', !!ver);
      cuerpo.classList.toggle('cur-link', !!enlace && !ver);
    });
  }

  /* ---- El mapa -----------------------------------------------------------
     Se muestra directo: el marco ya viene en el marcado, con loading=lazy.
     Esto solo se ocupa del respaldo. Un marco bloqueado igual dispara 'load'
     —carga la pagina de error del navegador—, asi que ese evento no sirve
     para saber si hay mapa: se comprueba que Google sea alcanzable apenas
     abre la pagina, y si no lo es se muestra la ficha con la direccion.     */
  (function mapa() {
    var caja = document.querySelector('.mapa');
    if (!caja) return;
    var ficha = caja.querySelector('.mapa-ficha');
    var src = caja.getAttribute('data-mapa-src');
    if (!ficha || !src) return;

    var fallado = false;
    function fallar() {
      if (fallado) return;
      fallado = true;
      caja.classList.add('mapa-falla');
      var marco = caja.querySelector('.mapa-marco');
      if (marco) marco.remove();
      ficha.hidden = false;
    }

    /* Si la politica de la pagina lo prohibe, el navegador avisa. */
    document.addEventListener('securitypolicyviolation', function (e) {
      if (e.blockedURI && e.blockedURI.indexOf('google') !== -1) fallar();
    });

    /* Si la red lo bloquea, la peticion rechaza. */
    fetch(src, { mode: 'no-cors', cache: 'no-store' }).catch(fallar);
  })();

  /* ---- Chispas sobre el asado -------------------------------------------
     Las crea React en el sitio Next; acá hay que sembrarlas a mano.        */
  (function brasas() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var total = matchMedia('(max-width: 760px)').matches ? 12 : 26;
    document.querySelectorAll('.embers').forEach(function (caja) {
      for (var i = 0; i < total; i++) {
        var e = document.createElement('div');
        e.className = 'ember-particle';
        var tam = 2 + Math.random() * 5;
        e.style.width = tam + 'px';
        e.style.height = tam + 'px';
        e.style.left = Math.random() * 100 + '%';
        e.style.setProperty('--drift', (Math.random() * 80 - 40) + 'px');
        e.style.animationDuration = (6 + Math.random() * 7) + 's';
        e.style.animationDelay = (Math.random() * 9) + 's';
        caja.appendChild(e);
      }
    });
  })();

  /* ---- La carta lacrada de bienvenida ------------------------------------
     El telón nace oculto; sólo aparece en la primera visita y se abre solo.
     Un clic o una tecla cualquiera lo saltean.                             */
  (function sobre() {
    var capa = document.querySelector('.sobre-capa');
    if (!capa) return;
    var CLAVE = 'lpr-sobre-visto';

    var visto = false;
    try { visto = localStorage.getItem(CLAVE) === '1'; } catch (e) { visto = false; }
    if (visto) return;
    try { localStorage.setItem(CLAVE, '1'); } catch (e) { /* sin almacenamiento */ }

    var quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var espera = quieto ? 700 : 900;
    var duracion = quieto ? 500 : 2000;

    var scrollPrevio = cuerpo.style.overflow;
    capa.classList.add('visible');
    cuerpo.style.overflow = 'hidden';
    /* Tapado no se ve, pero el sitio de atrás sigue animando y le come
       cuadros a la apertura: la clase pausa esas animaciones. */
    cuerpo.classList.add('sobre-puesto');

    var abierto = false;
    function abrir() {
      if (abierto) return;
      abierto = true;
      capa.classList.add('abriendo');
      setTimeout(function () {
        capa.classList.remove('visible', 'abriendo');
        cuerpo.style.overflow = scrollPrevio;
        cuerpo.classList.remove('sobre-puesto');
        removeEventListener('keydown', abrir);
      }, duracion);
    }

    setTimeout(abrir, espera);
    capa.addEventListener('click', abrir);
    addEventListener('keydown', abrir);
  })();

  /* ---- La carta: buscador, filtros y scrollspy ---------------------------
     El marcado ya trae todos los platos; aca solo se achica la lista.        */
  (function carta() {
    var caja = document.querySelector('#carta');
    if (!caja) return;
    var buscador = caja.querySelector('#buscador-carta');
    var chips = [].slice.call(caja.querySelectorAll('.menu-filters .filter-chip'));
    var salida = caja.querySelector('.menu-results');
    var cuerpoCarta = caja.querySelector('.menu-body');
    var secciones = [].slice.call(caja.querySelectorAll('.cat-section'));
    var rail = [].slice.call(caja.querySelectorAll('.cat-rail a'));

    var normal = function (t) {
      return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    };

    /* "Menu por pasos" no se filtra plato por plato: se esconde al buscar */
    var fijas = secciones.filter(function (s) { return !!s.querySelector('.menu-set'); });

    var filas = [].slice.call(caja.querySelectorAll('.item-row')).map(function (fila) {
      var nombre = fila.querySelector('.item-name');
      return {
        el: fila,
        nombre: nombre,
        texto: nombre ? normal(nombre.textContent) : '',
        original: nombre ? nombre.textContent : '',
        etiquetas: [].slice.call(fila.querySelectorAll('.item-tags span'))
          .map(function (s) { return normal(s.textContent.trim()); }),
      };
    });

    /* el titulo de grupo se oculta si no le queda ningun plato debajo */
    var grupos = [].slice.call(caja.querySelectorAll('.group-title')).map(function (t) {
      var suyas = [], n = t.nextElementSibling;
      while (n && n.classList.contains('item-row')) { suyas.push(n); n = n.nextElementSibling; }
      return { el: t, filas: suyas };
    });

    var limpiar = document.createElement('button');
    limpiar.type = 'button';
    limpiar.className = 'filter-chip filter-clear';
    limpiar.textContent = 'Limpiar filtros';
    limpiar.hidden = true;
    var contenedorChips = caja.querySelector('.menu-filters');
    if (contenedorChips) contenedorChips.appendChild(limpiar);

    var vacio = document.createElement('p');
    vacio.className = 'menu-empty';
    vacio.textContent = 'Ningún plato coincide con tu búsqueda.';
    vacio.hidden = true;
    if (cuerpoCarta) cuerpoCarta.appendChild(vacio);

    function activas() {
      return chips.filter(function (c) { return c.getAttribute('aria-pressed') === 'true'; })
        .map(function (c) { return normal(c.textContent.trim()); });
    }

    function marcar(f, q) {
      if (!f.nombre) return;
      if (!q) { f.nombre.textContent = f.original; return; }
      var i = f.texto.indexOf(q);
      if (i === -1) { f.nombre.textContent = f.original; return; }
      f.nombre.textContent = '';
      f.nombre.appendChild(document.createTextNode(f.original.slice(0, i)));
      var mk = document.createElement('mark');
      mk.textContent = f.original.slice(i, i + q.length);
      f.nombre.appendChild(mk);
      f.nombre.appendChild(document.createTextNode(f.original.slice(i + q.length)));
    }

    function aplicar() {
      var q = normal((buscador ? buscador.value : '').trim());
      var tags = activas();
      var filtrando = q.length > 0 || tags.length > 0;
      var total = 0;

      filas.forEach(function (f) {
        var pasa = (!q || f.texto.indexOf(q) !== -1) &&
          tags.every(function (tg) { return f.etiquetas.indexOf(tg) !== -1; });
        f.el.hidden = !pasa;
        if (pasa) total++;
        marcar(f, pasa ? q : '');
      });

      grupos.forEach(function (g) {
        g.el.hidden = g.filas.every(function (fl) { return fl.hidden; });
      });

      secciones.forEach(function (s) {
        if (fijas.indexOf(s) !== -1) { s.hidden = filtrando; return; }
        var quedan = [].slice.call(s.querySelectorAll('.item-row')).some(function (fl) { return !fl.hidden; });
        s.hidden = filtrando && !quedan;
      });

      rail.forEach(function (a) {
        var destino = document.getElementById(a.getAttribute('href').slice(1));
        a.classList.toggle('is-dimmed', !!(filtrando && destino && destino.hidden));
      });

      limpiar.hidden = !filtrando;
      vacio.hidden = !(filtrando && total === 0);
      if (salida) {
        salida.textContent = !filtrando ? ''
          : total === 0 ? 'Ningún plato coincide con tu búsqueda.'
          : total === 1 ? '1 plato encontrado.'
          : total + ' platos encontrados.';
      }
    }

    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true'));
        aplicar();
      });
    });
    limpiar.addEventListener('click', function () {
      chips.forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
      if (buscador) { buscador.value = ''; buscador.focus(); }
      aplicar();
    });
    if (buscador) buscador.addEventListener('input', aplicar);

    /* atajo "/" para saltar al buscador */
    addEventListener('keydown', function (e) {
      var act = document.activeElement;
      if (e.key !== '/' || act === buscador) return;
      if (act && (act.tagName === 'INPUT' || act.tagName === 'TEXTAREA')) return;
      e.preventDefault();
      caja.scrollIntoView({ block: 'start' });
      if (buscador) buscador.focus();
    });

    /* scrollspy del rail de categorias */
    if ('IntersectionObserver' in window && secciones.length) {
      var spy = new IntersectionObserver(function (es) {
        var dentro = es.filter(function (e) { return e.isIntersecting; });
        if (!dentro.length) return;
        var id = dentro[0].target.id;
        rail.forEach(function (a) {
          if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      }, { rootMargin: '-140px 0px -70% 0px' });
      secciones.forEach(function (s) { spy.observe(s); });
    }

    aplicar();
  })();

  /* ---- Galeria: visor a pantalla completa -------------------------------- */
  (function galeria() {
    var piezas = [].slice.call(document.querySelectorAll('.gallery .g-item'));
    if (!piezas.length) return;
    var caja = null, indice = 0, previo = null;

    function pintar() {
      var pieza = piezas[indice];
      var img = pieza.querySelector('img');
      var cap = pieza.querySelector('.g-cap');
      caja.setAttribute('aria-label', (indice + 1) + ' / ' + piezas.length);
      caja.querySelector('.lightbox-fig').innerHTML = '';
      var copia = document.createElement('img');
      copia.src = img.currentSrc || img.src;
      copia.alt = img.alt || '';
      copia.className = 'ph';
      caja.querySelector('.lightbox-fig').appendChild(copia);
      caja.querySelector('.lightbox-cap').textContent = cap ? cap.textContent : '';
    }

    function cerrar() {
      if (!caja) return;
      caja.remove(); caja = null;
      cuerpo.style.overflow = '';
      if (previo) previo.focus();
    }

    function mover(paso) {
      indice = (indice + paso + piezas.length) % piezas.length;
      pintar();
    }

    function abrir(i, disparador) {
      indice = i; previo = disparador;
      caja = document.createElement('div');
      caja.className = 'lightbox';
      caja.setAttribute('role', 'dialog');
      caja.setAttribute('aria-modal', 'true');
      caja.innerHTML =
        '<button type="button" class="lightbox-close">Cerrar ✕</button>' +
        '<figure class="lightbox-fig" style="margin:0;position:relative;aspect-ratio:3/2"></figure>' +
        '<div class="lightbox-cap"></div>';
      caja.addEventListener('click', function (e) { if (e.target === caja) cerrar(); });
      caja.querySelector('.lightbox-close').addEventListener('click', cerrar);
      cuerpo.appendChild(caja);
      cuerpo.style.overflow = 'hidden';
      pintar();
      caja.querySelector('.lightbox-close').focus();
    }

    piezas.forEach(function (pieza, i) {
      pieza.addEventListener('click', function () { abrir(i, pieza); });
    });

    addEventListener('keydown', function (e) {
      if (!caja) return;
      if (e.key === 'Escape') { e.preventDefault(); cerrar(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); mover(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); mover(-1); }
      else if (e.key === 'Tab') { e.preventDefault(); caja.querySelector('.lightbox-close').focus(); }
    });
  })();

})();
'''

DESTINO.write_text(
    '<title>La Pasión de Rosas</title>\n' + ENLACE_FUENTES + '<style>\n' + css + '\n</style>\n' + cuerpo +
    '\n<script>' + JS + '</script>\n',
    encoding='utf-8')

kb = DESTINO.stat().st_size / 1024
print(f'reglas @font-face reemplazadas por Google Fonts: {fuentes}')
print(f'imagenes embebidas: {imagenes}')
print(f'logotipos embebidos: {logos[0]}')
print(f'salida: {DESTINO}  ({kb:.0f} KB)')
