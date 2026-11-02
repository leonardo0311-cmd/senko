# Fotografías del sitio

Acá van las fotos propias de CKC. **No en `public/`**: solo desde esta carpeta Astro las
optimiza, les genera formatos modernos (AVIF, WebP), crea versiones para cada tamaño de
pantalla y activa la carga diferida.

```
imagenes/
├── instalaciones/   Recepción, consultorios, espacios de tratamiento, equipamiento
├── equipo/          Retratos profesionales
├── servicios/       Una imagen por área de atención
└── blog/            Imágenes de las notas
```

## Cómo usarlas

En los archivos de datos (`src/data/instalaciones.ts`, `src/data/equipo.ts`) se importan
y se asignan al campo correspondiente:

```ts
import recepcion from '@/imagenes/instalaciones/recepcion.jpg';

{ id: 'recepcion', titulo: 'Recepción', imagen: recepcion,
  alt: 'Recepción del consultorio con mostrador y sala de espera' }
```

El campo `alt` **siempre** describe lo que se ve de verdad en la foto: lo usan los
lectores de pantalla y los buscadores.

## Recomendaciones

- Formato JPG para fotos, PNG solo si hace falta transparencia.
- Subir el archivo grande (1600–2400 px de ancho): Astro genera las versiones chicas.
  No hace falta comprimirlas antes.
- Horizontales para las cabeceras y las notas; verticales (4:5) para los retratos.
- Nombres de archivo descriptivos y sin acentos: `sala-de-tratamiento.jpg`.

## Importante

Solo fotos reales del consultorio, su equipo y sus instalaciones. No usar fotos de otros
centros ni imágenes de bancos genéricos presentadas como propias, y no mostrar
equipamiento que el consultorio no tenga.

Si se publican fotos donde aparecen pacientes, hace falta su autorización expresa.
