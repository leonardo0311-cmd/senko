import { closing } from "../../data/site";
import MaskText, { titleLines } from "../ui/MaskText";
import CTA from "../ui/CTA";
import StageLights from "../ui/StageLights";

export default function Closing({
  title = closing.title,
  accent = closing.titleAccent,
  cta = closing.cta,
}: {
  title?: string;
  accent?: string;
  cta?: { label: string; to: string };
}) {
  return (
    <section className="relative overflow-hidden border-t hairline py-28 sm:py-40">
      <StageLights className="opacity-60" />
      <div className="container-x relative flex flex-col items-start gap-10">
        <MaskText lines={titleLines(title, accent)} className="max-w-[16ch] text-[clamp(2.8rem,8vw,7.5rem)]" />
        <CTA to={cta.to} className="text-base">
          {cta.label}
        </CTA>
      </div>
    </section>
  );
}
