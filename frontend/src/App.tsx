import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useLocation } from "react-router-dom";
import Shell from "@/components/Shell";
import { saveReferralCode } from "@/lib/referral";

import HomePage from "@/pages/Home";
import RifasPage from "@/pages/Rifas";
import RifaDetallePage from "@/pages/RifaDetalle";
import VerificarPage from "@/pages/Verificar";
import GanadoresPage from "@/pages/Ganadores";
import VendedorPage from "@/pages/Vendedor";
import AdminLoginPage from "@/pages/AdminLogin";
import AdminPage from "@/pages/Admin";
import TerminosPage from "@/pages/Terminos";
import PrivacidadPage from "@/pages/Privacidad";
import JuegoResponsablePage from "@/pages/JuegoResponsable";

function ReferralTracker() {
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      saveReferralCode(ref);
    }
  }, [searchParams]);
  return null;
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    } else {
      const el = document.getElementById(hash.replace("#", ""));
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ReferralTracker />
      <ScrollToTop />
      <Shell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rifas" element={<RifasPage />} />
          <Route path="/rifa/:slug" element={<RifaDetallePage />} />
          <Route path="/verificar" element={<VerificarPage />} />
          <Route path="/ganadores" element={<GanadoresPage />} />
          <Route path="/vendedor" element={<VendedorPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/terminos" element={<TerminosPage />} />
          <Route path="/privacidad" element={<PrivacidadPage />} />
          <Route path="/juego-responsable" element={<JuegoResponsablePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}
