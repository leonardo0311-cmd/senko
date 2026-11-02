import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { animate, motion, useAnimationFrame, useMotionValue, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, Maximize2, Play, Volume2, VolumeX } from "lucide-react";
import { contentHeading, contentKinds, type ContentItem } from "../../data/content";
import { cn } from "../../lib/utils";

/** Velocidad del carrusel en reposo (px por segundo, hacia la izquierda). */
const DRIFT = -34;
const GAP = 20;

const hoverQuery = "(hover: hover) and (pointer: fine)";
function useCanHover() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(hoverQuery);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(hoverQuery).matches,
    () => false,
  );
}

/** El navegador sólo deja reproducir con sonido después de que la persona hizo clic o tocó algo en la página. */
function hasUserActivation() {
  const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
  return ua ? ua.hasBeenActive : false;
}

function saveData() {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !!c?.saveData;
}

type Props = {
  items: ContentItem[];
  onOpen: (item: ContentItem) => void;
  /** Mientras el visor está abierto, el carrusel se frena y silencia. */
  paused?: boolean;
};

/**
 * Carrusel infinito de contenido.
 * - Escritorio: avanza solo, se frena al pasar el mouse; los videos visibles corren en silencio y el que tiene el mouse
 *   encima suena y gana protagonismo (zoom). Clic: activa el sonido (si el navegador lo pide) o abre el visor.
 * - Celular: se desliza con el dedo; tocar un video lo abre con sonido. No reproduce solo para no gastar datos.
 * - "Reducir movimiento": no avanza solo ni reproduce en silencio; el video corre sólo al pasar el mouse.
 */
export default function ContentCarousel({ items, onOpen, paused = false }: Props) {
  const reduce = useReducedMotion() ?? false;
  const canHover = useCanHover();
  const viewportRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const [setW, setSetW] = useState(0);
  const [copies, setCopies] = useState(3);
  const [cardW, setCardW] = useState(0);
  const [active, setActive] = useState<string | null>(null);
  const [inView, setInView] = useState(false);
  const [sound, setSound] = useState(false);

  const x = useMotionValue(0);
  const vel = useRef(reduce ? 0 : DRIFT);
  const flags = useRef({ hovering: false, focused: false, dragging: false, busy: false, dragged: false });

  // El rango útil de x es (-2·set, -set]: deja una copia de margen a cada lado para arrastrar sin ver huecos.
  const wrap = useCallback(
    (v: number) => {
      if (!setW) return v;
      let r = v % setW;
      if (r > 0) r -= setW;
      return r - setW;
    },
    [setW],
  );

  useLayoutEffect(() => {
    const measure = () => {
      const set = setRef.current;
      const vp = viewportRef.current;
      if (!set || !vp) return;
      const w = set.offsetWidth;
      setSetW(w);
      setCardW((set.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0);
      setCopies(Math.max(3, Math.ceil(vp.offsetWidth / Math.max(w, 1)) + 3));
      x.set(-w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (viewportRef.current) ro.observe(viewportRef.current);
    return () => ro.disconnect();
  }, [items, x]);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 });
    io.observe(vp);
    return () => io.disconnect();
  }, []);

  // Cualquier clic o tecla habilita el sonido para el resto de la visita.
  useEffect(() => {
    if (hasUserActivation()) setSound(true);
    const on = () => setSound(true);
    window.addEventListener("pointerdown", on, { once: true });
    window.addEventListener("keydown", on, { once: true });
    return () => {
      window.removeEventListener("pointerdown", on);
      window.removeEventListener("keydown", on);
    };
  }, []);

  useEffect(() => {
    if (paused) setActive(null);
  }, [paused]);

  useAnimationFrame((_, delta) => {
    const f = flags.current;
    if (!setW || f.dragging || f.busy || !inView || paused) return;
    const dt = Math.min(delta, 64) / 1000;
    const target = reduce || f.hovering || f.focused ? 0 : DRIFT;
    // Al pasar el mouse frena rápido; al salir retoma de a poco.
    vel.current += (target - vel.current) * Math.min(1, dt * (target === 0 ? 6 : 2.5));
    if (target === 0 && Math.abs(vel.current) < 1) {
      vel.current = 0;
      return;
    }
    x.set(wrap(x.get() + vel.current * dt));
  });

  const step = (dir: 1 | -1) => {
    if (!setW || flags.current.busy) return;
    const s = (cardW + GAP) * dir;
    flags.current.busy = true;
    animate(x, x.get() - s, {
      duration: reduce ? 0 : 0.7,
      ease: [0.16, 1, 0.3, 1],
      onComplete: () => {
        x.set(wrap(x.get()));
        flags.current.busy = false;
      },
    });
  };

  // Con teclado, la tarjeta enfocada se centra (el navegador intentaría desplazar el contenedor por su cuenta).
  const centerCard = (el: HTMLElement) => {
    requestAnimationFrame(() => {
      const vp = viewportRef.current;
      if (!vp) return;
      vp.scrollLeft = 0;
      const r = el.getBoundingClientRect();
      const v = vp.getBoundingClientRect();
      const off = r.left + r.width / 2 - (v.left + v.width / 2);
      if (Math.abs(off) < 4) return;
      // Sin el bucle de avance en el medio: si no, "envolvería" la posición y la tarjeta enfocada quedaría fuera de cuadro.
      vel.current = 0;
      flags.current.busy = true;
      animate(x, x.get() - off, {
        duration: reduce ? 0 : 0.6,
        ease: [0.16, 1, 0.3, 1],
        onComplete: () => (flags.current.busy = false),
      });
    });
  };

  const autoplay = canHover && !reduce && !paused && inView && !saveData();
  const loop = Array.from({ length: copies }, (_, c) => c);

  return (
    <div>
      <motion.div
        ref={viewportRef}
        className="relative overflow-hidden py-10 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]"
        initial={{ opacity: 0, x: 80 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        onMouseEnter={() => (flags.current.hovering = true)}
        onMouseLeave={() => {
          flags.current.hovering = false;
          setActive(null);
        }}
        onScroll={(e) => {
          e.currentTarget.scrollLeft = 0;
        }}
        onFocus={(e) => {
          flags.current.focused = true;
          if (e.target instanceof HTMLElement && e.target.matches(":focus-visible")) centerCard(e.target);
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) flags.current.focused = false;
        }}
      >
        <motion.div
          className={cn("flex w-max", canHover ? "cursor-grab active:cursor-grabbing" : "")}
          style={{ x }}
          drag="x"
          dragMomentum={false}
          onDragStart={() => {
            flags.current.dragging = true;
            flags.current.dragged = true;
          }}
          onDragEnd={(_, info) => {
            flags.current.dragging = false;
            x.set(wrap(x.get()));
            vel.current = Math.max(-1600, Math.min(1600, info.velocity.x));
            window.setTimeout(() => (flags.current.dragged = false), 60);
          }}
        >
          {loop.map((c) => (
            <div
              key={c}
              ref={c === 0 ? setRef : undefined}
              className="flex"
              style={{ gap: GAP, paddingRight: GAP }}
              aria-hidden={c === 1 ? undefined : true}
            >
              {items.map((item) => {
                const k = `${c}-${item.id}`;
                return (
                  <Card
                    key={k}
                    item={item}
                    isActive={active === k}
                    dimmed={active !== null && active !== k}
                    interactive={c === 1}
                    canHover={canHover}
                    autoplay={autoplay}
                    sound={sound}
                    rootRef={viewportRef}
                    onEnter={() => setActive(k)}
                    onLeave={() => setActive((a) => (a === k ? null : a))}
                    onActivate={() => {
                      if (flags.current.dragged) return false;
                      return true;
                    }}
                    onUnlockSound={() => setSound(true)}
                    onOpen={onOpen}
                  />
                );
              })}
            </div>
          ))}
        </motion.div>
      </motion.div>

      <div className="container-x mt-2 flex items-center justify-between gap-6">
        <p className="label text-fg/60">
          {canHover ? "Pasá el mouse por un video para escucharlo" : "Deslizá y tocá un video para verlo con sonido"}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Anterior"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-fg/25 text-fg transition-colors hover:bg-fg hover:text-canvas"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Siguiente"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-fg/25 text-fg transition-colors hover:bg-fg hover:text-canvas"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

type CardProps = {
  item: ContentItem;
  isActive: boolean;
  dimmed: boolean;
  /** Sólo la copia central es navegable con teclado y lectores de pantalla; las demás son decorado del bucle. */
  interactive: boolean;
  canHover: boolean;
  autoplay: boolean;
  sound: boolean;
  rootRef: React.RefObject<HTMLDivElement | null>;
  onEnter: () => void;
  onLeave: () => void;
  onActivate: () => boolean;
  onUnlockSound: () => void;
  onOpen: (item: ContentItem) => void;
};

function Card({ item, isActive, dimmed, interactive, canHover, autoplay, sound, rootRef, onEnter, onLeave, onActivate, onUnlockSound, onOpen }: CardProps) {
  const vref = useRef<HTMLVideoElement>(null);
  const elRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [audible, setAudible] = useState(false);
  const heading = contentHeading(item);
  const hasVideo = !!item.video;

  useEffect(() => {
    const el = elRef.current;
    if (!el || !hasVideo) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { root: rootRef.current, threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [hasVideo, rootRef]);

  // Reproducir: el activo siempre; el resto, en silencio, sólo si está a la vista y se permite reproducción automática.
  useEffect(() => {
    const v = vref.current;
    if (!v) return;
    if (isActive || (autoplay && visible)) v.play().catch(() => {});
    else v.pause();
  }, [isActive, autoplay, visible]);

  // Sonido: sólo el que tiene el mouse encima.
  useEffect(() => {
    const v = vref.current;
    if (!v) return;
    if (isActive && sound) {
      v.muted = false;
      v.play()
        .then(() => setAudible(true))
        .catch(() => {
          v.muted = true;
          setAudible(false);
          v.play().catch(() => {});
        });
    } else {
      v.muted = true;
      setAudible(false);
    }
  }, [isActive, sound]);

  const handleClick = (e: React.MouseEvent) => {
    if (!onActivate()) {
      e.preventDefault();
      return;
    }
    if (item.url) return; // el enlace abre en otra pestaña
    e.preventDefault();
    const v = vref.current;
    if (canHover && v && !audible) {
      // Dentro del clic el navegador sí deja activar el sonido.
      onUnlockSound();
      v.muted = false;
      v.play()
        .then(() => setAudible(true))
        .catch(() => {});
      return;
    }
    onOpen(item);
  };

  const hint = !canHover ? null : !isActive ? null : !hasVideo ? "Ver en grande" : audible ? "Clic para ver en grande" : "Clic para escuchar";

  const inner = (
    <span
      className="relative block overflow-hidden rounded-2xl bg-surface shadow-[0_30px_60px_-30px_rgb(0_0_0/0.8)]"
      style={{ aspectRatio: item.vertical || item.kind === "foto" ? "9 / 16" : "16 / 9" }}
    >
      {hasVideo ? (
        <video
          ref={vref}
          src={item.video}
          poster={item.image}
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
          tabIndex={-1}
        />
      ) : (
        <img src={item.image} alt={item.alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      )}

      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-ink/20" />

      <span className="label pointer-events-none absolute left-3 top-3 rounded-full bg-ink/60 px-3 py-1.5 text-paper backdrop-blur-sm">
        {contentKinds[item.kind].label}
      </span>

      {hasVideo && canHover && (
        <span className="pointer-events-none absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink/60 text-paper backdrop-blur-sm">
          {audible ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
        </span>
      )}

      {hasVideo && !canHover && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-paper/90 text-wine">
            <Play size={22} fill="currentColor" aria-hidden="true" />
          </span>
        </span>
      )}

      <span className="pointer-events-none absolute inset-x-0 bottom-0 block p-4 text-left text-paper">
        {hint && (
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 text-xs font-semibold text-wine">
            {audible || !hasVideo ? <Maximize2 size={13} aria-hidden="true" /> : <Volume2 size={13} aria-hidden="true" />}
            {hint}
          </span>
        )}
        <span className="flex items-center gap-2 text-lg font-bold leading-tight">
          {heading}
          {item.url && <ArrowUpRight size={16} aria-hidden="true" />}
        </span>
        {(item.artist ? item.title : item.date) && (
          <span className="mt-0.5 block text-sm text-paper/75">{item.artist ? [item.title, item.date].filter(Boolean).join(" · ") : item.date}</span>
        )}
      </span>
    </span>
  );

  const common = {
    className: cn(
      "relative block shrink-0 outline-offset-4 transition-[scale,opacity,filter] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
      "w-[64vw] sm:w-[40vw] md:w-[30vw] lg:w-[min(22vw,300px)]",
      isActive && "z-10 scale-[1.08]",
      dimmed && "opacity-45 saturate-50",
    ),
    tabIndex: interactive ? 0 : -1,
    onMouseEnter: canHover ? onEnter : undefined,
    onMouseLeave: canHover ? onLeave : undefined,
    onFocus: onEnter,
    onBlur: onLeave,
    onClick: handleClick,
    draggable: false,
  };

  if (item.url) {
    return (
      <a
        {...common}
        ref={(el) => {
          elRef.current = el;
        }}
        href={item.url}
        target="_blank"
        rel="noreferrer"
        aria-label={`${contentKinds[item.kind].label}: ${heading} (se abre en otra pestaña)`}
      >
        {inner}
      </a>
    );
  }
  return (
    <button
      {...common}
      ref={(el) => {
        elRef.current = el;
      }}
      type="button"
      aria-label={`Ver ${contentKinds[item.kind].label.toLowerCase()}: ${heading}`}
    >
      {inner}
    </button>
  );
}
