import { useEffect, useMemo } from "react";
import { useStore } from "../store";
import { HANDLE, VARIANTS } from "../data/mock";
import { PLATFORM_LABEL, PUBLISH_TAGS, platformsStr } from "../lib/platforms";
import { fmtInt, latestPerPost } from "../lib/metrics";
import { guideFor, pieceFormat } from "../lib/formatos";
import Card916 from "../components/Card916";
import type { PlatformTag } from "../types";

const FILTERS: (PlatformTag | "Todas")[] = ["Todas", ...PUBLISH_TAGS];

/** Biblioteca: lo publicado de verdad, con su alcance si ya se midió. */
export default function Library() {
  const { proposals, metrics, libFilter, loading, actions } = useStore();

  useEffect(() => {
    void actions.loadMetrics();
  }, [actions]);

  const reachById = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of latestPerPost(metrics)) {
      if (r.proposal_id && r.reach !== null) m.set(r.proposal_id, (m.get(r.proposal_id) ?? 0) + r.reach);
    }
    return m;
  }, [metrics]);

  const published = proposals.filter((p) => p.status !== "rejected" && p.stage === "publicado");
  const items = libFilter === "Todas" ? published : published.filter((p) => p.platforms.includes(libFilter));

  return (
    <div className="pagina">
      <div className="cabecera">
        <div className="cabecera__texto">
          <h1 className="tem-h1">Biblioteca</h1>
          <p className="tem-caption">Lo que ya salió.</p>
        </div>
      </div>

      <div className="filtros" role="group" aria-label="Filtrar por red">
        {FILTERS.map((f) => (
          <button key={f} className="filtro" aria-pressed={libFilter === f} onClick={() => actions.setLib(f)}>
            {f === "Todas" ? "Todas" : PLATFORM_LABEL[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="galeria">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ aspectRatio: "9 / 16" }} aria-busy="true" />)}</div>
      ) : items.length === 0 ? (
        <div className="tem-card">
          <div className="vacio">
            <h2 className="tem-title">{published.length === 0 ? "Todavía no hay piezas publicadas" : "Nada publicado en esta red"}</h2>
            <p>Cuando una pieza pase a Publicado aparece aquí con su alcance.</p>
          </div>
        </div>
      ) : (
        <div className="galeria">
          {items.map((p) => (
            <button key={p.id} className="galeria__item" onClick={() => actions.openWork(p.id)}>
              <Card916 line={p.line} variant={VARIANTS[0]} handle={HANDLE} aspect={guideFor(pieceFormat(p)).aspect} />
              <span className="tem-caption">{platformsStr(p.platforms)}</span>
              {reachById.has(p.id) && <span className="tem-small">{fmtInt(reachById.get(p.id) ?? null)} de alcance</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
