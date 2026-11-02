// Paneles por etapa de la ficha de la pieza. Mismos componentes en escritorio y móvil.
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useStore, type AiTask } from "../../store";
import { DAY_NAMES_FULL } from "../../lib/dates";
import { PLATFORM_LABEL } from "../../lib/platforms";
import {
  DURATIONS_S,
  EMPTY_SCRIPT,
  HOOK_TEMPLATES,
  SCRIPT_FORMATS,
  SHOT_TEMPLATES,
  deliveryStatus,
  newItem,
  parseLine,
} from "../../lib/stages";
import { EDIT_MODES, checklistFor, deliveryFor, guideFor, suggestedFileName } from "../../lib/formatos";
import FormatGuide from "../FormatGuide";
import { TAG_TO_NETWORK, hasPublishing } from "../../lib/publish";
import type { CheckItem, Network, PostResult, Proposal, Results, Script } from "../../types";
import { BTN_GHOST, BTN_SECONDARY, CheckRow, Hint, INPUT, Label, SELECT, TemplateChip, TextArea, TextInput } from "./ui";

/* -------------------------------------------------------------------------- */
/*  1 · Idea                                                                   */
/* -------------------------------------------------------------------------- */

export function IdeaPanel({ p }: { p: Proposal }) {
  const { actions } = useStore();
  const lineText = p.line.key ? `${p.line.pre}*${p.line.key}*${p.line.post}` : p.line.pre + p.line.post;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <Label right="se guarda solo">Título</Label>
        <TextInput
          value={lineText}
          onCommit={(v) => actions.updateFields(p.id, { line: parseLine(v) })}
          placeholder="Una línea · la palabra clave entre *asteriscos*"
          ariaLabel="Título de la pieza"
          style={{ fontSize: 15, fontWeight: 500 }}
        />
        <Hint>La palabra entre *asteriscos* va en naranja en la pieza.</Hint>
      </div>
      <div>
        <Label>Por qué importa</Label>
        <TextArea
          value={p.notes ?? ""}
          onCommit={(v) => actions.updateFields(p.id, { notes: v })}
          placeholder="Qué le pasa a quien lo ve, qué cambia si lo sabe…"
          ariaLabel="Por qué importa"
          rows={3}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <Label>De dónde salió</Label>
          <TextInput value={p.source ?? ""} onCommit={(v) => actions.updateFields(p.id, { source: v })} placeholder="Reunión, comentario, dato…" ariaLabel="Origen" />
        </div>
        <div>
          <Label>Etiqueta</Label>
          <TextInput value={p.eyebrow} onCommit={(v) => actions.updateFields(p.id, { eyebrow: v.toUpperCase() })} placeholder="EL DATO, EL COSTO…" ariaLabel="Etiqueta de la pieza" />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  2 · Guion                                                                  */
/* -------------------------------------------------------------------------- */

/** Botón secundario para un encargo de IA, con spinner mientras trabaja (H01). */
export function AiButton({ task, label, busyLabel, onClick, title }: { task: AiTask; label: string; busyLabel: string; onClick: () => void; title?: string }) {
  const { aiBusy } = useStore();
  const busy = aiBusy === task;
  return (
    <button
      className="press invert-hover"
      onClick={onClick}
      disabled={aiBusy !== null}
      title={title}
      style={{ ...BTN_SECONDARY, fontSize: 12, padding: "8px 12px" }}
    >
      {busy ? <span className="spinner spinner-sm" aria-hidden="true" /> : <Sparkles size={14} strokeWidth={2.4} />}
      {busy ? busyLabel : label}
    </button>
  );
}

export function GuionPanel({ p }: { p: Proposal }) {
  const { actions } = useStore();
  const s: Script = p.script ?? EMPTY_SCRIPT;
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <AiButton
          task="guion"
          label={s.hook ? "Reescribir guion con IA" : "Escribir guion con IA"}
          busyLabel="Escribiendo el guion…"
          onClick={() => void actions.runScript(p.id)}
          title="Gancho, desarrollo, cierre y tomas a partir de la idea y el formato (se puede deshacer)"
        />
        <AiButton task="tomas" label="Sugerir tomas" busyLabel="Pensando tomas…" onClick={() => void actions.runShots(p.id)} title="Reemplaza la lista de tomas (se puede deshacer)" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <Label>Formato</Label>
          <select value={s.format} onChange={(e) => setScript({ format: e.target.value })} aria-label="Formato" style={{ ...SELECT, width: "100%" }}>
            {SCRIPT_FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <Label>Duración</Label>
          <select
            value={s.duration_s ?? ""}
            onChange={(e) => setScript({ duration_s: e.target.value ? Number(e.target.value) : null })}
            aria-label="Duración"
            style={{ ...SELECT, width: "100%" }}
          >
            <option value="">Sin definir</option>
            {DURATIONS_S.map((d) => <option key={d} value={d}>{d < 120 ? `${d} s` : `${Math.round(d / 60)} min`}</option>)}
          </select>
        </div>
      </div>

      <div>
        <Label right="se guarda solo">Gancho</Label>
        <TextArea value={s.hook} onCommit={(v) => setScript({ hook: v })} placeholder="Los primeros 3 segundos: lo que hace que no pasen de largo." ariaLabel="Gancho" rows={2} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {HOOK_TEMPLATES.map((t) => <TemplateChip key={t} text={t} onPick={() => setScript({ hook: t })} />)}
        </div>
      </div>
      <div>
        <Label>Desarrollo</Label>
        <TextArea value={s.body} onCommit={(v) => setScript({ body: v })} placeholder="El caso, el dato, los pasos. Frases cortas, una idea por línea." ariaLabel="Desarrollo" rows={5} />
      </div>
      <div>
        <Label>Cierre / llamado a la acción</Label>
        <TextArea value={s.cta} onCommit={(v) => setScript({ cta: v })} placeholder="Qué quieres que hagan después de verlo." ariaLabel="Cierre" rows={2} />
      </div>

      <div>
        <Label right={shots.length ? `${shots.length} tomas` : undefined}>Lista de tomas</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {shots.map((sh) => (
            <CheckRow
              key={sh.id}
              checked={sh.done}
              text={sh.text}
              onToggle={() => setShots(shots.map((x) => (x.id === sh.id ? { ...x, done: !x.done } : x)))}
              onRemove={() => setShots(shots.filter((x) => x.id !== sh.id))}
            />
          ))}
          {shots.length === 0 && <Hint>Sin tomas todavía. Añade una o toca una plantilla.</Hint>}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={newShot}
              onChange={(e) => setNewShot(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addShot(newShot)}
              placeholder="Nueva toma · Enter para añadir"
              aria-label="Nueva toma"
              className="tem-textarea"
              style={{ ...INPUT, flex: 1 }}
            />
            <button className="press" onClick={() => addShot(newShot)} disabled={!newShot.trim()} style={BTN_GHOST}>Añadir</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {SHOT_TEMPLATES.filter((t) => !shots.some((x) => x.text === t)).map((t) => (
              <TemplateChip key={t} text={`+ ${t}`} onPick={() => addShot(t)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  3 · Grabar                                                                 */
/* -------------------------------------------------------------------------- */

export function GrabarPanel({ p, onTeleprompter }: { p: Proposal; onTeleprompter?: () => void }) {
  const { actions } = useStore();
  const g = guideFor(p.script?.format);
  const checklist = p.checklist?.length ? p.checklist : checklistFor(p.script?.format);
  const setChecklist = (next: CheckItem[]) => actions.updateFields(p.id, { checklist: next });
  const guideTexts = g.before.join("|");
  const checklistIsGuide = checklist.map((c) => c.text).join("|") === guideTexts;
  const shots = p.shots ?? [];
  const setShots = (next: CheckItem[]) => actions.updateFields(p.id, { shots: next });
  const done = shots.filter((s) => s.done).length;
  const allDone = shots.length > 0 && done === shots.length;
  const title = `${p.line.pre}${p.line.key}${p.line.post}`;
  const delivery = deliveryStatus(p);
  const deliveryOk = delivery.filter((d) => d.done).length;
  const manual = p.delivery?.length ? p.delivery : deliveryFor(p.script?.format);
  const setManual = (next: CheckItem[]) => actions.updateFields(p.id, { delivery: next });
  const [showGuide, setShowGuide] = useState(true);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Hoja de rodaje del formato */}
      <div style={{ border: "1px solid var(--tem-border)", borderRadius: 16, padding: "12px 14px" }}>
        <button
          className="press-sm"
          onClick={() => setShowGuide((v) => !v)}
          aria-expanded={showGuide}
          style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", boxSizing: "border-box" }}
        >
          <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: ".01em", color: "var(--tem-handle)" }}>
            Hoja de rodaje · {g.name}
          </span>
          <span style={{ fontSize: 11, fontWeight: 500, color: "var(--tem-orange)" }}>{showGuide ? "Ocultar" : "Ver"}</span>
        </button>
        {showGuide && (
          <div style={{ marginTop: 12 }}>
            <FormatGuide g={g} compact />
          </div>
        )}
      </div>

      <div>
        <Label right={checklistIsGuide ? undefined : <button className="press-sm" onClick={() => setChecklist(checklistFor(p.script?.format))} style={{ all: "unset", cursor: "pointer", color: "var(--tem-orange)" }}>Usar la lista del formato</button>}>
          Antes de grabar
        </Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {checklist.map((c) => (
            <CheckRow key={c.id} checked={c.done} text={c.text} onToggle={() => setChecklist(checklist.map((x) => (x.id === c.id ? { ...x, done: !x.done } : x)))} />
          ))}
        </div>
      </div>

      {onTeleprompter && g.isVideo && (
        <button
          className="press invert-hover"
          onClick={onTeleprompter}
          disabled={!p.script?.hook}
          title={p.script?.hook ? "Texto grande con desplazamiento automático" : "Escribe el guion para usar el teleprompter"}
          style={{
            all: "unset", cursor: "pointer", textAlign: "center", fontSize: 14, fontWeight: 500, color: "var(--tem-ink)",
            border: "1px solid var(--tem-border)", padding: 12, borderRadius: 12, boxSizing: "border-box",
          }}
        >
          Abrir teleprompter
        </button>
      )}

      <div>
        <Label right={shots.length ? `${done} de ${shots.length}` : undefined}>{g.isVideo ? "Tomas y texto en pantalla" : "Material a entregar"}</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {shots.map((sh, i) => (
            <div key={sh.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <CheckRow big checked={sh.done} text={sh.text} onToggle={() => setShots(shots.map((x) => (x.id === sh.id ? { ...x, done: !x.done } : x)))} />
              {g.isVideo && (
                <div style={{ paddingLeft: 36, display: "flex", flexDirection: "column", gap: 4 }}>
                  <TextInput
                    value={sh.screen ?? ""}
                    onCommit={(v) => actions.updateShot(p.id, sh.id, { screen: v })}
                    placeholder="Texto en pantalla en esta toma (o «sin texto»)"
                    ariaLabel={`Texto en pantalla · toma ${i + 1}`}
                  />
                  <div style={{ fontSize: 11, fontWeight: 400, color: "var(--tem-handle)", fontVariantNumeric: "tabular-nums" }}>
                    Archivo: {suggestedFileName(g, title, i + 1)}
                  </div>
                </div>
              )}
            </div>
          ))}
          {shots.length === 0 && <Hint warn>No hay tomas: vuelve a Guion y añade al menos una.</Hint>}
          {shots.length > 0 && !allDone && (
            <button className="press" onClick={() => setShots(shots.map((x) => ({ ...x, done: true })))} style={{ ...BTN_GHOST, alignSelf: "flex-start" }}>
              Marcar todas como grabadas
            </button>
          )}
        </div>
      </div>

      {g.isVideo && (
        <div>
          <Label>Modo de edición</Label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {EDIT_MODES.map((m) => {
              const on = p.edit_mode === m.key;
              return (
                <button
                  key={m.key}
                  className="press-sm"
                  onClick={() => actions.updateFields(p.id, { edit_mode: on ? null : m.key })}
                  aria-pressed={on}
                  title={m.help}
                  style={{
                    all: "unset", cursor: "pointer", flex: "1 1 120px", padding: "9px 12px", borderRadius: 12, boxSizing: "border-box",
                    border: `1.5px solid ${on ? "var(--tem-orange)" : "var(--tem-ink)"}`, background: on ? "var(--tem-orange)" : "transparent", color: on ? "#fff" : "var(--tem-ink)",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.key} · {m.name}</div>
                  <div style={{ fontSize: 11, fontWeight: 400, lineHeight: 1.35, marginTop: 2, opacity: on ? 0.9 : 0.75 }}>{m.help}</div>
                </button>
              );
            })}
          </div>
          <Hint>Se graba para el modo que corresponde: el editor no empieza sin saberlo.</Hint>
        </div>
      )}

      <div>
        <Label>{g.isVideo ? "Link del bruto" : "Link del material"}</Label>
        <TextInput value={p.raw_url ?? ""} onCommit={(v) => actions.updateFields(p.id, { raw_url: v.trim() })} placeholder="https://drive.google.com/…" ariaLabel="Link del bruto" />
        <Hint>El archivo pesado va por AirDrop al Mac y a Drive como respaldo; aquí solo el enlace. Nombre: {g.fileName}</Hint>
      </div>

      <div style={{ background: "var(--tem-bg)", borderRadius: 16, padding: "12px 14px" }}>
        <Label right={`${deliveryOk} de ${delivery.length}`}>Entrega al editor</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {delivery.map((d) =>
            d.auto ? (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10 }} aria-label={`${d.text}: ${d.done ? "listo" : "falta"}`}>
                <span style={{ width: 20, height: 20, flex: "none", borderRadius: 7, display: "grid", placeItems: "center", background: d.done ? "var(--tem-orange)" : "transparent", border: `1.5px solid ${d.done ? "var(--tem-orange)" : "var(--tem-border-strong)"}` }}>
                  {d.done && <svg width={11} height={11} viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.5 5 9.5 10 3" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 400, lineHeight: 1.35, opacity: d.done ? 0.55 : 1, textDecoration: d.done ? "line-through" : "none" }}>{d.text}</span>
                <span style={{ fontSize: 10, fontWeight: 500, color: "var(--tem-handle)" }}>auto</span>
              </div>
            ) : (
              <CheckRow key={d.id} checked={d.done} text={d.text} onToggle={() => setManual(manual.map((x) => (x.id === d.id ? { ...x, done: !x.done } : x)))} />
            ),
          )}
        </div>
        <Hint>Como en un editor: nada pasa a Editar hasta que todo esté marcado. Así el asistente no renderiza a medias.</Hint>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  4 · Editar                                                                 */
/* -------------------------------------------------------------------------- */

export function EditarPanel({ p }: { p: Proposal }) {
  const { actions } = useStore();
  const tagsText = p.tags.join(" ");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {p.raw_url && (
        <div style={{ fontSize: 12, fontWeight: 400, color: "var(--tem-handle)" }}>
          Bruto: <a href={p.raw_url} target="_blank" rel="noreferrer" style={{ color: "var(--tem-orange)", fontWeight: 500, wordBreak: "break-all" }}>{p.raw_url}</a>
        </div>
      )}
      <div>
        <Label right="se guarda solo">Instrucciones de edición</Label>
        <TextArea
          value={p.notes ?? ""}
          onCommit={(v) => actions.updateFields(p.id, { notes: v })}
          placeholder="Cortes, ritmo, dónde van los subtítulos, qué texto aparece en pantalla…"
          ariaLabel="Instrucciones de edición"
          rows={6}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <AiButton task="cortes" label="Proponer cortes" busyLabel="Pensando los cortes…" onClick={() => void actions.runCuts(p.id)} title="Añade cortes con tiempo y estilo de subtítulos a las instrucciones (se puede deshacer)" />
          <AiButton task="caption" label={p.caption ? "Reescribir caption" : "Escribir caption"} busyLabel="Escribiendo el caption…" onClick={() => void actions.runCaption(p.id)} title="Caption y hashtags para las redes de la pieza (se puede deshacer)" />
        </div>
        <Hint>El corte, los subtítulos y las versiones se hacen fuera de la app; aquí quedan las instrucciones y los links.</Hint>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <Label>Link del video final</Label>
          <TextInput value={p.final_url ?? ""} onCommit={(v) => actions.updateFields(p.id, { final_url: v.trim() })} placeholder="https://drive.google.com/…" ariaLabel="Link del video final" />
        </div>
        <div>
          <Label>Link de la miniatura</Label>
          <TextInput value={p.thumbnail_url ?? ""} onCommit={(v) => actions.updateFields(p.id, { thumbnail_url: v.trim() })} placeholder="Opcional" ariaLabel="Link de la miniatura" />
        </div>
      </div>
      <div>
        <Label right="se guarda solo">Caption</Label>
        <TextArea value={p.caption} onCommit={(v) => actions.updateCaption(p.id, v)} placeholder="El texto que acompaña la pieza." ariaLabel="Caption" rows={3} />
      </div>
      <div>
        <Label>Hashtags</Label>
        <TextInput
          value={tagsText}
          onCommit={(v) => actions.updateFields(p.id, { tags: v.split(/[\s,]+/).filter(Boolean).map((t) => (t.startsWith("#") ? t : `#${t}`)) })}
          placeholder="#marca #TEM"
          ariaLabel="Hashtags"
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  5 · Listo                                                                  */
/* -------------------------------------------------------------------------- */

export function ListoPanel({ p }: { p: Proposal }) {
  const s = useStore();
  const { actions } = s;
  const activeCount = p.platforms.filter((t) => !s.pubOff[t]).length;
  const activeNames = p.platforms.filter((t) => !s.pubOff[t]).map((t) => PLATFORM_LABEL[t]).join(", ");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <Label>Día y hora</Label>
        {/* H05 — selectores en vez de texto libre */}
        <div style={{ display: "flex", gap: 8 }}>
          <select value={p.day} onChange={(e) => actions.updateSchedule(p.id, { day: Number(e.target.value) })} aria-label="Día de publicación" style={{ ...SELECT, flex: 1 }}>
            {DAY_NAMES_FULL.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
          <input type="time" value={p.time} onChange={(e) => actions.updateSchedule(p.id, { time: e.target.value })} aria-label="Hora de publicación" style={{ ...SELECT, width: 118 }} />
        </div>
        <Hint>{p.time ? `Sale el ${DAY_NAMES_FULL[p.day].toLowerCase()} a las ${p.time}${activeNames ? ` en ${activeNames}` : ""}.` : "Sin hora: el asistente sugiere la mejor."}</Hint>
      </div>
      <div>
        <Label>Publicar en</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {p.platforms.map((t) => {
            const on = !s.pubOff[t];
            return (
              <button
                key={t}
                className="press-sm"
                onClick={() => actions.togglePub(t)}
                aria-pressed={on}
                style={{
                  all: "unset", cursor: "pointer", fontSize: 12, fontWeight: 500, padding: "7px 13px", borderRadius: 999,
                  border: `1.5px solid ${on ? "var(--tem-orange)" : "var(--tem-ink)"}`,
                  background: on ? "var(--tem-orange)" : "var(--tem-surface)", color: on ? "#fff" : "var(--tem-ink)",
                }}
              >
                {PLATFORM_LABEL[t]}
              </button>
            );
          })}
        </div>
        <Hint warn={activeCount === 0}>
          {activeCount === 0 ? "Activa al menos una red para poder programar." : "Toca una red para quitarla o volver a incluirla."}
        </Hint>
      </div>
      {p.final_url && (
        <div>
          <Label>Video final</Label>
          <a href={p.final_url} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 500, color: "var(--tem-orange)", wordBreak: "break-all" }}>{p.final_url}</a>
        </div>
      )}
      {hasPublishing ? <PublishBlock p={p} /> : <Hint>Por ahora publicas tú: descarga la imagen, copia el caption y sube el video final.</Hint>}
    </div>
  );
}

/** Próxima fecha (ISO) del día/hora de la pieza, siempre en el futuro. */
function nextSlot(day: number, time: string): string | null {
  if (!time) return null;
  const [hh, mm] = time.split(":").map(Number);
  const d = new Date();
  d.setSeconds(0, 0);
  d.setHours(hh, mm, 0, 0);
  const want = (day + 1) % 7; // 0=lun → getDay 1
  let delta = (want - d.getDay() + 7) % 7;
  if (delta === 0 && d.getTime() <= Date.now() + 60_000) delta = 7;
  d.setDate(d.getDate() + delta);
  return d.toISOString();
}

/** Publicar ahora / programar en las redes activas (robot n8n + Upload-Post). */
function PublishBlock({ p }: { p: Proposal }) {
  const s = useStore();
  const { actions } = s;
  const nets = [...new Set(p.platforms.filter((t) => !s.pubOff[t]).map((t) => TAG_TO_NETWORK[t]).filter((n): n is Network => Boolean(n)))];
  const notConnected = nets.filter((n) => !s.connections[n]);
  const busy = s.publishing === p.id;
  const slot = nextSlot(p.day, p.time);
  const missing = !p.final_url ? "Falta el link del video final (en Editar)." : nets.length === 0 ? "Activa al menos una red." : notConnected.length ? `Conecta ${notConnected.join(", ")} en Perfil.` : null;
  const btn = (label: string, onClick: () => void, primary: boolean) => (
    <button
      className={primary ? "press" : "press invert-hover"}
      onClick={onClick}
      disabled={Boolean(missing) || busy}
      title={missing ?? label}
      style={{
        all: "unset", cursor: "pointer", flex: 1, textAlign: "center", fontSize: 13, fontWeight: 500, padding: "10px 14px", borderRadius: 999, boxSizing: "border-box",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        background: primary ? "var(--tem-ink)" : "transparent", color: primary ? "#fff" : "var(--tem-ink)", border: primary ? "none" : "1px solid var(--tem-border)",
      }}
    >
      {busy && <span className="spinner" aria-hidden="true" />}
      {busy ? "Publicando…" : label}
    </button>
  );
  return (
    <div style={{ background: "var(--tem-bg)", borderRadius: 16, padding: "12px 14px" }}>
      <Label>Publicar en las redes</Label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {btn("Publicar ahora", () => void actions.publishPiece(p.id, null), true)}
        {slot && btn(`Programar · ${DAY_NAMES_FULL[p.day]} ${p.time}`, () => void actions.publishPiece(p.id, slot), false)}
      </div>
      <Hint warn={Boolean(missing)}>{missing ?? `Sube el video final a ${nets.join(", ")} con el caption de la pieza. Tarda lo que tarde el video en subir.`}</Hint>
      {p.posts && <PostsList posts={p.posts} />}
    </div>
  );
}

/** Resultado por red: link, programada o error. */
function PostsList({ posts }: { posts: Record<string, PostResult> }) {
  const NAME: Record<string, string> = { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", linkedin: "LinkedIn" };
  return (
    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
      {Object.entries(posts).map(([k, r]) => (
        <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 500 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, flex: "none", background: r.ok ? "var(--tem-orange)" : "var(--tem-handle)" }} />
          <span style={{ fontWeight: 600 }}>{NAME[k] ?? k}</span>
          {r.url ? (
            <a href={r.url} target="_blank" rel="noreferrer" style={{ color: "var(--tem-orange)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.url}</a>
          ) : r.scheduled ? (
            <span style={{ color: "var(--tem-handle)" }}>programada{r.scheduled_date ? ` · ${new Date(r.scheduled_date).toLocaleString("es-CL", { weekday: "short", hour: "2-digit", minute: "2-digit" })}` : ""}</span>
          ) : r.pending ? (
            <span style={{ color: "var(--tem-handle)" }}>subiendo…</span>
          ) : r.ok ? (
            <span style={{ color: "var(--tem-handle)" }}>publicada</span>
          ) : (
            <span style={{ color: "var(--tem-orange)" }}>{r.error ?? "falló"}</span>
          )}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  6 · Publicado                                                              */
/* -------------------------------------------------------------------------- */

const EMPTY_RESULTS: Results = { views: null, likes: null, saves: null, comments: null, learned: "" };

export function PublicadoPanel({ p }: { p: Proposal }) {
  const { actions } = useStore();
  const r = p.results ?? EMPTY_RESULTS;
  const setR = (patch: Partial<Results>) => actions.updateFields(p.id, { results: { ...r, ...patch } });
  const fields: { k: keyof Omit<Results, "learned">; label: string }[] = [
    { k: "views", label: "Vistas" }, { k: "likes", label: "Me gusta" }, { k: "saves", label: "Guardados" }, { k: "comments", label: "Comentarios" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {p.published_at && <Hint>Publicada el {new Date(p.published_at).toLocaleDateString("es-CL", { day: "numeric", month: "long" })}.</Hint>}
      {p.posts && Object.keys(p.posts).length > 0 && (
        <div>
          <Label>En las redes</Label>
          <PostsList posts={p.posts} />
        </div>
      )}
      <div>
        <Label right="se guarda solo">Resultados</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {fields.map(({ k, label }) => (
            <div key={k}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "var(--tem-handle)", marginBottom: 4 }}>{label}</div>
              <NumberInput value={r[k]} onCommit={(v) => setR({ [k]: v })} ariaLabel={label} />
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label>¿Qué aprendimos?</Label>
        <TextArea value={r.learned} onCommit={(v) => setR({ learned: v })} placeholder="Tres líneas: qué funcionó, qué no y qué probar la próxima vez." ariaLabel="Qué aprendimos" rows={3} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <AiButton task="aprendizaje" label="¿Qué aprendimos?" busyLabel="Leyendo los resultados…" onClick={() => void actions.runLearning(p.id)} title="Tres líneas a partir de los resultados y una idea para la próxima pieza (se puede deshacer)" />
          <button
            className="press invert-hover"
            onClick={() => actions.ideaFromLearning(p.id)}
            title="Crea una idea nueva en el tablero con lo aprendido (se puede deshacer)"
            style={{ ...BTN_SECONDARY, fontSize: 12, padding: "8px 12px" }}
          >
            Crear idea a partir de esto
          </button>
        </div>
        <Hint>El aprendizaje vuelve a Ideas: así se cierra el ciclo.</Hint>
      </div>
    </div>
  );
}

function NumberInput({ value, onCommit, ariaLabel }: { value: number | null; onCommit: (v: number | null) => void; ariaLabel: string }) {
  return (
    <TextInput
      value={value == null ? "" : String(value)}
      onCommit={(v) => {
        const n = Number(v.replace(/[^\d]/g, ""));
        onCommit(v.trim() === "" || Number.isNaN(n) ? null : n);
      }}
      placeholder="—"
      ariaLabel={ariaLabel}
      style={{ textAlign: "center", fontWeight: 500 }}
    />
  );
}
