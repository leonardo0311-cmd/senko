import { contact } from "../data/site";
import ContactForm from "../components/sections/ContactForm";
import MaskText, { titleLines } from "../components/ui/MaskText";
import SectionLabel from "../components/ui/SectionLabel";
import { InstagramIcon, WhatsAppIcon } from "../components/ui/icons";
import { whatsappUrl } from "../lib/utils";
import { useSeo } from "../lib/seo";

const next = [
  { name: "Te respondemos", text: `En ${contact.responseTime}, con una propuesta de día y horario.` },
  { name: "Primera conversación", text: "30 a 45 minutos para entender el proyecto, sin compromiso." },
  { name: "Propuesta a medida", text: "Diagnóstico y plan con honorarios y pauta por separado." },
];

export default function Contact() {
  useSeo({
    path: "/contacto",
    title: "Trabajemos juntos — Contacto | RINDE",
    description: "Contanos tu proyecto: artistas, managers, productoras, venues y marcas. Respondemos en 24 a 48 horas hábiles.",
  });
  return (
    <section className="pb-24 pt-36 sm:pt-44">
      <div className="container-x">
        <SectionLabel>Contacto</SectionLabel>
        <MaskText as="h1" onMount lines={titleLines("Trabajemos", "juntos.")} className="mt-8 text-[clamp(3rem,10vw,9rem)]" />
        <p className="mt-6 max-w-xl text-lg text-fg/75">
          Contanos en qué estás. Puede ser un lanzamiento, una fecha, un espacio o una idea que todavía no tiene forma.
        </p>

        <div className="mt-16 grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <ContactForm />
          </div>

          <aside className="space-y-10 lg:col-span-4 lg:col-start-9">
            <div>
              <p className="label text-muted">¿Preferís hablar directo?</p>
              <div className="mt-4 flex flex-col gap-3">
                {contact.whatsapp && (
                  <a
                    href={whatsappUrl(contact.whatsapp, "Hola RINDE, quiero hablar de un proyecto.")}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center gap-3 rounded-full bg-[#25d366] px-5 font-semibold text-ink"
                  >
                    <WhatsAppIcon size={20} /> Escribinos por WhatsApp
                  </a>
                )}
                {contact.whatsapp && <p className="-mt-1 pl-5 text-sm text-muted">{contact.whatsappDisplay}</p>}
                <a
                  href={contact.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center gap-3 rounded-full border border-fg/25 px-5 font-semibold hover:border-fg"
                >
                  <InstagramIcon size={20} /> {contact.instagramHandle}
                </a>
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="text-fg/85 underline underline-offset-4 hover:text-brand">
                    {contact.email}
                  </a>
                )}
              </div>
            </div>

            <div>
              <p className="label text-muted">Qué pasa después</p>
              <ol className="mt-4">
                {next.map((n, i) => (
                  <li key={n.name} className="flex gap-4 border-b hairline py-4">
                    <span className="label pt-1 text-brand">0{i + 1}</span>
                    <span>
                      <span className="block font-semibold">{n.name}</span>
                      <span className="text-[0.95rem] text-muted">{n.text}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
