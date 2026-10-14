import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatCents } from "@/lib/format";
import { api } from "@/lib/api";
import { getReferralCode, appendRefToUrl } from "@/lib/referral";
import { waLink, WHATSAPP_DISPLAY } from "@/lib/contact";

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

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB

export default function BuyForm({
  rifa,
  referralCode,
}: {
  rifa: RifaProps;
  referralCode?: string;
}) {
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

  // Referido: se autocompleta desde el link (?ref=CODIGO). Si vino del link se
  // muestra fijo (no editable) para que no se dañe; si no, se puede escribir.
  const [refCode, setRefCode] = useState(() => referralCode || getReferralCode());
  const [refFromLink] = useState(() => Boolean(referralCode || getReferralCode()));

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] || null;
    if (selected && selected.size > MAX_FILE_SIZE) {
      setError("El comprobante es demasiado grande (máximo 8 MB)");
      setFile(null);
      e.target.value = "";
      return;
    }
    setError("");
    setFile(selected);
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
    if (file.size > MAX_FILE_SIZE) {
      setError("El comprobante es demasiado grande (máximo 8 MB)");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("rifaId", String(rifa.id));
      fd.append("name", name.trim());
      fd.append("phone", phone.trim());
      fd.append("email", email.trim());
      fd.append("quantity", String(qty));
      fd.append("receipt", file);

      const effectiveRef = refCode.trim();
      if (effectiveRef) {
        fd.append("ref", effectiveRef);
      }

      const data = await api<{ order: { code: string }; tickets: string[] }>("/api/participar", {
        method: "POST",
        body: fd,
      });

      setResult({ code: data.order.code, numbers: data.tickets });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err.message || "No se pudo conectar. Intenta de nuevo.");
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
            <h3 className="text-lg font-bold text-white">
              ¡Listo! Ya apartamos tus boletos 🎉
            </h3>
            <p className="text-sm text-mute">
              {email.trim()
                ? "Te enviamos tus números por correo. Estos son:"
                : "Estos son tus números:"}
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
          Se activan automáticamente en cuanto validemos tu transferencia. Te
          avisamos por correo.
        </p>

        <p className="mt-3 text-center text-sm text-mute">
          ¿Alguna duda con tu compra?{" "}
          <a
            href={waLink("Hola, tengo una duda sobre mi compra de boletos.")}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Escríbenos por WhatsApp
          </a>
        </p>

        <Link
          to={appendRefToUrl(`/rifa/${rifa.slug}`)}
          onClick={() => {
            setResult(null);
            setFile(null);
          }}
          className="btn-ghost mt-6 w-full"
        >
          Comprar más boletos
        </Link>
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
              <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg bg-white p-1">
                <img
                  src={`/bancos/${b.id}.jpg`}
                  alt={b.name}
                  className="h-full w-full object-contain"
                />
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
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md bg-white p-0.5">
                  <img
                    src={`/bancos/${bank.id}.jpg`}
                    alt={bank.name}
                    className="h-full w-full object-contain"
                  />
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
          <label className="label">Código de referido</label>
          {refFromLink ? (
            <>
              <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 px-4 py-2.5">
                <span className="mono text-sm font-semibold text-accent">
                  {refCode}
                </span>
                <span className="text-[11px] uppercase tracking-wide text-faint">
                  de tu link
                </span>
              </div>
              <p className="mt-1 text-xs text-faint">
                Tu compra contará para quien te invitó.
              </p>
            </>
          ) : (
            <input
              className="input mono uppercase"
              value={refCode}
              onChange={(e) => setRefCode(e.target.value.toUpperCase())}
              placeholder="Opcional — código de quien te invitó"
            />
          )}
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
              onChange={handleFileChange}
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

      <p className="mt-3 text-center text-xs text-mute">
        ¿Dudas antes de transferir?{" "}
        <a
          href={waLink("Hola, tengo una duda antes de hacer la transferencia.")}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          Escríbenos por WhatsApp ({WHATSAPP_DISPLAY})
        </a>
      </p>
    </form>
  );
}
