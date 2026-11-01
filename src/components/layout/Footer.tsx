import { Link } from "react-router-dom";
import Logo from "../ui/Logo";
import { brand, contact } from "../../data/site";
import { areas } from "../../data/areas";
import { InstagramIcon, WhatsAppIcon } from "../ui/icons";
import { whatsappUrl } from "../../lib/utils";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t hairline bg-ink pt-20">
      <div className="container-x">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="display text-[clamp(2rem,4vw,3.2rem)]">
              Construimos marcas.
              <br />
              Potenciamos artistas.
              <br />
              <span className="accent text-signal-soft">Conectamos experiencias.</span>
            </p>
          </div>
          <div className="md:col-span-3 md:col-start-7">
            <p className="label mb-4 text-ash-dark">Áreas</p>
            <ul className="space-y-2">
              {areas.map((a) => (
                <li key={a.id}>
                  <Link to={a.path} className="text-paper/85 transition-colors hover:text-signal">
                    {a.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-3">
            <p className="label mb-4 text-ash-dark">Agencia</p>
            <ul className="space-y-2">
              <li><Link to="/proyectos" className="text-paper/85 hover:text-signal">Proyectos</Link></li>
              <li><Link to="/nosotros" className="text-paper/85 hover:text-signal">Nosotros</Link></li>
              <li><Link to="/contacto" className="text-paper/85 hover:text-signal">Contacto</Link></li>
              <li>
                <a href={contact.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-paper/85 hover:text-signal">
                  <InstagramIcon size={16} /> {contact.instagramHandle}
                </a>
              </li>
              {contact.whatsapp && (
                <li>
                  <a href={whatsappUrl(contact.whatsapp)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-paper/85 hover:text-signal">
                    <WhatsAppIcon size={16} /> WhatsApp
                  </a>
                </li>
              )}
              {contact.email && (
                <li><a href={`mailto:${contact.email}`} className="text-paper/85 hover:text-signal">{contact.email}</a></li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="container-x mt-20 select-none" aria-hidden="true">
        <Logo size="xl" className="text-paper/[0.06]" />
      </div>

      <div className={`container-x flex flex-col gap-2 border-t hairline pt-6 text-sm text-ash-dark sm:flex-row sm:justify-between ${contact.whatsapp ? "pb-24" : "pb-6"}`}>
        <span>© {new Date().getFullYear()} {brand.name.toUpperCase()} — {brand.tagline}</span>
        <span>{brand.city}</span>
      </div>
    </footer>
  );
}
