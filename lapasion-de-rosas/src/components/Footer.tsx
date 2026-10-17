"use client";

import { contacto, marca, navegacion, redes, siVerificado } from "@content/site";
import { useIdioma } from "@/lib/idioma";

export function Footer() {
  const { t } = useIdioma();
  const ig = siVerificado(redes.instagram);
  const telefono = siVerificado(contacto.telefono);
  const email = siVerificado(contacto.email);
  const direccion = siVerificado(contacto.direccion);
  const anio = new Date().getFullYear();

  return (
    <footer className="site-footer" id="contacto">
      <div className="wrap">
        <div className="footer-top">
          <div className="footer-brand">
            <a href="#inicio" className="brand-word" aria-label={marca.nombre}>
              La Pasión <em>de Rosas</em>
            </a>
            <p className="footer-tag">{t("footer_tag")}</p>
            {ig && (
              <div className="footer-social">
                <a href={ig.url} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  IG
                </a>
              </div>
            )}
          </div>

          <div className="footer-col">
            <h3>{t("footer_nav_heading")}</h3>
            <ul>
              {navegacion.map((n) => (
                <li key={n.id}>
                  <a href={`#${n.id}`}>{t(n.clave)}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h3>{t("nav_locations")}</h3>
            <ul>
              <li>
                <address>{direccion ?? t("loc_pending_addr")}</address>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>{t("footer_contact_heading")}</h3>
            <ul>
              {ig && (
                <li>
                  <a href={ig.url} target="_blank" rel="noopener noreferrer">
                    @{ig.usuario}
                  </a>
                </li>
              )}
              {telefono && (
                <li>
                  <a href={`tel:${telefono.replace(/\s/g, "")}`}>{telefono}</a>
                </li>
              )}
              {email && (
                <li>
                  <a href={`mailto:${email}`}>{email}</a>
                </li>
              )}
              <li>
                <address>
                  {siVerificado(contacto.whatsapp)
                    ? t("footer_contact_wa")
                    : t("footer_contact_pending")}
                </address>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {anio} {t("footer_bottom1")}
          </span>
          <span>{t("footer_bottom2")}</span>
        </div>
      </div>
    </footer>
  );
}
