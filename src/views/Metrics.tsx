import { useEffect, useMemo } from "react";
import { useStore } from "../store";
import { METRIC_NETS } from "../lib/platforms";
import { fmtDate, fmtDateTime, lastDays, noon } from "../lib/dates";
import { MIN_REACH, buildMetrics, fmtInt, fmtRate, lastCapture, type MetricGroup, type MetricSeries, type SeriesSlot } from "../lib/metrics";
import RangePicker from "../components/RangePicker";

const PRESETS = [lastDays(7), lastDays(30), lastDays(90)];
const FEW_DAYS = 5;

/** Métricas con datos reales de `tem_metrics`. Misma pantalla en escritorio y teléfono. */
export default function Metrics() {
  const s = useStore();
  const { actions, metrics, metricsState, metricNet, metricStart, metricEnd, proposals } = s;

  useEffect(() => {
    void actions.loadMetrics();
  }, [actions]);

  const m = useMemo(() => buildMetrics(metrics, proposals, metricNet, metricStart, metricEnd), [metrics, proposals, metricNet, metricStart, metricEnd]);
  const hasAny = metrics.length > 0;
  const updated = lastCapture(metrics);

  return (
    <div className="pagina">
      <div className="cabecera">
        <div className="cabecera__texto">
          <h1 className="tem-h1">Métricas</h1>
          <p className="tem-caption">{updated ? `Datos reales de tus redes · actualizado el ${fmtDateTime(updated)}` : "Datos reales de tus redes"}</p>
        </div>
      </div>

      <RangePicker start={metricStart} end={metricEnd} onChange={actions.setMetricRange} presets={PRESETS} max={noon(Date.now())} />

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
            <p>Aparecen aquí cuando se mida lo publicado.</p>
          </div>
        </div>
      ) : m.rows.length === 0 ? (
        <div className="tem-card">
          <div className="vacio">
            <h2 className="tem-title">Sin publicaciones en este rango</h2>
            <p>{metricNet === "Todas" ? "Prueba con otras fechas." : `${metricNet} no tiene mediciones entre estas fechas. Prueba con otra red u otras fechas.`}</p>
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
              <p className="tem-metric__label">Vistas</p>
              <p className="tem-metric__valor">{fmtInt(m.total.views)}</p>
              <p className="tem-metric__nota">alcance {fmtInt(m.total.reach)}</p>
            </div>
            <div className="tem-card">
              <p className="tem-metric__label">Publicaciones</p>
              <p className="tem-metric__valor">{m.rows.length}</p>
              <p className="tem-metric__nota">entre {fmtDate(metricStart)} y {fmtDate(metricEnd)}</p>
            </div>
          </section>

          <section className="tem-card seccion" aria-labelledby="t-serie">
            <div className="tarjeta-cabeza">
              <h2 className="tem-title" id="t-serie">Desarrollo por {m.series.unit} de publicación</h2>
            </div>
            <div className="series">
              <Serie title="Vistas" series={m.series} value={(p) => p.views} />
              <Serie title="Alcance" series={m.series} value={(p) => p.reach} />
              <Serie title="Guardados y compartidos" series={m.series} value={(p) => p.engaged} highlight />
            </div>
            <p className="tem-caption series__nota">
              {m.series.unit === "día" && m.series.withData < FEW_DAYS
                ? `Solo ${m.series.withData === 1 ? "1 día" : `${m.series.withData} días`} con publicaciones en este rango: es poco para ver una tendencia. `
                : ""}
              Cada barra suma lo publicado en ese {m.series.unit}, con su última medición. Sin barra significa que no se publicó, no que dio cero.
            </p>
          </section>

          <section className="tem-card seccion" aria-labelledby="t-pieza">
            <div className="tarjeta-cabeza">
              <h2 className="tem-title" id="t-pieza">Por publicación</h2>
              <span className="tem-caption">Ordenado por guardados y compartidos. Con menos de {MIN_REACH} de alcance van al final.</span>
            </div>
            <div className="tabla-scroll">
              <table className="tem-table">
                <thead>
                  <tr>
                    <th>Publicación</th><th>Fecha</th><th>Post real</th><th className="num">Alcance</th><th className="num">Vistas</th>
                    <th className="num">Guardados</th><th className="num">Compartidos</th><th className="num">Por 1.000</th>
                  </tr>
                </thead>
                <tbody>
                  {m.pieces.map((g) => <PieceRow key={g.key} g={g} />)}
                </tbody>
              </table>
            </div>
            <p className="tem-caption series__nota">Una raya significa que esa red no entrega el dato.{m.undated > 0 ? ` ${m.undated} sin fecha de publicación no aparecen.` : ""}</p>
          </section>

          <section className="tem-card" aria-labelledby="t-red">
            <div className="tarjeta-cabeza">
              <h2 className="tem-title" id="t-red">Por red</h2>
            </div>
            <div className="tabla-scroll">
              <table className="tem-table">
                <thead>
                  <tr>
                    <th>Red</th><th className="num">Publicaciones</th><th className="num">Vistas</th><th className="num">Alcance</th>
                    <th className="num">Guardados</th><th className="num">Compartidos</th><th className="num">Por 1.000</th>
                  </tr>
                </thead>
                <tbody>
                  {m.networks.map((g) => (
                    <tr key={g.key} aria-selected={metricNet === g.key || undefined}>
                      <td className="medio">{g.title}</td>
                      <td className="num">{g.posts}</td>
                      <td className="num">{fmtInt(g.views)}</td>
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

/** Una medida, una escala. Los tramos sin dato quedan vacíos: nunca se dibujan como cero. */
function Serie({ title, series, value, highlight = false }: { title: string; series: MetricSeries; value: (p: SeriesSlot) => number | null; highlight?: boolean }) {
  const points = series.slots.map((slot) => ({ slot, v: value(slot) }));
  const known = points.filter((p) => p.v !== null);
  const max = Math.max(0, ...known.map((p) => p.v as number));
  const peak = known.find((p) => p.v === max && max > 0);
  const first = series.slots[0];
  const last = series.slots[series.slots.length - 1];

  return (
    <figure className="serie" style={{ margin: 0 }}>
      <figcaption className="serie__titulo">
        {title}
        {peak && <span className="serie__pico"> · máximo {fmtInt(peak.v)} el {peak.slot.label}</span>}
      </figcaption>
      {known.length === 0 ? (
        <div className="serie__sin">Esta red no entrega este dato.</div>
      ) : (
        <div className={`serie__barras${series.slots.length > 45 ? " serie__barras--densa" : ""}`} role="img" aria-label={`${title}: ${known.map((p) => `${p.slot.label}, ${fmtInt(p.v)}`).join("; ")}`}>
          {points.map(({ slot, v }) => (
            <div key={slot.ms} className="serie__slot" title={v === null ? `${slot.label}: sin publicaciones` : `${slot.label}: ${fmtInt(v)}`}>
              {v !== null && (
                <div
                  className={`serie__barra${slot === peak?.slot ? (highlight ? " serie__barra--dato" : " serie__barra--pico") : ""}`}
                  style={{ height: max > 0 ? `${(v / max) * 100}%` : 0 }}
                />
              )}
            </div>
          ))}
        </div>
      )}
      <div className="serie__eje"><span>{first?.label}</span><span>{last?.label}</span></div>
    </figure>
  );
}

function PieceRow({ g }: { g: MetricGroup }) {
  const { actions } = useStore();
  return (
    <tr>
      <td className="tem-table__pieza">
        {g.proposalId ? (
          <button className="boton-plano medio" onClick={() => actions.openWork(g.proposalId as string)}>{g.title}</button>
        ) : (
          <span className="medio">{g.title}</span>
        )}
        {g.isTest && <span className="tem-tag">Prueba</span>}
      </td>
      <td className="celda-fecha">{g.date ? fmtDate(new Date(g.date).getTime()) : "—"}</td>
      <td className="celda-red">
        {g.links.length > 0
          ? g.links.map((l) => <a key={l.url} className="enlace" href={l.url} target="_blank" rel="noreferrer">{l.net}</a>)
          : g.nets.join(" · ")}
      </td>
      <td className="num">{fmtInt(g.reach)}</td>
      <td className="num">{fmtInt(g.views)}</td>
      <td className="num">{fmtInt(g.saves)}</td>
      <td className="num">{fmtInt(g.shares)}</td>
      <td className="num">{fmtRate(g.rate)}</td>
    </tr>
  );
}
