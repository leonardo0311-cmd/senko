import { Suspense, lazy } from "react";
import { BrowserRouter, MemoryRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ScrollManager from "./components/layout/ScrollManager";
import WhatsAppFloat from "./components/layout/WhatsAppFloat";
import Grain from "./components/ui/Grain";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import { areas } from "./data/areas";

// Las páginas internas viajan en su propio chunk.
const AreaPage = lazy(() => import("./pages/AreaPage"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectPage = lazy(() => import("./pages/ProjectPage"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));

/** Compatibilidad con los enlaces de la versión anterior (/proyecto/:slug). */
function LegacyProject() {
  const { slug } = useParams();
  return <Navigate to={`/proyectos/${slug}`} replace />;
}

// Para vistas previas embebidas (sin control de la URL) se puede compilar con VITE_MEMORY_ROUTER=1.
const Router = import.meta.env.VITE_MEMORY_ROUTER ? MemoryRouter : BrowserRouter;

export default function App() {
  return (
    <Router>
      <MotionConfig reducedMotion="user">
        <ScrollManager />
        <Grain />

        <a
          href="#contenido"
          className="label sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-full focus:bg-signal focus:px-5 focus:py-3 focus:text-ink"
        >
          Saltar al contenido
        </a>

        <Header />

        <main id="contenido">
          <Suspense fallback={<div className="min-h-[80svh] bg-ink" />}>
            <Routes>
              <Route path="/" element={<Home />} />
              {areas.map((a) => (
                <Route key={a.id} path={a.path} element={<AreaPage area={a} />} />
              ))}
              <Route path="/proyectos" element={<Projects />} />
              <Route path="/proyectos/:slug" element={<ProjectPage />} />
              <Route path="/proyecto/:slug" element={<LegacyProject />} />
              <Route path="/nosotros" element={<About />} />
              <Route path="/contacto" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>

        <Footer />
        <WhatsAppFloat />
      </MotionConfig>
    </Router>
  );
}
