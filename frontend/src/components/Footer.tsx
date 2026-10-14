import { Link } from "react-router-dom";
import { appendRefToUrl } from "@/lib/referral";
import { waLink, WHATSAPP_DISPLAY, CONTACT_EMAIL } from "@/lib/contact";

export default function Footer() {
  return (
    <footer className="border-t border-line-soft bg-surface/40">
      <div className="container-x flex flex-col gap-6 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <div className="flex items-center gap-2">
            <span className="glow-dot inline-block h-2 w-2 rounded-full bg-accent" />
            <span className="mono text-sm font-semibold text-white">
              sorteo<span className="text-accent">.novalink</span>
            </span>
          </div>
          <p className="mt-3 text-sm text-mute">
            Rifas en línea con boletos digitales, sorteos en vivo y verificación
            al instante.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div>
            <p className="mono text-xs uppercase tracking-widest text-faint">
              Explora
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link className="text-mute hover:text-white" to={appendRefToUrl("/rifas")}>Rifas</Link></li>
              <li><Link className="text-mute hover:text-white" to={appendRefToUrl("/ganadores")}>Ganadores</Link></li>
              <li><Link className="text-mute hover:text-white" to={appendRefToUrl("/verificar")}>Verificar boleto</Link></li>
            </ul>
          </div>
          <div>
            <p className="mono text-xs uppercase tracking-widest text-faint">
              Legal
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link className="text-mute hover:text-white" to={appendRefToUrl("/terminos")}>Términos</Link></li>
              <li><Link className="text-mute hover:text-white" to={appendRefToUrl("/privacidad")}>Privacidad</Link></li>
              <li><Link className="text-mute hover:text-white" to={appendRefToUrl("/juego-responsable")}>Juego responsable +18</Link></li>
            </ul>
          </div>
          <div>
            <p className="mono text-xs uppercase tracking-widest text-faint">
              Contacto
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href={waLink("Hola, tengo una pregunta sobre la rifa.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mute hover:text-white"
                >
                  WhatsApp {WHATSAPP_DISPLAY}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-mute hover:text-white"
                >
                  {CONTACT_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-line-soft py-5">
        <div className="container-x flex flex-col items-center justify-between gap-2 text-xs text-faint sm:flex-row">
          <span>© {new Date().getFullYear()} NovaLink. Todos los derechos reservados.</span>
          <span className="mono">+18 · Juega con responsabilidad</span>
        </div>
      </div>
    </footer>
  );
}
