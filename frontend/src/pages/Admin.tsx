import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatCents, formatDateTime } from "@/lib/format";
import { api, apiBlob } from "@/lib/api";

type Tab = "resumen" | "ordenes" | "rifas" | "ganadores" | "vendedores";

const STATUS_COLOR: Record<string, string> = {
  pendiente: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  confirmado: "text-accent border-accent/30 bg-accent/10",
  rechazado: "text-red-400 border-red-400/30 bg-red-400/10",
};

export default function AdminPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("resumen");
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [winners, setWinners] = useState<any[]>([]);
  const [orderFilter, setOrderFilter] = useState("");

  const [receiptModal, setReceiptModal] = useState<{
    id: number;
    url: string;
    isPdf: boolean;
  } | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState("");

  const loadAll = useCallback(async () => {
    try {
      const [s, o, w] = await Promise.all([
        api("/api/admin/stats"),
        api("/api/admin/orders"),
        api("/api/admin/winners"),
      ]);
      setStats(s);
      setOrders(o?.orders || []);
      setWinners(w?.winners || []);
    } catch (err: any) {
      if (err.status === 401) {
        navigate("/admin/login", { replace: true });
      }
    }
  }, [navigate]);

  useEffect(() => {
    (async () => {
      try {
        const me = await api("/api/auth/me");
        if (!me?.authenticated) {
          navigate("/admin/login", { replace: true });
          return;
        }
        setAuthed(true);
        loadAll();
      } catch {
        navigate("/admin/login", { replace: true });
      }
    })();
  }, [navigate, loadAll]);

  async function setOrderStatus(id: number, status: string) {
    try {
      await api(`/api/admin/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      loadAll();
    } catch (err: any) {
      if (err.status === 401) navigate("/admin/login", { replace: true });
    }
  }

  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {}
    navigate("/admin/login", { replace: true });
  }

  async function openReceipt(orderId: number) {
    setReceiptLoading(true);
    setReceiptError("");
    try {
      const blob = await apiBlob(`/api/admin/receipt/${orderId}`);
      const isPdf = blob.type.includes("pdf");
      const url = URL.createObjectURL(blob);
      setReceiptModal({ id: orderId, url, isPdf });
    } catch {
      setReceiptError("No se pudo cargar el comprobante.");
    } finally {
      setReceiptLoading(false);
    }
  }

  function closeReceipt() {
    if (receiptModal?.url) {
      URL.revokeObjectURL(receiptModal.url);
    }
    setReceiptModal(null);
    setReceiptError("");
  }

  const filteredOrders = orderFilter
    ? orders.filter((o) => o.status === orderFilter)
    : orders;

  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-mute">
        Cargando…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line-soft bg-surface/40 md:flex">
        <div className="flex items-center gap-2 border-b border-line-soft px-5 py-5">
          <span className="glow-dot h-2 w-2 rounded-full bg-accent" />
          <span className="mono text-sm font-semibold text-white">
            sorteo<span className="text-accent">.novalink</span>
          </span>
          <span className="mono ml-1 rounded border border-line bg-surface px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-faint">
            backoffice
          </span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          <NavBtn active={tab === "resumen"} onClick={() => setTab("resumen")} icon="▦">
            Resumen
          </NavBtn>
          <NavBtn active={tab === "ordenes"} onClick={() => setTab("ordenes")} icon="▤">
            Órdenes
          </NavBtn>
          <NavBtn active={tab === "rifas"} onClick={() => setTab("rifas")} icon="◆">
            Rifas
          </NavBtn>
          <NavBtn active={tab === "ganadores"} onClick={() => setTab("ganadores")} icon="★">
            Ganadores
          </NavBtn>
          <NavBtn active={tab === "vendedores"} onClick={() => setTab("vendedores")} icon="◎">
            Vendedores
          </NavBtn>
        </nav>

        <div className="border-t border-line-soft p-3">
          <button
            onClick={logout}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-mute hover:bg-surface2 hover:text-white"
          >
            ← Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line-soft bg-surface md:hidden">
        {(["resumen", "ordenes", "rifas", "ganadores", "vendedores"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-xs capitalize ${
              tab === t ? "text-accent" : "text-mute"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Main */}
      <main className="min-w-0 flex-1 overflow-x-hidden pb-20 md:pb-0">
        <header className="flex items-center justify-between border-b border-line-soft px-6 py-4">
          <h1 className="text-lg font-bold capitalize text-white">{tab}</h1>
          <button
            onClick={logout}
            className="text-sm text-mute hover:text-white md:hidden"
          >
            Salir
          </button>
        </header>

        <div className="p-6">
          {!stats ? (
            <p className="text-mute">Cargando datos…</p>
          ) : tab === "resumen" ? (
            <Resumen stats={stats} />
          ) : tab === "ordenes" ? (
            <Ordenes
              orders={filteredOrders}
              filter={orderFilter}
              setFilter={setOrderFilter}
              onStatus={setOrderStatus}
              onViewReceipt={openReceipt}
              receiptLoading={receiptLoading}
            />
          ) : tab === "rifas" ? (
            <Rifas rifas={stats.rifas || []} onUpdate={loadAll} />
          ) : tab === "ganadores" ? (
            <Ganadores winners={winners} rifas={stats.rifas || []} onUpdate={loadAll} />
          ) : (
            <Vendedores />
          )}
        </div>
      </main>

      {/* Modal de Comprobante con ObjectURL */}
      {(receiptModal || receiptLoading || receiptError) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="card relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden border-line p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line-soft pb-4">
              <h3 className="text-base font-semibold text-white">
                Comprobante de orden #{receiptModal?.id}
              </h3>
              <button
                onClick={closeReceipt}
                className="rounded-lg border border-line px-3 py-1 text-xs text-mute hover:border-accent hover:text-white"
              >
                Cerrar ✕
              </button>
            </div>

            <div className="my-4 flex flex-1 items-center justify-center overflow-auto">
              {receiptLoading ? (
                <p className="text-sm text-mute">Cargando comprobante con credenciales…</p>
              ) : receiptError ? (
                <p className="text-sm text-red-400">{receiptError}</p>
              ) : receiptModal?.isPdf ? (
                <iframe
                  src={receiptModal.url}
                  className="h-[65vh] w-full rounded border border-line"
                  title="Comprobante PDF"
                />
              ) : (
                <img
                  src={receiptModal?.url}
                  alt="Comprobante"
                  className="max-h-[65vh] max-w-full rounded object-contain"
                />
              )}
            </div>

            {receiptModal?.url && (
              <div className="flex justify-end gap-2 border-t border-line-soft pt-3">
                <a
                  href={receiptModal.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost px-3 py-1.5 text-xs text-accent"
                >
                  Abrir en pestaña nueva ↗
                </a>
                <button onClick={closeReceipt} className="btn-primary px-4 py-1.5 text-xs">
                  Listo
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NavBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
        active
          ? "bg-accent/10 text-accent"
          : "text-mute hover:bg-surface2 hover:text-white"
      }`}
    >
      <span className="mono text-xs">{icon}</span>
      {children}
    </button>
  );
}

function Vendedores() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [copied, setCopied] = useState("");
  const [form, setForm] = useState({ name: "", code: "", password: "" });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await api("/api/admin/vendedores");
      setVendors(d?.vendors || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    setError("");
    try {
      await api("/api/admin/vendedores", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm({ name: "", code: "", password: "" });
      setShowAdd(false);
      load();
    } catch (err: any) {
      setError(err.message || "Error al agregar vendedor");
    }
  }

  async function toggle(id: number, active: boolean) {
    try {
      await api("/api/admin/vendedores", {
        method: "PATCH",
        body: JSON.stringify({ id, active }),
      });
      load();
    } catch {}
  }

  async function remove(id: number) {
    if (!confirm("¿Eliminar este vendedor?")) return;
    try {
      await api(`/api/admin/vendedores?id=${id}`, { method: "DELETE" });
      load();
    } catch {}
  }

  async function copy(code: string) {
    const url = `${window.location.origin}/rifa/rifa-10-playstation-5?ref=${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(code);
      setTimeout(() => setCopied(""), 1500);
    } catch {}
  }

  const pesoT = (n: number) => `RD$ ${(n || 0).toLocaleString("es-DO")}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-mute">
          Vendedores con código de referido. Comisión: <span className="text-white">RD$10,000</span> por
          cada 1,000 boletos confirmados. Primera meta: 2,000 boletos = RD$20,000.
        </p>
        <button onClick={() => setShowAdd((v) => !v)} className="btn-primary px-4 py-2 text-sm">
          {showAdd ? "Cancelar" : "+ Agregar vendedor"}
        </button>
      </div>

      {showAdd && (
        <div className="card space-y-3 p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Nombre</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nombre del vendedor"
              />
            </div>
            <div>
              <label className="label">Código (opcional)</label>
              <input
                className="input mono uppercase"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="Auto si vacío"
              />
            </div>
            <div>
              <label className="label">Contraseña de acceso</label>
              <input
                className="input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Contraseña"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button onClick={add} className="btn-primary px-4 py-2 text-sm">
            Guardar vendedor
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-mute">Cargando…</p>
      ) : vendors.length === 0 ? (
        <div className="card p-10 text-center text-mute">
          No hay vendedores. Agrega el primero para que empiecen a vender.
        </div>
      ) : (
        <div className="space-y-3">
          {vendors.map((v: any) => {
            const s = v.stats || {};
            const g1 = s.goal1 || { tickets: 2000, pesos: 20000, reached: false };
            const g2 = s.goal2 || { tickets: 3000, pesos: 30000, reached: false };
            const pct = Math.min(100, Math.round(((s.confirmedTickets || 0) / g2.tickets) * 100));
            return (
              <div key={v.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">
                      {v.name}{" "}
                      <span className={`ml-1 text-xs ${v.active ? "text-accent" : "text-faint"}`}>
                        {v.active ? "● activo" : "○ inactivo"}
                      </span>
                    </p>
                    <p className="mono text-sm text-accent">{v.code}</p>
                    <p className="text-xs text-mute">
                      {s.confirmedTickets} boletos confirmados · {s.pendingTickets} pendientes ·{" "}
                      {s.totalOrders} órdenes
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-faint">Comisión acumulada</p>
                    <p className="mono text-lg font-bold text-accent">{pesoT(s.commissionPesos)}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs text-faint">
                    <span>
                      Meta 1: {g1.tickets} ({pesoT(g1.pesos)}) {g1.reached ? "✓" : ""}
                    </span>
                    <span>
                      Meta 2: {g2.tickets} ({pesoT(g2.pesos)}) {g2.reached ? "✓" : ""}
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface2">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button onClick={() => copy(v.code)} className="btn-ghost px-3 py-1.5 text-xs">
                    {copied === v.code ? "✓ Copiado" : "🔗 Copiar link"}
                  </button>
                  <button onClick={() => toggle(v.id, !v.active)} className="btn-ghost px-3 py-1.5 text-xs">
                    {v.active ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    onClick={() => remove(v.id)}
                    className="btn-ghost px-3 py-1.5 text-xs text-red-400 hover:border-red-400/50"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Resumen({ stats }: { stats: any }) {
  const t = stats.total || {};
  const cards = [
    { label: "Ingresos totales", value: formatCents(t.revenueCents || 0), sub: `${formatCents(t.revenueConfirmedCents || 0)} confirmados` },
    { label: "Boletos vendidos", value: (t.ticketsSold || 0).toLocaleString("es-DO"), sub: `${t.ordersCount || 0} órdenes` },
    { label: "Pendientes", value: String(t.pendingOrders || 0), sub: "por confirmar pago" },
    { label: "Confirmadas", value: String(t.confirmedOrders || 0), sub: "órdenes activas" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <p className="text-xs text-faint">{c.label}</p>
            <p className="mono mt-2 text-2xl font-bold text-white">{c.value}</p>
            <p className="mt-1 text-xs text-mute">{c.sub}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-white">Rifas</h2>
        <div className="space-y-3">
          {(stats.rifas || []).map((r: any) => {
            const pct = Math.round((r.stats?.progress || 0) * 100);
            return (
              <div key={r.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{r.name}</p>
                    <p className="text-xs text-mute">
                      {(r.stats?.ticketsSold || 0).toLocaleString("es-DO")} boletos ·{" "}
                      {formatCents(r.stats?.revenueCents || 0)}
                    </p>
                  </div>
                  <span className={`chip ${STATUS_COLOR[r.status] || ""}`}>
                    {r.status}
                  </span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface2">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {stats.recentOrders?.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-white">Órdenes recientes</h2>
          <div className="card divide-y divide-line-soft">
            {stats.recentOrders.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="mono text-sm text-white">{o.code}</p>
                  <p className="text-xs text-mute">
                    {o.name} · {o.ticket_quantity} boletos
                  </p>
                </div>
                <div className="text-right">
                  <p className="mono text-sm text-white">{formatCents(o.total_cents)}</p>
                  <span className={`chip mt-1 ${STATUS_COLOR[o.status] || ""}`}>
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Ordenes({
  orders,
  filter,
  setFilter,
  onStatus,
  onViewReceipt,
  receiptLoading,
}: {
  orders: any[];
  filter: string;
  setFilter: (v: string) => void;
  onStatus: (id: number, status: string) => void;
  onViewReceipt: (id: number) => void;
  receiptLoading: boolean;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {["", "pendiente", "confirmado", "rechazado"].map((s) => (
          <button
            key={s || "todos"}
            onClick={() => setFilter(s)}
            className={`chip ${filter === s ? "border-accent/40 bg-accent/10 text-accent" : "text-mute"}`}
          >
            {s || "Todas"}
          </button>
        ))}
      </div>

      <div className="card divide-y divide-line-soft">
        {orders.length === 0 ? (
          <p className="p-6 text-center text-mute">No hay órdenes.</p>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  className="flex items-center gap-3 text-left"
                  onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                >
                  <span className="mono text-xs text-faint">{expanded === o.id ? "▾" : "▸"}</span>
                  <div>
                    <p className="mono text-sm font-semibold text-white">{o.code}</p>
                    <p className="text-xs text-mute">
                      {o.name} · {o.phone} · {o.ticket_quantity} boletos
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <span className="mono text-sm text-white">{formatCents(o.total_cents)}</span>
                  <span className={`chip ${STATUS_COLOR[o.status] || ""}`}>{o.status}</span>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-faint">
                <span>{formatDateTime(o.created_at)}</span>
                {o.email && <span>· {o.email}</span>}
                {o.receipt_filename && (
                  <button
                    type="button"
                    onClick={() => onViewReceipt(o.id)}
                    disabled={receiptLoading}
                    className="text-accent hover:text-accent-bright"
                  >
                    📎 Ver comprobante
                  </button>
                )}
              </div>

              {o.status !== "confirmado" && (
                <div className="mt-3 flex gap-2">
                  {o.status !== "confirmado" && (
                    <button
                      onClick={() => onStatus(o.id, "confirmado")}
                      className="btn-primary px-3 py-1.5 text-xs"
                    >
                      ✓ Confirmar
                    </button>
                  )}
                  {o.status !== "rechazado" && (
                    <button
                      onClick={() => onStatus(o.id, "rechazado")}
                      className="btn-ghost px-3 py-1.5 text-xs"
                    >
                      ✗ Rechazar
                    </button>
                  )}
                  {o.status === "rechazado" && (
                    <button
                      onClick={() => onStatus(o.id, "pendiente")}
                      className="btn-ghost px-3 py-1.5 text-xs"
                    >
                      ↺ Pendiente
                    </button>
                  )}
                </div>
              )}

              {expanded === o.id && (
                <div className="mt-3 rounded-lg border border-line bg-surface2 p-3">
                  <p className="mb-2 text-xs font-medium text-mute">Boletos:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(o.tickets || []).map((n: string) => (
                      <span
                        key={n}
                        className="mono rounded border border-line bg-surface px-2 py-1 text-xs text-white"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Rifas({ rifas, onUpdate }: { rifas: any[]; onUpdate: () => void }) {
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  function startEdit(r: any) {
    setEditing(r.id);
    setForm({ ...r });
  }

  async function save() {
    setSaving(true);
    try {
      await api("/api/admin/rifas", {
        method: "PATCH",
        body: JSON.stringify({
          id: editing,
          name: form.name,
          tagline: form.tagline,
          description: form.description,
          prize_name: form.prize_name,
          ticket_price_cents: Number(form.ticket_price_cents),
          min_tickets: Number(form.min_tickets),
          max_tickets_per_order: Number(form.max_tickets_per_order),
          total_tickets: Number(form.total_tickets),
          sorteo_date: form.sorteo_date,
          sorteo_time: form.sorteo_time,
          sorteo_place: form.sorteo_place,
          draw_mechanic: form.draw_mechanic,
          status: form.status,
        }),
      });
      setEditing(null);
      onUpdate();
    } catch {}
    setSaving(false);
  }

  function field(key: string, label: string, type = "text") {
    return (
      <div>
        <label className="label">{label}</label>
        <input
          type={type}
          className="input"
          value={form[key] ?? ""}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rifas.map((r) =>
        editing === r.id ? (
          <div key={r.id} className="card space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {field("name", "Nombre")}
              {field("prize_name", "Premio")}
              {field("tagline", "Eslogan")}
              {field("ticket_price_cents", "Precio del boleto (centavos)", "number")}
              {field("min_tickets", "Compra mínima", "number")}
              {field("max_tickets_per_order", "Compra máxima", "number")}
              {field("total_tickets", "Total de boletos", "number")}
              {field("sorteo_date", "Fecha del sorteo (YYYY-MM-DD)")}
              {field("sorteo_time", "Hora del sorteo")}
              {field("sorteo_place", "Lugar / transmisión")}
            </div>
            <div>{field("draw_mechanic", "Mecánica del sorteo")}</div>
            <div>
              <label className="label">Descripción</label>
              <textarea
                className="input min-h-[80px]"
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Estado</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="borrador">borrador</option>
                <option value="activa">activa</option>
                <option value="finalizada">finalizada</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={save} disabled={saving} className="btn-primary px-4 py-2 text-sm">
                {saving ? "Guardando…" : "Guardar"}
              </button>
              <button onClick={() => setEditing(null)} className="btn-ghost px-4 py-2 text-sm">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div key={r.id} className="card flex items-center justify-between p-5">
            <div>
              <p className="font-semibold text-white">{r.name}</p>
              <p className="text-xs text-mute">
                {r.slug} · {r.stats?.ticketsSold} boletos ·{" "}
                <span className={`chip mt-1 ${STATUS_COLOR[r.status] || ""}`}>{r.status}</span>
              </p>
            </div>
            <button onClick={() => startEdit(r)} className="btn-ghost px-4 py-2 text-sm">
              Editar
            </button>
          </div>
        )
      )}
    </div>
  );
}

function Ganadores({
  winners,
  rifas,
  onUpdate,
}: {
  winners: any[];
  rifas: any[];
  onUpdate: () => void;
}) {
  const [rifaId, setRifaId] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");
  const [prizeLabel, setPrizeLabel] = useState("");

  async function add() {
    try {
      await api("/api/admin/winners", {
        method: "POST",
        body: JSON.stringify({
          rifaId: Number(rifaId),
          ticketNumber,
          prizeLabel: prizeLabel || "Premio",
        }),
      });
      setTicketNumber("");
      setPrizeLabel("");
      onUpdate();
    } catch {}
  }

  async function remove(id: number) {
    try {
      await api(`/api/admin/winners?id=${id}`, { method: "DELETE" });
      onUpdate();
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-white">Anunciar ganador</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Rifa</label>
            <select className="input" value={rifaId} onChange={(e) => setRifaId(e.target.value)}>
              <option value="">Selecciona…</option>
              {rifas.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Número de boleto</label>
            <input
              className="input mono"
              value={ticketNumber}
              maxLength={5}
              onChange={(e) => setTicketNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="00000"
            />
          </div>
          <div>
            <label className="label">Premio</label>
            <input
              className="input"
              value={prizeLabel}
              onChange={(e) => setPrizeLabel(e.target.value)}
              placeholder="PlayStation 5 Slim"
            />
          </div>
          <div className="flex items-end">
            <button onClick={add} className="btn-primary w-full py-2.5">
              Anunciar
            </button>
          </div>
        </div>
      </div>

      <div className="card divide-y divide-line-soft">
        {winners.length === 0 ? (
          <p className="p-6 text-center text-mute">Sin ganadores anunciados.</p>
        ) : (
          winners.map((w) => (
            <div key={w.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-white">
                  {w.winner_name || "Ganador"}
                </p>
                <p className="mono text-xs text-accent">
                  Boleto {w.ticket_number} · {w.prize_label}
                </p>
                <p className="text-xs text-faint">{w.rifa_name}</p>
              </div>
              <button onClick={() => remove(w.id)} className="text-sm text-red-400 hover:text-red-300">
                Eliminar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
