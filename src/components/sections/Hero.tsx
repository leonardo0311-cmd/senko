import { motion } from "framer-motion";
import { hero } from "../../data/site";
import MaskText from "../ui/MaskText";
import CTA from "../ui/CTA";
import StageLights from "../ui/StageLights";
import { useIntroDone } from "../../lib/intro";

export default function Hero() {
  const ready = useIntroDone();
  return (
    <section id="inicio" className="relative flex min-h-[100svh] items-end overflow-hidden pb-14 pt-32 sm:pb-20">
      {hero.video ? (
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-60"
          src={hero.video}
          poster={hero.poster ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
      ) : (
        <StageLights />
      )}

      <div className="container-x relative">
        <motion.p
          className="label mb-6 text-muted"
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : undefined}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          {hero.eyebrow}
        </motion.p>

        <MaskText
          as="h1"
          onMount
          delay={0.15}
          lines={hero.lines}
          className="text-[clamp(2.5rem,10.4vw,10rem)]"
        />

        <div className="mt-10 grid gap-8 md:grid-cols-12 md:items-end">
          <motion.p
            className="max-w-xl text-lg leading-relaxed text-fg/80 md:col-span-6 md:text-xl"
            initial={{ opacity: 0, y: 16 }}
            animate={ready ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.8, delay: 0.55 }}
          >
            {hero.support}
          </motion.p>
          <motion.div
            className="flex flex-col gap-3 sm:flex-row md:col-span-6 md:justify-end"
            initial={{ opacity: 0, y: 16 }}
            animate={ready ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <CTA to={hero.secondaryCta.to} variant="ghost">
              {hero.secondaryCta.label}
            </CTA>
            <CTA to={hero.primaryCta.to}>{hero.primaryCta.label}</CTA>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
