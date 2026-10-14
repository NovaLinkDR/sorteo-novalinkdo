import { Link } from "react-router-dom";
import { formatCents, formatDate } from "@/lib/format";
import { appendRefToUrl } from "@/lib/referral";
import { assetUrl } from "@/lib/api";

export interface Rifa {
  id: number;
  slug: string;
  name: string;
  tagline?: string | null;
  description?: string | null;
  prize_name?: string | null;
  prize_image?: string | null;
  ticket_price_cents: number;
  min_tickets: number;
  max_tickets_per_order: number;
  total_tickets: number;
  sorteo_date?: string | null;
  sorteo_time?: string | null;
  sorteo_place?: string | null;
  sorteo_note?: string | null;
  draw_mechanic?: string | null;
  status: string;
}

export interface RifaStats {
  ticketsSold: number;
  revenueCents?: number;
  revenueConfirmedCents?: number;
  ordersCount?: number;
  progress: number;
}

export default function RifaCard({
  rifa,
  stats,
}: {
  rifa: Rifa;
  stats: RifaStats;
}) {
  const pct = Math.round((stats.progress || 0) * 100);
  const finalized = rifa.status === "finalizada";

  return (
    <Link
      to={appendRefToUrl(`/rifa/${rifa.slug}`)}
      className="card group flex flex-col overflow-hidden transition-all hover:border-accent/40 hover:shadow-glow-soft"
    >
      {/* Imagen del premio */}
      <div className="relative aspect-square w-full overflow-hidden border-b border-line-soft bg-surface2/60">
        {rifa.prize_image ? (
          <img
            src={assetUrl(rifa.prize_image)}
            alt={rifa.prize_name || rifa.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center">
            <div className="bg-grid absolute inset-0 opacity-60" />
            <span className="mono relative px-4 text-center text-xs uppercase tracking-widest text-accent">
              {rifa.prize_name || rifa.name}
            </span>
          </div>
        )}

        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-line bg-bg/70 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              finalized ? "bg-faint" : "glow-dot bg-accent"
            }`}
          />
          {finalized ? "Finalizada" : "Activa"}
        </span>
      </div>

      {/* Cuerpo */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="text-lg font-bold leading-tight text-white">
            {rifa.prize_name || rifa.name}
          </h3>
          <p className="mt-1 text-sm text-mute">{rifa.tagline}</p>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-mute">Boleto</span>
          <span className="mono font-semibold text-white">
            {formatCents(rifa.ticket_price_cents)}
          </span>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-faint">Progreso</span>
            <span className="mono text-accent">{pct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface2">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-faint">
          <span>Sorteo</span>
          <span>
            {rifa.sorteo_date
              ? formatDate(rifa.sorteo_date)
              : rifa.sorteo_note || "Por anunciar"}
          </span>
        </div>

        <div className="mt-auto pt-1">
          <span className="btn-primary w-full">
            {finalized ? "Ver resultado" : "Participar"}
          </span>
        </div>
      </div>
    </Link>
  );
}
