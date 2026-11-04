// Paneles por etapa de la ficha de la pieza. Los mismos en escritorio y teléfono.
import { useState } from "react";
import { useStore, type AiTask } from "../../store";
import { fmtWhen, fromInputs, toInputs } from "../../lib/dates";
import { hasScheduledColumn } from "../../lib/db";
import { PLATFORM_LABEL, PUBLISH_TAGS, pieceTitle } from "../../lib/platforms";
import {
  DURATIONS_S,
  EMPTY_SCRIPT,
  SCRIPT_FORMATS,
  SHOT_TEMPLATES,
  deliveryStatus,
  newItem,
  parseLine,
  pieceWhen,
  scheduleFields,
} from "../../lib/stages";
import { EDIT_MODES, checklistFor, deliveryFor, guideFor, pieceFormat, recordFormatOf, suggestedFileName, themeOf } from "../../lib/formatos";
import FormatGuide from "../FormatGuide";
import { HowToRecord, PieceFormat } from "../FormatPicker";
import { TAG_TO_NETWORK, hasPublishing } from "../../lib/publish";
import type { CheckItem, Network, PlatformTag, PostResult, Proposal, Results, Script } from "../../types";
import { CheckRow, Field, TextArea, TextInput } from "./ui";

const durLabel = (d: number) => (d < 120 ? `${d} s` : `${Math.round(d / 60)} min`);

/* -------------------------------- 1 · Idea -------------------------------- */

export function IdeaPanel({ p }: { p: Proposal }) {
  const { actions } = useStore();
  const lineText = p.line.key ? `${p.line.pre}*${p.line.key}*${p.line.post}` : p.line.pre + p.line.post;
  return (
    <div className="panel">
      <Field label="Título" help="La palabra entre *asteriscos* va en naranja en la pieza.">
        <TextInput value={lineText} onCommit={(v) => actions.updateFields(p.id, { line: parseLine(v) })} ariaLabel="Título de la pieza" />
      </Field>
      <Field label="Por qué importa">
        <TextArea value={p.notes ?? ""} onCommit={(v) => actions.updateFields(p.id, { notes: v })} placeholder="Qué le pasa a quien lo ve, qué cambia si lo sabe" ariaLabel="Por qué importa" />
      </Field>
      <div className="dos">
        <Field label="De dónde salió">
          <TextInput value={p.source ?? ""} onCommit={(v) => actions.updateFields(p.id, { source: v })} ariaLabel="De dónde salió" />
        </Field>
        <Field label="Tema">
          <TextInput value={p.eyebrow} onCommit={(v) => actions.updateFields(p.id, { eyebrow: v })} ariaLabel="Tema de la pieza" />
        </Field>
      </div>
      <div className="grupo">
        <PieceFormat p={p} />
      </div>
    </div>
  );
}

/* -------------------------------- 2 · Guion ------------------------------- */

/** Botón para un encargo de IA, con estado mientras trabaja (H01). */
export function AiButton({ task, label, busyLabel, onClick }: { task: AiTask; label: string; busyLabel: string; onClick: () => void }) {
  const { aiBusy } = useStore();
  const busy = aiBusy === task;
  return (
    <button className="tem-btn tem-btn--secundario btn-chico" onClick={onClick} disabled={aiBusy !== null}>
      {busy && <span className="spinner" aria-hidden="true" />}
      {busy ? busyLabel : label}
    </button>
  );
}

export function GuionPanel({ p }: { p: Proposal }) {
  const { actions } = useStore();
  const s: Script = p.script ?? { ...EMPTY_SCRIPT, format: p.type };
  const setScript = (patch: Partial<Script>) => actions.updateFields(p.id, { script: { ...s, ...patch } });
  const shots = p.shots ?? [];
  const setShots = (next: CheckItem[]) => actions.updateFields(p.id, { shots: next });
  const [newShot, setNewShot] = useState("");
  const addShot = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    setShots([...shots, newItem(clean)]);
    setNewShot("");
  };
  const formats = SCRIPT_FORMATS.includes(s.format) ? SCRIPT_FORMATS : [s.format, ...SCRIPT_FORMATS];
  const durations = [...new Set([...DURATIONS_S, ...(s.duration_s ? [s.duration_s] : [])])].sort((a, b) => a - b);

  return (
    <div className="panel">
      <div className="fila">
        <AiButton task="guion" label={s.hook ? "Reescribir guion" : "Escribir guion"} busyLabel="Escribiendo…" onClick={() => void actions.runScript(p.id)} />
        <AiButton task="tomas" label="Sugerir tomas" busyLabel="Pensando…" onClick={() => void actions.runShots(p.id)} />
      </div>
      <div className="dos">
        <Field label="Formato">
          <select className="tem-select" value={s.format} onChange={(e) => setScript({ format: e.target.value })} aria-label="Formato">
            {formats.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
        <Field label="Duración">
          <select className="tem-select" value={s.duration_s ?? ""} onChange={(e) => setScript({ duration_s: e.target.value ? Number(e.target.value) : null })} aria-label="Duración">
            <option value="">Sin definir</option>
            {durations.map((d) => <option key={d} value={d}>{durLabel(d)}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Gancho">
        <TextArea value={s.hook} onCommit={(v) => setScript({ hook: v })} placeholder="Los primeros 3 segundos" ariaLabel="Gancho" rows={Math.max(2, s.hook.split("\n").length * 2)} />
      </Field>
      <Field label="Desarrollo">
        <TextArea value={s.body} onCommit={(v) => setScript({ body: v })} placeholder="El caso, el dato, los pasos. Una idea por línea." ariaLabel="Desarrollo" rows={5} />
      </Field>
      <Field label="Cierre">
        <TextArea value={s.cta} onCommit={(v) => setScript({ cta: v })} placeholder="Qué quieres que hagan después de verlo" ariaLabel="Cierre" rows={2} />
      </Field>

      <div className="grupo">
        <div className="grupo__cabeza">Tomas{shots.length > 0 && <span>{shots.length}</span>}</div>
        {shots.map((sh) => (
          <CheckRow
            key={sh.id}
            checked={sh.done}
            text={sh.text}
            onToggle={() => setShots(shots.map((x) => (x.id === sh.id ? { ...x, done: !x.done } : x)))}
            onRemove={() => setShots(shots.filter((x) => x.id !== sh.id))}
          />
        ))}
        <div className="fila" style={{ flexWrap: "nowrap" }}>
          <input className="tem-input crece" value={newShot} onChange={(e) => setNewShot(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addShot(newShot)} placeholder="Nueva toma" aria-label="Nueva toma" />
          <button className="tem-btn tem-btn--secundario" onClick={() => addShot(newShot)} disabled={!newShot.trim()}>Añadir</button>
        </div>
        <div className="chips-plantilla">
          {SHOT_TEMPLATES.filter((t) => !shots.some((x) => x.text === t)).map((t) => (
            <button key={t} className="sugerencia" onClick={() => addShot(t)}>{t}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- 3 · Grabar ------------------------------ */

export function GrabarPanel({ p, onTeleprompter }: { p: Proposal; onTeleprompter?: () => void }) {
  const { actions } = useStore();
  const format = pieceFormat(p);
  const g = guideFor(format);
  const record = recordFormatOf(p);
  const checklist = p.checklist?.length ? p.checklist : checklistFor(format);
  const setChecklist = (next: CheckItem[]) => actions.updateFields(p.id, { checklist: next });
  const shots = p.shots ?? [];
  const setShots = (next: CheckItem[]) => actions.updateFields(p.id, { shots: next });
  const done = shots.filter((s) => s.done).length;
  const allDone = shots.length > 0 && done === shots.length;
  const title = pieceTitle(p);
  const delivery = deliveryStatus(p);
  const deliveryOk = delivery.filter((d) => d.done).length;
  const manual = p.delivery?.length ? p.delivery : deliveryFor(format);
  const setManual = (next: CheckItem[]) => actions.updateFields(p.id, { delivery: next });

  return (
    <div className="panel">
      {record && (
        <div className="pila pila--chica">
          <div className="grupo__cabeza">Formato: {record.name}<span>{record.orientation === "horizontal" ? "Se graba horizontal" : "Se graba vertical"}</span></div>
          <HowToRecord record={record} theme={themeOf(title, p.eyebrow)} />
        </div>
      )}
      <details className="guia__pliegue">
        <summary>Hoja de rodaje: {g.name}</summary>
        <FormatGuide g={g} />
      </details>

      <div className="grupo">
        <div className="grupo__cabeza">Antes de grabar</div>
        {checklist.map((c) => (
          <CheckRow key={c.id} checked={c.done} text={c.text} onToggle={() => setChecklist(checklist.map((x) => (x.id === c.id ? { ...x, done: !x.done } : x)))} />
        ))}
      </div>

      {onTeleprompter && g.isVideo && (
        <button className="tem-btn tem-btn--secundario" onClick={onTeleprompter} disabled={!p.script?.hook}>Abrir teleprompter</button>
      )}

      <div className="grupo">
        <div className="grupo__cabeza">{g.isVideo ? "Tomas y texto en pantalla" : "Material a entregar"}{shots.length > 0 && <span>{done} de {shots.length}</span>}</div>
        {shots.map((sh, i) => (
          <div key={sh.id} className="toma">
            <CheckRow checked={sh.done} text={sh.text} onToggle={() => setShots(shots.map((x) => (x.id === sh.id ? { ...x, done: !x.done } : x)))} />
            {g.isVideo && (
              <div className="toma__detalle">
                <TextInput value={sh.screen ?? ""} onCommit={(v) => actions.updateShot(p.id, sh.id, { screen: v })} placeholder="Texto en pantalla, o «sin texto»" ariaLabel={`Texto en pantalla de la toma ${i + 1}`} />
                <span className="tem-caption rompe">Archivo: {suggestedFileName(g, title, i + 1)}</span>
              </div>
            )}
          </div>
        ))}
        {shots.length === 0 && <p className="tem-help">No hay tomas: vuelve a Guion y añade al menos una.</p>}
        {shots.length > 0 && !allDone && (
          <button className="tem-btn tem-btn--texto btn-chico" style={{ alignSelf: "flex-start", paddingLeft: 0 }} onClick={() => setShots(shots.map((x) => ({ ...x, done: true })))}>
            Marcar todas como grabadas
          </button>
        )}
      </div>

      {g.editMode && (
        <div className="grupo">
          <div className="grupo__cabeza">Modo de edición</div>
          <div className="opciones">
            {EDIT_MODES.map((m) => (
              <button key={m.key} className="opcion opcion--bloque" aria-pressed={p.edit_mode === m.key} onClick={() => actions.updateFields(p.id, { edit_mode: p.edit_mode === m.key ? null : m.key })}>
                {m.key} · {m.name}
                <small>{m.help}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      <Field label={g.isVideo ? "Link del bruto" : "Link del material"} help={`El archivo va por AirDrop al Mac y a Drive como respaldo. Nombre: ${g.fileName}`}>
        <TextInput value={p.raw_url ?? ""} onCommit={(v) => actions.updateFields(p.id, { raw_url: v.trim() })} placeholder="https://drive.google.com/…" ariaLabel="Link del bruto" />
      </Field>

      <div className="grupo">
        <div className="grupo__cabeza">Entrega al editor<span>{deliveryOk} de {delivery.length}</span></div>
        {delivery.map((d) =>
          d.auto ? (
            <CheckRow key={d.id} checked={d.done} text={d.text} disabled aside="automático" />
          ) : (
            <CheckRow key={d.id} checked={d.done} text={d.text} onToggle={() => setManual(manual.map((x) => (x.id === d.id ? { ...x, done: !x.done } : x)))} />
          ),
        )}
      </div>
    </div>
  );
}

/* -------------------------------- 4 · Editar ------------------------------ */

export function EditarPanel({ p }: { p: Proposal }) {
  const { actions } = useStore();
  return (
    <div className="panel">
      {p.raw_url && <p className="tem-small">Bruto: <a className="enlace" href={p.raw_url} target="_blank" rel="noreferrer">{p.raw_url}</a></p>}
      <Field label="Instrucciones de edición">
        <TextArea value={p.notes ?? ""} onCommit={(v) => actions.updateFields(p.id, { notes: v })} placeholder="Cortes, ritmo, subtítulos, qué texto aparece en pantalla" ariaLabel="Instrucciones de edición" rows={6} />
      </Field>
      <div className="fila">
        <AiButton task="cortes" label="Proponer cortes" busyLabel="Pensando…" onClick={() => void actions.runCuts(p.id)} />
        <AiButton task="caption" label={p.caption ? "Reescribir caption" : "Escribir caption"} busyLabel="Escribiendo…" onClick={() => void actions.runCaption(p.id)} />
      </div>
      <div className="dos">
        <Field label="Link del video final">
          <TextInput value={p.final_url ?? ""} onCommit={(v) => actions.updateFields(p.id, { final_url: v.trim() })} placeholder="https://drive.google.com/…" ariaLabel="Link del video final" />
        </Field>
        <Field label="Link de la miniatura">
          <TextInput value={p.thumbnail_url ?? ""} onCommit={(v) => actions.updateFields(p.id, { thumbnail_url: v.trim() })} placeholder="Opcional" ariaLabel="Link de la miniatura" />
        </Field>
      </div>
      <Field label="Caption">
        <TextArea value={p.caption} onCommit={(v) => actions.updateCaption(p.id, v)} ariaLabel="Caption" />
      </Field>
      <Field label="Hashtags">
        <TextInput
          value={p.tags.join(" ")}
          onCommit={(v) => actions.updateFields(p.id, { tags: v.split(/[\s,]+/).filter(Boolean).map((t) => (t.startsWith("#") ? t : `#${t}`)) })}
          placeholder="#marca #TEM"
          ariaLabel="Hashtags"
        />
      </Field>
    </div>
  );
}

/* -------------------------------- 5 · Listo ------------------------------- */

export function ListoPanel({ p }: { p: Proposal }) {
  const { actions } = useStore();
  const extra = p.platforms.filter((t) => !PUBLISH_TAGS.includes(t));
  const tags: PlatformTag[] = [...PUBLISH_TAGS, ...extra];
  const names = p.platforms.map((t) => PLATFORM_LABEL[t]).join(", ");
  const saved = toInputs(p.scheduled_at);
  const [date, setDate] = useState(saved.date);
  const [time, setTime] = useState(saved.time || p.time);
  const setWhen = (d: string, t: string) => {
    setDate(d);
    setTime(t);
    const iso = fromInputs(d, t);
    if (iso) actions.updateFields(p.id, scheduleFields(iso));
    else if (!d) actions.updateFields(p.id, { scheduled_at: null });
  };
  const when = pieceWhen(p);
  return (
    <div className="panel">
      <div className="dos">
        <Field label="Fecha">
          <input className="tem-input" type="date" value={date} onChange={(e) => setWhen(e.target.value, time)} aria-label="Fecha de publicación" />
        </Field>
        <Field label="Hora">
          <input className="tem-input" type="time" value={time} onChange={(e) => setWhen(date, e.target.value)} aria-label="Hora de publicación" />
        </Field>
      </div>
      {!hasScheduledColumn() && <p className="tem-help">Esta fecha se pierde al recargar hasta activar la columna de fecha. Programar en lote no se ve afectado.</p>}
      <Field
        label="Publicar en"
        warn={p.platforms.length === 0}
        help={p.platforms.length === 0 ? "Elige al menos una red." : `${when ? `Sale el ${fmtWhen(when)}` : "Sin fecha"} en ${names}.`}
      >
        <div className="opciones" role="group" aria-label="Redes">
          {tags.map((t) => (
            <button key={t} className="opcion" aria-pressed={p.platforms.includes(t)} onClick={() => actions.togglePlatform(p.id, t)}>{PLATFORM_LABEL[t]}</button>
          ))}
        </div>
      </Field>
      {p.final_url && <p className="tem-small">Video final: <a className="enlace" href={p.final_url} target="_blank" rel="noreferrer">{p.final_url}</a></p>}
      {hasPublishing ? <PublishBlock p={p} /> : <p className="tem-help">La publicación no está configurada en este entorno.</p>}
    </div>
  );
}

/** Publicar ahora o programar en las redes elegidas. */
function PublishBlock({ p }: { p: Proposal }) {
  const s = useStore();
  const { actions } = s;
  const [trial, setTrial] = useState(false);
  const nets = [...new Set(p.platforms.map((t) => TAG_TO_NETWORK[t]).filter((n): n is Network => Boolean(n)))];
  const notConnected = nets.filter((n) => !s.connections[n]);
  const busy = s.publishing === p.id;
  const slot = p.scheduled_at && new Date(p.scheduled_at).getTime() > Date.now() + 60_000 ? p.scheduled_at : null;
  const missing = !p.final_url ? "Falta el link del video final, en Editar." : nets.length === 0 ? "Elige al menos una red." : notConnected.length ? `Conecta ${notConnected.join(", ")} en Perfil.` : null;
  const canTrial = nets.includes("Instagram") && guideFor(pieceFormat(p)).key === "reel";
  const opts = canTrial && trial ? { trial: true } : undefined;
  return (
    <div className="grupo">
      <div className="grupo__cabeza">Publicar en las redes</div>
      {canTrial && (
        <CheckRow checked={trial} text="Reel de prueba: en Instagram lo ven solo quienes no te siguen" onToggle={() => setTrial((v) => !v)} />
      )}
      <div className="publicar-botones">
        <button className="tem-btn tem-btn--naranja" onClick={() => void actions.publishPiece(p.id, null, opts)} disabled={Boolean(missing) || busy}>
          {busy && <span className="spinner" aria-hidden="true" />}
          {busy ? "Publicando…" : "Publicar ahora"}
        </button>
        {slot && (
          <button className="tem-btn tem-btn--secundario" onClick={() => void actions.publishPiece(p.id, slot, opts)} disabled={Boolean(missing) || busy}>
            Programar: {fmtWhen(slot)}
          </button>
        )}
      </div>
      <p className="tem-help">{missing ?? `Sube el video final a ${nets.join(", ")} con el caption de la pieza.`}</p>
      {p.posts && <PostsList posts={p.posts} />}
    </div>
  );
}

const POST_NAME: Record<string, string> = { instagram: "Instagram", facebook: "Facebook", threads: "Threads", tiktok: "TikTok", youtube: "YouTube", linkedin: "LinkedIn" };

/** Resultado por red: link, programada o error. */
function PostsList({ posts }: { posts: Record<string, PostResult> }) {
  return (
    <div className="pila pila--chica">
      {Object.entries(posts).map(([k, r]) => (
        <div key={k} className="resultado-red">
          <span>{POST_NAME[k] ?? k}</span>
          {r.url ? (
            <a className="enlace" href={r.url} target="_blank" rel="noreferrer">{r.url}</a>
          ) : r.scheduled ? (
            <span className="tem-tag">Programada{r.scheduled_date ? `: ${new Date(r.scheduled_date).toLocaleString("es-CL", { weekday: "short", hour: "2-digit", minute: "2-digit" })}` : ""}</span>
          ) : r.pending ? (
            <span className="tem-tag">Subiendo</span>
          ) : r.ok ? (
            <span className="tem-tag tem-tag--ok">Publicada</span>
          ) : (
            <span className="tem-tag tem-tag--error">{r.error ?? "Falló"}</span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ 6 · Publicado ----------------------------- */

const EMPTY_RESULTS: Results = { views: null, likes: null, saves: null, comments: null, learned: "" };

export function PublicadoPanel({ p }: { p: Proposal }) {
  const { actions } = useStore();
  const r = p.results ?? EMPTY_RESULTS;
  const setR = (patch: Partial<Results>) => actions.updateFields(p.id, { results: { ...r, ...patch } });
  const fields: { k: keyof Omit<Results, "learned">; label: string }[] = [
    { k: "views", label: "Vistas" }, { k: "likes", label: "Me gusta" }, { k: "saves", label: "Guardados" }, { k: "comments", label: "Comentarios" },
  ];
  return (
    <div className="panel">
      {p.published_at && <p className="tem-help">Publicada el {new Date(p.published_at).toLocaleDateString("es-CL", { day: "numeric", month: "long" })}.</p>}
      {p.posts && Object.keys(p.posts).length > 0 && (
        <div className="grupo">
          <div className="grupo__cabeza">En las redes</div>
          <PostsList posts={p.posts} />
        </div>
      )}
      <div className="resultados">
        {fields.map(({ k, label }) => (
          <Field key={k} label={label}>
            <TextInput
              value={r[k] == null ? "" : String(r[k])}
              onCommit={(v) => {
                const n = Number(v.replace(/[^\d]/g, ""));
                setR({ [k]: v.trim() === "" || Number.isNaN(n) ? null : n });
              }}
              ariaLabel={label}
              alignRight
            />
          </Field>
        ))}
      </div>
      <Field label="¿Qué aprendimos?" help="Lo aprendido vuelve a Ideas: así se cierra el ciclo.">
        <TextArea value={r.learned} onCommit={(v) => setR({ learned: v })} placeholder="Qué funcionó, qué no y qué probar la próxima vez" ariaLabel="Qué aprendimos" />
      </Field>
      <div className="fila">
        <AiButton task="aprendizaje" label="Resumir aprendizaje" busyLabel="Leyendo…" onClick={() => void actions.runLearning(p.id)} />
        <button className="tem-btn tem-btn--secundario btn-chico" onClick={() => actions.ideaFromLearning(p.id)}>Crear idea a partir de esto</button>
      </div>
    </div>
  );
}
