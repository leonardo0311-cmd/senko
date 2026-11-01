import { marquee } from "../../data/site";

export default function Marquee() {
  const items = [...marquee, ...marquee];
  return (
    <div className="theme-wine relative overflow-hidden py-5" aria-hidden="true">
      <div className="marquee-track">
        {items.map((item, i) => (
          <span key={i} className="display flex shrink-0 items-center gap-8 pr-8 text-[clamp(1.6rem,3.4vw,2.8rem)] text-fg/90">
            {item}
            <span className="h-2.5 w-2.5 rounded-full bg-sand" />
          </span>
        ))}
      </div>
    </div>
  );
}
