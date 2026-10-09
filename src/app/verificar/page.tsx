"use client";

import { useState } from "react";

export default function VerificarPage() {
  const [numero, setNumero] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function onCheck(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    if (!numero.trim()) {
      setError("Ingresa un número de boleto.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/verificar?numero=${encodeURIComponent(numero)}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-x flex flex-col items-center py-20">
      <div className="w-full max-w-md text-center">
        <p className="eyebrow">// Verificador</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Verificar boleto</h1>
        <p className="mt-2 text-mute">
          Ingresa el número de tu boleto para conocer su estado.
        </p>

        <form onSubmit={onCheck} className="mt-8">
          <div className="flex gap-2">
            <input
              className="input mono h-12 flex-1 text-center text-lg tracking-widest"
              placeholder="00000"
              maxLength={5}
              value={numero}
              onChange={(e) => setNumero(e.target.value.replace(/\D/g, ""))}
            />
            <button type="submit" disabled={loading} className="btn-primary h-12 px-5">
              {loading ? "…" : "Verificar"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {result && (
          <div className="card mt-6 p-6 text-left">
            {result.found ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-lg">
                    {result.status === "confirmado" ? "✅" : "⏳"}
                  </span>
                  <div>
                    <p className="mono text-lg font-bold text-white">
                      Boleto {result.number}
                    </p>
                    <p className="text-xs text-mute">
                      Orden {result.orderCode} · {result.name}
                    </p>
                  </div>
                </div>
                <p className="mt-4 rounded-lg border border-line bg-surface2 px-4 py-3 text-sm text-white">
                  {result.message}
                </p>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15 text-lg">
                  ❌
                </span>
                <p className="text-sm text-white">{result.message}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
