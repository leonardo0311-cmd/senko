import { contact } from "../../data/site";
import { whatsappUrl } from "../../lib/utils";
import { WhatsAppIcon } from "../ui/icons";

/** Botón flotante de WhatsApp. Sólo aparece si hay un número cargado en site.ts. */
export default function WhatsAppFloat() {
  if (!contact.whatsapp) return null;
  return (
    <a
      href={whatsappUrl(contact.whatsapp, "Hola RINDE, quiero hablar de un proyecto.")}
      target="_blank"
      rel="noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-ink shadow-xl transition-transform hover:scale-105"
    >
      <WhatsAppIcon size={28} />
    </a>
  );
}
