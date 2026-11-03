import { useEffect, useMemo } from "react";
import { useStore } from "../store";
import { METRIC_NETS } from "../lib/platforms";
import { M_ABBR } from "../lib/dates";
import { MIN_REACH, buildMetrics, fmtInt, fmtRate, type MetricGroup } from "../lib/metrics";

/** Métricas con datos reales de `tem_metrics`. Misma pantalla en escritorio y teléfono. */
export default function Metrics() {
  const s = useStore();
  const { actions, metrics, metricsState, metricNet, proposals } = s;

  useEffect(() => {
    void actions.loadMetrics();
  }, [actions]);

  const m = useMemo(() => buildMetrics(metrics, proposals, metricNet), [metrics, proposals, metricNet]);
  const hasAny = metrics.length > 0;
  const captured = m.lastCapture ? new Date(m.lastCapture) : null;

  return (
    <div className="pagina">
      <div className="cabecera">
        <div className="cabecera__texto">
          <h1 className="tem-h1">Métricas</h1>
          <p className="tem-caption">
            {m.best ? `Lo que más se guarda y se comparte: ${m.best.title}.` : "Qué funciona, por pieza y por red."}
            {captured ? ` Medido el ${captured.getDate()} de ${M_ABBR[captured.getMonth()]}.` : ""}
          </p>
        </div>
      </div>

      <div className="filtros" role="group" aria-label="Filtrar por red">
        {METRIC_NETS.map((n) => (
          <button key={n} className="filtro" aria-pressed={metricNet === n} onClick={() => actions.setNet(n)}>{n}</button>
        ))}
      </div>

      {metricsState === "error" ? (
        <div className="tem-aviso tem-aviso--error fila fila--entre" role="alert">
          <span>No pude leer las métricas. Revisa tu conexión y vuelve a intentar.</span>
          <button className="tem-btn tem-btn--texto btn-chico" onClick={() => void actions.loadMetrics()}>Reintentar</button>
        </div>
      ) : metricsState === "cargando" && !hasAny ? (
        <div className="metricas" aria-busy="true">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 124 }} />)}
        </div>
      ) : !hasAny ? (
        <div className="tem-card">
          <div className="vacio">
            <h2 className="tem-title">Todavía no hay mediciones</h2>
            <p>Aparecen aquí cuando se mida lo publicado. No se muestra nada que no venga de las redes.</p>
          </div>
        </div>
      ) : m.rows.length === 0 ? (
        <div className="tem-card">
          <div className="vacio">
            <h2 className="tem-title">Sin mediciones en {metricNet}</h2>
            <p>Esta red todavía no tiene datos. Prueba con otra o con Todas.</p>
          </div>
        </div>
      ) : (
        <>
          <section className="metricas" aria-label="Resumen">
            <div className="tem-card">
              <p className="tem-metric__label">Guardados y compartidos</p>
              <p className="tem-metric__valor tem-metric__valor--clave">{fmtRate(m.total.rate)}</p>
              <p className="tem-metric__nota">por 1.000 de alcance</p>
            </div>
            <div className="tem-card">
              <p className="tem-metric__label">Alcance</p>
              <p className="tem-metric__valor">{fmtInt(m.total.reach)}</p>
              <p className="tem-metric__nota">sumado entre publicaciones</p>
            </div>
            <div className="tem-card">
              <p className="tem-metric__label">Piezas medidas</p>
              <p className="tem-metric__valor">{m.total.pieces}</p>
              <p className="tem-metric__nota">{m.rows.length === 1 ? "1 publicación" : `${m.rows.length} publicaciones`}</p>
            </div>
          </section>

          <section className="tem-card seccion" aria-labelledby="t-pieza">
            <div className="tarjeta-cabeza">
              <h2 className="tem-title" id="t-pieza">Por pieza</h2>
              <span className="tem-caption">Con menos de {MIN_REACH} de alcance la tasa no dice mucho: esas van al final.</span>
            </div>
            <div className="tabla-scroll">
              <table className="tem-table">
                <thead>
                  <tr>
                    <th>Pieza</th><th>Red</th><th className="num">Alcance</th><th className="num">Vistas</th>
                    <th className="num">Guardados</th><th className="num">Compartidos</th><th className="num">Por 1.000</th>
                  </tr>
                </thead>
                <tbody>
                  {m.pieces.map((g) => <PieceRow key={g.key} g={g} best={g.key === m.best?.key} />)}
                </tbody>
              </table>
            </div>
          </section>

          <section className="tem-card" aria-labelledby="t-red">
            <div className="tarjeta-cabeza">
              <h2 className="tem-title" id="t-red">Por red</h2>
            </div>
            <div className="tabla-scroll">
              <table className="tem-table">
                <thead>
                  <tr>
                    <th>Red</th><th className="num">Publicaciones</th><th className="num">Alcance</th>
                    <th className="num">Guardados</th><th className="num">Compartidos</th><th className="num">Por 1.000</th>
                  </tr>
                </thead>
                <tbody>
                  {m.networks.map((g) => (
                    <tr key={g.key} aria-selected={metricNet === g.key || undefined}>
                      <td className="medio">{g.title}</td>
                      <td className="num">{g.posts}</td>
                      <td className="num">{fmtInt(g.reach)}</td>
                      <td className="num">{fmtInt(g.saves)}</td>
                      <td className="num">{fmtInt(g.shares)}</td>
                      <td className="num">{fmtRate(g.rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function PieceRow({ g, best }: { g: MetricGroup; best: boolean }) {
  const { actions } = useStore();
  return (
    <tr>
      <td className="tem-table__pieza">
        {g.proposalId ? (
          <button className="boton-plano medio" onClick={() => actions.openWork(g.proposalId as string)}>{g.title}</button>
        ) : g.permalink ? (
          <a className="enlace medio" href={g.permalink} target="_blank" rel="noreferrer">{g.title}</a>
        ) : (
          <span className="medio">{g.title}</span>
        )}
        {g.isTest && <span className="tem-tag">Prueba</span>}
      </td>
      <td>{g.nets.join(" · ")}</td>
      <td className="num">{fmtInt(g.reach)}</td>
      <td className="num">{fmtInt(g.views)}</td>
      <td className="num">{fmtInt(g.saves)}</td>
      <td className="num">{fmtInt(g.shares)}</td>
      <td className={`num${best ? " dato-clave" : ""}`}>{fmtRate(g.rate)}</td>
    </tr>
  );
}
