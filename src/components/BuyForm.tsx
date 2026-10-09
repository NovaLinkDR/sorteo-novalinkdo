"use client";

import { useMemo, useState } from "react";
import { formatCents, formatDate } from "@/lib/format";

interface RifaProps {
  id: number;
  slug: string;
  name: string;
  prize_name: string | null;
  ticket_price_cents: number;
  min_tickets: number;
  max_tickets_per_order: number;
  sorteo_date: string | null;
  sorteo_time: string | null;
  sorteo_place: string | null;
  draw_mechanic: string | null;
  stats: {
    ticketsSold: number;
    progress: number;
  };
}

const BANKS = [
  {
    id: "popular",
    name: "Popular",
    short: "P",
    type: "Cuenta de Ahorros",
    account: "822315958",
    beneficiary: "Israel Alberto De Leon Gonell",
    cedula: "40240512109",
    color: "#00A9E0",
  },
  {
    id: "apap",
    name: "APAP",
    short: "A",
    type: "Cuenta de Ahorros",
    account: "1036552675",
    beneficiary: "Israel Alberto De Leon Gonell",
    cedula: "40240512109",
    color: "#009B3A",
  },
  {
    id: "banreservas",
    name: "Banreservas",
    short: "BR",
    type: "Cuenta de Ahorros",
    account: "9609268547",
    beneficiary: "Israel Alberto De Leon Gonell",
    cedula: "40240512109",
    color: "#003DA5",
  },
  {
    id: "bhd",
    name: "BHD",
    short: "BHD",
    type: "Cuenta de Ahorros",
    account: "30438550020",
    beneficiary: "Kevin Randolph Bueno Santiago",
    cedula: "40200765119",
    color: "#F58220",
  },
  {
    id: "qik",
    name: "QIK",
    short: "QIK",
    type: "Cuenta de Ahorros",
    account: "1008517157",
    beneficiary: "Kevin Randolph Bueno Santiago",
    cedula: "40200765119",
    color: "#6C3FB5",
  },
];

export default function BuyForm({ rifa }: { rifa: RifaProps }) {
  const [qty, setQty] = useState(rifa.min_tickets);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    code: string;
    numbers: string[];
  } | null>(null);

  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const total = useMemo(() => qty * rifa.ticket_price_cents, [qty, rifa]);

  function clamp(v: number) {
    return Math.max(rifa.min_tickets, Math.min(rifa.max_tickets_per_order, v));
  }

  async function copyAccount(account: string) {
    try {
      await navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard no disponible
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (qty < rifa.min_tickets) {
      setError(`La compra mínima es de ${rifa.min_tickets} boletos.`);
      return;
    }
    if (!name.trim() || !phone.trim()) {
      setError("Nombre y teléfono son obligatorios.");
      return;
    }
    if (!file) {
      setError("Debes subir el comprobante de tu transferencia.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("rifaId", String(rifa.id));
      fd.append("name", name);
      fd.append("phone", phone);
      fd.append("email", email);
      fd.append("quantity", String(qty));
      fd.append("receipt", file);

      const res = await fetch("/api/participar", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ocurrió un error.");
      } else {
        setResult({ code: data.order.code, numbers: data.tickets });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="card border-accent/40 p-8 shadow-glow-soft">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
            ✓
          </span>
          <div>
            <h3 className="text-lg font-bold text-white">¡Compra registrada!</h3>
            <p className="text-sm text-mute">
              Tu orden quedó pendiente de confirmación de pago.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-line bg-surface2 p-4">
          <p className="mono text-xs uppercase tracking-widest text-faint">
            Código de orden
          </p>
          <p className="mono mt-1 text-lg font-bold text-accent">
            {result.code}
          </p>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-mute">Tus boletos:</p>
          <div className="flex flex-wrap gap-2">
            {result.numbers.map((n) => (
              <span
                key={n}
                className="mono rounded-md border border-line bg-surface2 px-3 py-1.5 text-sm text-white"
              >
                {n}
              </span>
            ))}
          </div>
        </div>

        <p className="mt-6 rounded-lg border border-accent/20 bg-accent/5 p-3 text-sm text-accent-bright">
          Una vez confirmemos tu transferencia, tus boletos quedarán activos.
          Recibirás la confirmación por WhatsApp.
        </p>

        <a href={`/rifa/${rifa.slug}`} className="btn-ghost mt-6 w-full">
          Comprar más boletos
        </a>
      </div>
    );
  }

  const bank = BANKS.find((b) => b.id === selectedBank);

  return (
    <form onSubmit={onSubmit} className="card p-6 sm:p-8">
      <h3 className="text-lg font-bold text-white">Completa tu compra</h3>
      <p className="mt-1 text-sm text-mute">
        Boleto a {formatCents(rifa.ticket_price_cents)} · Mínimo{" "}
        {rifa.min_tickets} boletos
      </p>

      {/* Cantidad */}
      <div className="mt-6">
        <label className="label">Cantidad de boletos</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQty((v) => clamp(v - 1))}
            className="btn h-11 w-11 border border-line bg-surface2 text-lg text-white hover:border-accent/60"
          >
            −
          </button>
          <input
            type="number"
            value={qty}
            min={rifa.min_tickets}
            max={rifa.max_tickets_per_order}
            onChange={(e) => setQty(clamp(Number(e.target.value) || 0))}
            className="mono input h-11 max-w-[120px] text-center text-lg font-bold"
          />
          <button
            type="button"
            onClick={() => setQty((v) => clamp(v + 1))}
            className="btn h-11 w-11 border border-line bg-surface2 text-lg text-white hover:border-accent/60"
          >
            +
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-lg border border-line bg-surface2 px-4 py-3">
          <span className="text-sm text-mute">Total a transferir</span>
          <span className="mono text-xl font-bold text-accent">
            {formatCents(total)}
          </span>
        </div>
      </div>

      {/* Instrucciones de transferencia */}
      <div className="mt-6">
        <label className="label">Instrucciones de transferencia</label>
        <p className="mb-3 text-xs text-mute">
          Elige un banco para ver los datos de la cuenta a donde debes
          transferir.
        </p>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {BANKS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelectedBank(b.id)}
              className={`flex flex-col items-center gap-2 rounded-lg border px-2 py-3 text-center transition-all ${
                selectedBank === b.id
                  ? "border-accent bg-accent/10"
                  : "border-line bg-surface2 hover:border-accent/40"
              }`}
            >
              <span
                className="mono flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: b.color }}
              >
                {b.short}
              </span>
              <span className="text-[11px] leading-tight text-white">
                {b.name}
              </span>
            </button>
          ))}
        </div>

        {bank ? (
          <div className="mt-3 rounded-lg border border-accent/30 bg-surface2 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="mono flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: bank.color }}
                >
                  {bank.short}
                </span>
                <span className="text-sm font-semibold text-white">
                  {bank.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => copyAccount(bank.account)}
                className="mono rounded-md border border-line bg-surface px-2.5 py-1 text-xs text-accent hover:border-accent/60"
              >
                {copied ? "✓ Copiado" : "Copiar"}
              </button>
            </div>

            <div className="mt-3 space-y-1.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-faint">{bank.type}</span>
                <span className="mono font-bold text-white">
                  {bank.account}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-faint">Beneficiario</span>
                <span className="text-right text-white">{bank.beneficiary}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-faint">Cédula</span>
                <span className="mono text-white">{bank.cedula}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-3 rounded-lg border border-line-soft bg-surface2 px-4 py-3 text-xs text-faint">
            Selecciona un banco para ver la cuenta y el beneficiario.
          </p>
        )}
      </div>

      {/* Datos */}
      <div className="mt-6 space-y-4">
        <div>
          <label className="label">Nombre completo *</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
          />
        </div>
        <div>
          <label className="label">Teléfono / WhatsApp *</label>
          <input
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="809-000-0000"
          />
        </div>
        <div>
          <label className="label">Correo electrónico</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
          />
        </div>
        <div>
          <label className="label">Comprobante de transferencia *</label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-surface2 px-4 py-8 text-center transition-colors hover:border-accent/50">
            {file ? (
              <span className="flex items-center gap-2 text-sm text-accent">
                <span>📎</span> {file.name}
              </span>
            ) : (
              <>
                <span className="text-2xl">⬆️</span>
                <span className="text-sm text-mute">
                  Haz clic para subir tu comprobante
                </span>
                <span className="text-xs text-faint">JPG, PNG o PDF</span>
              </>
            )}
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary mt-6 w-full py-3 text-base"
      >
        {loading ? "Enviando…" : "Confirmar compra"}
      </button>

      <p className="mt-4 text-center text-xs text-faint">
        Al participar confirmas que eres mayor de 18 años y aceptas las bases
        de la rifa.
      </p>
    </form>
  );
}
