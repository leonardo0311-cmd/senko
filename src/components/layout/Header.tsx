import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import Logo from "../ui/Logo";
import { contact, nav } from "../../data/site";
import { cn } from "../../lib/utils";
import { InstagramIcon } from "../ui/icons";

/** Páginas que arrancan con una sección oscura: el encabezado se aclara mientras está arriba de todo. */
const darkTop = ["/contenido", "/artist-marketing"];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const { pathname, hash } = useLocation();
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cerrar menús al navegar.
  useEffect(() => {
    setOpen(false);
    setDropdown(false);
  }, [pathname, hash]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  useEffect(() => {
    if (!dropdown) return;
    const onDown = (e: MouseEvent) => {
      if (!dropRef.current?.contains(e.target as Node)) setDropdown(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDropdown(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [dropdown]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500",
        // Con el menú abierto no se usa backdrop-filter: crearía un contenedor para el panel "fixed".
        open
          ? "border-b hairline bg-canvas"
          : scrolled
            ? "border-b hairline bg-canvas/85 backdrop-blur-md"
            : cn("border-b border-transparent", darkTop.includes(pathname) && "header-on-dark"),
      )}
    >
      <div className="container-x flex h-[var(--header-h)] items-center justify-between gap-6">
        <Link to="/" aria-label="RINDE — inicio" className="relative z-10">
          <Logo size="sm" className="text-brand" />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
          {nav.map((item) =>
            item.children ? (
              <div key={item.label} className="relative" ref={dropRef}>
                <button
                  type="button"
                  aria-expanded={dropdown}
                  aria-haspopup="true"
                  onClick={() => setDropdown((v) => !v)}
                  className="flex items-center gap-1 rounded-full px-4 py-2 text-sm text-fg/80 transition-colors hover:text-fg"
                >
                  {item.label}
                  <ChevronDown size={15} className={cn("transition-transform", dropdown && "rotate-180")} aria-hidden="true" />
                </button>
                <AnimatePresence>
                  {dropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-1/2 top-full mt-3 w-80 -translate-x-1/2 rounded-2xl border hairline bg-surface p-2 shadow-2xl"
                    >
                      {item.children.map((c) => (
                        <Link key={c.to} to={c.to} className="block rounded-xl px-4 py-3 transition-colors hover:bg-surface-2">
                          <span className="block text-[0.95rem] font-semibold">{c.label}</span>
                          <span className="block text-sm text-muted">{c.hint}</span>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  cn("rounded-full px-4 py-2 text-sm transition-colors", isActive ? "text-fg" : "text-fg/80 hover:text-fg")
                }
              >
                {item.label}
              </NavLink>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/contacto"
            className="hidden min-h-11 items-center rounded-full bg-brand px-5 text-sm font-semibold text-canvas transition-colors hover:bg-fg sm:inline-flex"
          >
            Trabajemos juntos
          </Link>
          <button
            type="button"
            className="relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border hairline lg:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            aria-controls="menu-movil"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="menu-movil"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-x-0 bottom-0 top-[var(--header-h)] overflow-y-auto bg-canvas lg:hidden"
          >
            <nav aria-label="Menú" className="container-x flex flex-col gap-1 py-8">
              {nav
                .flatMap<{ label: string; to: string }>((i) =>
                  i.children ? i.children.filter((c) => c.to !== "/artist-marketing") : [{ label: i.label, to: i.to }],
                )
                .map((item, i) => (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * i, duration: 0.4 }}
                  >
                    <Link to={item.to} className="display block border-b hairline py-4 text-[2.4rem]">
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              <div className="mt-8 flex flex-col gap-4">
                <Link
                  to="/contacto"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand px-6 font-semibold text-canvas"
                >
                  Trabajemos juntos
                </Link>
                <a href={contact.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-muted">
                  <InstagramIcon size={18} /> {contact.instagramHandle}
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
