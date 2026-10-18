"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MENU, TAGS, cartaVerificada, type Categoria, type Plato, type Tag } from "@content/menu";
import { useIdioma } from "@/lib/idioma";
import { medir } from "@/lib/analitica";

/**
 * La carta.
 *
 * Todo se renderiza en línea —nada escondido detrás de un clic— para que se
 * lea completa, se pueda buscar con el Ctrl+F del navegador y la recorran los
 * lectores de pantalla. El rail de categorías son anclas reales, así que
 * funciona incluso sin JavaScript; el buscador y los filtros sólo achican la
 * misma lista.
 */

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function Carta() {
  const { t, pick, idioma } = useIdioma();
  const [consulta, setConsulta] = useState("");
  const [etiquetas, setEtiquetas] = useState<Set<Tag>>(new Set());
  const [activa, setActiva] = useState<string>(MENU[0]?.id ?? "");
  const buscador = useRef<HTMLInputElement>(null);
  const cuerpo = useRef<HTMLDivElement>(null);
  const medido = useRef(false);

  const filtrando = consulta.trim().length > 0 || etiquetas.size > 0;
  const q = norm(consulta.trim());

  /* --- ¿Qué platos sobreviven a los filtros? ---------------------------- */
  const visible = useMemo(() => {
    const pasa = (p: Plato) => {
      const nombre = pick(p.n, p.nEn);
      const coincide = !q || norm(nombre).includes(q);
      const tags = etiquetas.size === 0 || [...etiquetas].every((tg) => p.t.includes(tg));
      return coincide && tags;
    };
    const porCategoria = new Map<string, number>();
    let total = 0;
    for (const cat of MENU) {
      let n = 0;
      for (const it of cat.items ?? []) if (pasa(it)) n++;
      for (const g of cat.groups ?? []) for (const it of g.items) if (pasa(it)) n++;
      porCategoria.set(cat.id, n);
      total += n;
    }
    return { pasa, porCategoria, total };
  }, [q, etiquetas, pick]);

  /* --- Atajo "/" para saltar al buscador -------------------------------- */
  useEffect(() => {
    const alTeclado = (e: KeyboardEvent) => {
      const activo = document.activeElement;
      if (e.key !== "/" || activo === buscador.current) return;
      if (activo && ["INPUT", "TEXTAREA"].includes(activo.tagName)) return;
      e.preventDefault();
      document.getElementById("carta")?.scrollIntoView({ block: "start" });
      buscador.current?.focus();
    };
    document.addEventListener("keydown", alTeclado);
    return () => document.removeEventListener("keydown", alTeclado);
  }, []);

  /* --- Scrollspy: marca la categoría que se está mirando ----------------- */
  useEffect(() => {
    const secciones = MENU.map((c) => document.getElementById(`carta-${c.id}`)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (secciones.length === 0) return;

    const io = new IntersectionObserver(
      (entradas) => {
        const dentro = entradas.filter((e) => e.isIntersecting);
        if (dentro.length > 0) setActiva(dentro[0].target.id.replace("carta-", ""));
      },
      { rootMargin: "-140px 0px -70% 0px" },
    );
    secciones.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [idioma, filtrando]);

  /* --- Medición una sola vez -------------------------------------------- */
  useEffect(() => {
    const el = cuerpo.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !medido.current) {
          medido.current = true;
          medir("menu_visto");
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const alternarEtiqueta = (tag: Tag) => {
    setEtiquetas((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(tag)) siguiente.delete(tag);
      else siguiente.add(tag);
      return siguiente;
    });
  };

  const limpiar = () => {
    setEtiquetas(new Set());
    setConsulta("");
    buscador.current?.focus();
  };

  const resultado = !filtrando
    ? ""
    : visible.total === 0
      ? t("results_empty")
      : visible.total === 1
        ? t("results_found_one")
        : t("results_found_many", { n: visible.total });

  return (
    <section className="section" id="carta">
      <div className="wrap">
        <div className="menu-head reveal">
          <div>
            <div className="eyebrow">{t("menu_eyebrow")}</div>
            <h2 className="menu-title">{t("menu_title")}</h2>
          </div>
          <p className="menu-note">{t("menu_note")}</p>
        </div>

        {!cartaVerificada && (
          <p className="aviso reveal" role="note">
            <b>{t("menu_pending_label")}</b>
            <span>{t("menu_pending_text")}</span>
          </p>
        )}

        {/* Dos columnas: a la izquierda el rail y los filtros; a la derecha,
            la carta sola, para que se lea como una carta y no como una app. */}
        <div className="menu-layout">
          <aside className="menu-aside">
            <nav className="cat-rail" aria-label={t("menu_catrail_aria")}>
              {MENU.map((cat) => {
                const apagada = filtrando && (visible.porCategoria.get(cat.id) ?? 0) === 0;
                return (
                  <a
                    key={cat.id}
                    href={`#carta-${cat.id}`}
                    aria-current={activa === cat.id ? "true" : undefined}
                    className={apagada ? "is-dimmed" : undefined}
                  >
                    {pick(cat.label, cat.labelEn)}
                  </a>
                );
              })}
            </nav>

            <div className="menu-tools">
              <div className="menu-search">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
                <label htmlFor="buscador-carta" className="visually-hidden">
                  {t("menu_search_label")}
                </label>
                <input
                  id="buscador-carta"
                  ref={buscador}
                  type="search"
                  value={consulta}
                  onChange={(e) => setConsulta(e.target.value)}
                  placeholder={t("menu_search_placeholder")}
                  autoComplete="off"
                />
                <span className="kbd" aria-hidden>
                  /
                </span>
              </div>

              <div className="menu-filters" role="group" aria-label={t("menu_filters_aria")}>
                {TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="filter-chip"
                    aria-pressed={etiquetas.has(tag)}
                    onClick={() => alternarEtiqueta(tag)}
                  >
                    {t(`tag_${tag}`)}
                  </button>
                ))}
                {filtrando && (
                  <button type="button" className="filter-chip filter-clear" onClick={limpiar}>
                    {t("menu_clear")}
                  </button>
                )}
              </div>

              <p className="menu-results" aria-live="polite">
                {resultado}
              </p>
            </div>
          </aside>

          <div className="menu-body" ref={cuerpo}>
            {MENU.map((cat) => (
              <SeccionCategoria
                key={cat.id}
                cat={cat}
                filtrando={filtrando}
                pasa={visible.pasa}
                consulta={q}
              />
            ))}
            {filtrando && visible.total === 0 && <p className="menu-empty">{t("results_empty")}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function SeccionCategoria({
  cat,
  filtrando,
  pasa,
  consulta,
}: {
  cat: Categoria;
  filtrando: boolean;
  pasa: (p: Plato) => boolean;
  consulta: string;
}) {
  const { t, pick } = useIdioma();

  // El menú cerrado no se filtra plato por plato: se oculta mientras se busca.
  if (cat.type === "set") {
    if (filtrando) return null;
    return (
      <section className="cat-section" id={`carta-${cat.id}`}>
        <h3 className="cat-head">{pick(cat.label, cat.labelEn)}</h3>
        <div className="menu-set">
          <div>
            <h3>{t("menu_set_subtitle")}</h3>
            <div className="set-note">{pick(cat.note ?? "", cat.noteEn)}</div>
            <div className="tag-cluster">
              <span>{t("tag_Brasas")}</span>
              <span>{t("tag_Compartir")}</span>
            </div>
          </div>
          <div>
            <div className="set-price">{cat.price}</div>
            <ul>
              {(pick(cat.options ?? [], cat.optionsEn) ?? []).map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    );
  }

  const sueltos = (cat.items ?? []).filter(pasa);
  const grupos = (cat.groups ?? [])
    .map((g) => ({ ...g, items: g.items.filter(pasa) }))
    .filter((g) => g.items.length > 0);

  if (filtrando && sueltos.length === 0 && grupos.length === 0) return null;

  return (
    <section className="cat-section" id={`carta-${cat.id}`}>
      <h3 className="cat-head">{pick(cat.label, cat.labelEn)}</h3>
      <div className="cat-items">
        {sueltos.map((it) => (
          <Fila key={it.n} plato={it} consulta={consulta} />
        ))}
        {grupos.map((g) => (
          <Grupo key={g.title} titulo={pick(g.title, g.titleEn)} items={g.items} consulta={consulta} />
        ))}
      </div>
    </section>
  );
}

function Grupo({
  titulo,
  items,
  consulta,
}: {
  titulo: string;
  items: Plato[];
  consulta: string;
}) {
  return (
    <>
      <div className="group-title">{titulo}</div>
      {items.map((it) => (
        <Fila key={it.n} plato={it} consulta={consulta} />
      ))}
    </>
  );
}

function Fila({ plato, consulta }: { plato: Plato; consulta: string }) {
  const { t, pick } = useIdioma();
  const nombre = pick(plato.n, plato.nEn);

  return (
    <div className="item-row">
      <div className="item-main">
        <div className="item-name">
          <Resaltado texto={nombre} consulta={consulta} />
        </div>
        {plato.t.length > 0 && (
          <div className="item-tags">
            {plato.t.map((tag) => (
              <span key={tag}>{t(`tag_${tag}`)}</span>
            ))}
          </div>
        )}
      </div>
      {plato.p && <div className="item-price">$ {plato.p}</div>}
    </div>
  );
}

/** Marca la parte del nombre que coincide con la búsqueda, sin perder acentos. */
function Resaltado({ texto, consulta }: { texto: string; consulta: string }) {
  if (!consulta) return <>{texto}</>;
  const i = norm(texto).indexOf(consulta);
  if (i === -1) return <>{texto}</>;
  return (
    <>
      {texto.slice(0, i)}
      <mark>{texto.slice(i, i + consulta.length)}</mark>
      {texto.slice(i + consulta.length)}
    </>
  );
}
