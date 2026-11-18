# Walter Pesca: landing de muestra

Página de una sola hoja para Walter Pesca (trackers de pesca en San Miguel del Monte). Es un solo archivo, `index.html`: se abre con doble clic en cualquier navegador, sin instalar nada. Las fuentes se cargan de Google Fonts; sin internet, el navegador usa fuentes del sistema.

| Archivo | Para qué |
|---|---|
| `index.html` | La página |
| `preview/portada-celular.jpg` | Captura del inicio en celular, para mandar por WhatsApp |
| `preview/portada-compu.jpg` | Captura del inicio en computadora |
| `preview/pagina-completa.jpg` | La página entera en computadora |
| `preview/animacion-celular.mp4` | Video de la animación de entrada en celular (5 s) |
| `preview/animacion-compu.mp4` | Video de la animación de entrada en computadora (5 s) |

La animación está dentro de `index.html`, no es un video aparte. Cuando la portada queda a la vista, el bote entra deslizándose con la proa levantada, frena salpicando y los dos pescadores tiran la caña. Después recogen y vuelven a tirar cada 9 segundos. Es solo CSS, sin librerías. Si el dispositivo tiene activado "reducir movimiento", la entrada se ve una vez y no se repite.

Secciones: portada con ilustración del amanecer en la laguna · cinta animada · 3 modelos de tracker · equipamiento · por qué elegirnos con mapa ilustrado · llamada a la acción · contacto con formulario que abre WhatsApp · botón flotante de WhatsApp.

## Qué hay que cambiar con datos reales

Todo el contenido es de ejemplo hasta confirmarlo con Walter:

- **Número de WhatsApp:** `const WHATSAPP = '5492271000000'` al final de `index.html` (formato 549 + característica sin 0 + número sin 15). El número visible está en la sección Contacto.
- **Modelos:** nombres, medidas, capacidad, motor recomendado y características.
- **Instagram:** el enlace está en `href="#"`.
- **Horarios y dirección:** en la sección Contacto.
- **Servicios y frases de la sección "Por qué"** (entrega, post-venta, service): confirmar que Walter los ofrezca.
- Las ilustraciones (lancha, modelos y mapa) son dibujos genéricos. Se pueden reemplazar por fotos reales de las embarcaciones.
