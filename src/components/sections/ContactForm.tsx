import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, Copy } from "lucide-react";
import { contact } from "../../data/site";
import type { AreaId } from "../../data/areas";
import { whatsappUrl } from "../../lib/utils";
import { InstagramIcon, WhatsAppIcon } from "../ui/icons";

export const roles = [
  "Artista",
  "Manager o equipo de un artista",
  "Sello o discográfica",
  "Productora, evento o festival",
  "Boliche, bar o venue",
  "Marca o empresa",
  "Otro",
];

export const projectTypes = [
  "Campaña de lanzamiento (single, EP, videoclip)",
  "Desarrollo integral de un artista",
  "Comunicación y convocatoria de un espacio",
  "Campaña de un evento o festival",
  "Acción o campaña de marca",
  "Producción audiovisual",
  "Todavía no lo tengo claro",
];

const presets: Record<AreaId, { role: string; type: string }> = {
  artista: { role: roles[1], type: projectTypes[0] },
  venue: { role: roles[4], type: projectTypes[2] },
  evento: { role: roles[3], type: projectTypes[3] },
  marca: { role: roles[5], type: projectTypes[4] },
};

type Status = "idle" | "sending" | "sent" | "error" | "manual" | "whatsapp";

export default function ContactForm() {
  const [params] = useSearchParams();
  const preset = presets[params.get("tipo") as AreaId] as { role: string; type: string } | undefined;
  const [status, setStatus] = useState<Status>("idle");
  const [manualText, setManualText] = useState("");
  const [waLink, setWaLink] = useState("");
  const [copied, setCopied] = useState(false);

  const defaults = useMemo(() => ({ role: preset?.role ?? "", type: preset?.type ?? "" }), [preset]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    if (data._gotcha) return; // spam

    const text = [
      `Hola RINDE, soy ${data.nombre}.`,
      data.proyecto && `Proyecto: ${data.proyecto}`,
      `Rol: ${data.rol}`,
      `Tipo de proyecto: ${data.tipo}`,
      data.redes && `Instagram / web: ${data.redes}`,
      `Email: ${data.email}`,
      "",
      data.mensaje,
    ]
      .filter((l) => l !== undefined && l !== "")
      .join("\n");

    if (contact.endpoint) {
      setStatus("sending");
      try {
        const res = await fetch(contact.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(String(res.status));
        setStatus("sent");
        form.reset();
      } catch {
        setStatus("error");
        setManualText(text);
      }
      return;
    }

    // Sin endpoint configurado: no se simula un envío. Se abre un canal real con el mensaje armado.
    if (contact.whatsapp) {
      const url = whatsappUrl(contact.whatsapp, text);
      setWaLink(url);
      setStatus("whatsapp");
      // Si el navegador bloquea la ventana nueva, queda el botón del aviso para abrirlo a mano.
      window.open(url, "_blank", "noopener");
      return;
    }
    if (contact.email) {
      window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(
        `Consulta — ${data.proyecto || data.nombre}`,
      )}&body=${encodeURIComponent(text)}`;
      return;
    }
    setManualText(text);
    setStatus("manual");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(manualText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* el usuario puede seleccionar el texto a mano */
    }
  }

  if (status === "sent") {
    return (
      <div role="status" className="rounded-2xl border border-signal/40 bg-signal/[0.06] p-8">
        <p className="display text-[2.4rem]">Recibimos tu consulta.</p>
        <p className="mt-3 text-lg text-paper/80">
          Te respondemos en {contact.responseTime} para coordinar una primera conversación.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5" noValidate={false}>
      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nombre" htmlFor="nombre">
          <input id="nombre" name="nombre" required autoComplete="name" className="field" />
        </Field>
        <Field label="Artista, empresa o proyecto" htmlFor="proyecto" optional>
          <input id="proyecto" name="proyecto" autoComplete="organization" className="field" />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email" htmlFor="email">
          <input id="email" name="email" type="email" required autoComplete="email" className="field" />
        </Field>
        <Field label="Instagram o sitio web" htmlFor="redes" optional>
          <input id="redes" name="redes" placeholder="@usuario o https://" className="field" />
        </Field>
      </div>

      <div className="grid gap-5">
        <Field label="¿Cuál es tu rol?" htmlFor="rol">
          <select id="rol" name="rol" required defaultValue={defaults.role} key={`r-${defaults.role}`} className="field">
            <option value="" disabled>
              Elegí una opción
            </option>
            {roles.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field label="¿Qué tipo de proyecto querés desarrollar?" htmlFor="tipo">
          <select id="tipo" name="tipo" required defaultValue={defaults.type} key={`t-${defaults.type}`} className="field">
            <option value="" disabled>
              Elegí una opción
            </option>
            {projectTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Contanos en qué estás" htmlFor="mensaje">
        <textarea
          id="mensaje"
          name="mensaje"
          required
          rows={5}
          placeholder="Qué querés lograr, fechas o lanzamientos próximos, y cualquier dato que nos ayude a entender el proyecto."
          className="field resize-y"
        />
      </Field>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ash">Respondemos en {contact.responseTime}.</p>
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-signal px-7 font-semibold text-ink transition-colors hover:bg-paper disabled:opacity-60"
        >
          {status === "sending" ? "Enviando…" : !contact.endpoint && contact.whatsapp ? "Enviar por WhatsApp" : "Enviar consulta"}
        </button>
      </div>

      {status === "whatsapp" && (
        <div role="status" className="rounded-2xl border border-[#25d366]/40 bg-[#25d366]/[0.06] p-6">
          <p className="font-semibold">Abrimos WhatsApp con tu mensaje listo. Sólo falta que lo envíes desde ahí.</p>
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#25d366] px-5 text-sm font-semibold text-ink"
          >
            <WhatsAppIcon size={16} /> ¿No se abrió? Abrir WhatsApp
          </a>
        </div>
      )}

      {(status === "manual" || status === "error") && (
        <div role="alert" className="rounded-2xl border hairline bg-graphite p-6">
          <p className="font-semibold">
            {status === "error"
              ? "No pudimos enviar el formulario. Mandanos el mensaje por Instagram:"
              : "Mandanos este mensaje por Instagram y te respondemos por ahí:"}
          </p>
          <pre className="mt-4 max-h-52 overflow-auto whitespace-pre-wrap rounded-xl bg-ink p-4 font-sans text-sm text-paper/85">
            {manualText}
          </pre>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={copy}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-paper/25 px-5 text-sm font-semibold hover:border-paper"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copiado" : "Copiar mensaje"}
            </button>
            <a
              href={contact.instagram}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-paper px-5 text-sm font-semibold text-ink hover:bg-signal"
            >
              <InstagramIcon size={16} /> Abrir {contact.instagramHandle}
            </a>
          </div>
        </div>
      )}
    </form>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-paper/85">
        {label} {optional && <span className="text-ash-dark">(opcional)</span>}
      </label>
      {children}
    </div>
  );
}
