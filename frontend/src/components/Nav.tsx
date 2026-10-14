import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { appendRefToUrl } from "@/lib/referral";

const links = [
  { href: "/rifas", label: "Rifas" },
  { href: "/#como-jugar", label: "Cómo jugar" },
  { href: "/ganadores", label: "Ganadores" },
  { href: "/verificar", label: "Verificar boleto" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <header className="sticky top-0 z-50 border-b border-line-soft bg-bg/80 backdrop-blur-xl">
      <div className="container-x flex h-16 items-center justify-between">
        <Link to={appendRefToUrl("/")} className="flex items-center gap-2">
          <span className="glow-dot inline-block h-2.5 w-2.5 rounded-full bg-accent" />
          <span className="mono text-sm font-semibold tracking-tight text-white">
            sorteo<span className="text-accent">.novalink</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              to={appendRefToUrl(l.href)}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                pathname === l.href
                  ? "text-white"
                  : "text-mute hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link to={appendRefToUrl("/rifas")} className="btn-primary">
            Participar
          </Link>
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menú"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-line-soft bg-bg px-4 pb-4 md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              to={appendRefToUrl(l.href)}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-3 text-sm text-mute hover:bg-surface2 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
          <Link
            to={appendRefToUrl("/rifas")}
            onClick={() => setOpen(false)}
            className="btn-primary mt-2 w-full"
          >
            Participar
          </Link>
        </div>
      )}
    </header>
  );
}
