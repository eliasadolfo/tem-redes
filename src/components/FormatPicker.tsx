import { useState } from "react";
import { useStore } from "../store";
import { pieceTitle } from "../lib/platforms";
import {
  THEME_BACKDROP,
  defaultOrientation,
  formatsFor,
  guideFor,
  recordFormatOf,
  suggestFormat,
  themeOf,
  type IdeaTheme,
  type Orientation,
  type RecordFormat,
} from "../lib/formatos";
import { Mock } from "./FormatGuide";
import type { Proposal } from "../types";

/** Maqueta chica del encuadre, dónde te paras, qué se ve detrás e instrucciones. */
export function HowToRecord({ record, theme }: { record: RecordFormat; theme: IdeaTheme }) {
  const g = guideFor(record.script);
  const horizontal = record.orientation === "horizontal";
  // Al grabar manda el cuadro de la cámara: uno horizontal no tiene las zonas de la pieza vertical.
  const frame = {
    orientation: record.orientation,
    aspect: horizontal ? "16:9" : g.aspect,
    canvas: horizontal ? { w: 1920, h: 1080 } : g.canvas,
    safe: horizontal ? { top: 0, bottom: 0, left: 0, right: 0 } : g.safe,
    layers: record.frame,
  };
  return (
    <div className="como-grabar">
      <Mock g={frame} scale={horizontal ? 0.5 : 0.56} />
      <div className="como-grabar__texto">
        <p><span className="medio">Dónde te paras: </span>{record.stand}</p>
        <p><span className="medio">Qué se ve detrás: </span>{THEME_BACKDROP[theme]}</p>
        <ul>{record.tips.map((t) => <li key={t}>{t}</li>)}</ul>
      </div>
    </div>
  );
}

interface PickerProps {
  orientation: Orientation;
  onOrientation: (o: Orientation) => void;
  record: RecordFormat;
  suggestion: { format: RecordFormat; why: string };
  theme: IdeaTheme;
  onPick: (r: RecordFormat) => void;
}

/** Vertical u horizontal, sus formatos con la sugerencia marcada y cómo grabarlo. */
export default function FormatPicker({ orientation, onOrientation, record, suggestion, theme, onPick }: PickerProps) {
  const options = formatsFor(orientation);
  return (
    <div className="formato">
      <div className="formato__fila">
        <div className="tem-field">
          <span className="tem-label" id="l-orientacion">Se graba</span>
          <div className="segmento" role="group" aria-labelledby="l-orientacion">
            {(["vertical", "horizontal"] as Orientation[]).map((o) => (
              <button key={o} aria-pressed={orientation === o} onClick={() => onOrientation(o)}>{o === "vertical" ? "Vertical" : "Horizontal"}</button>
            ))}
          </div>
        </div>
        <div className="tem-field">
          <label className="tem-label">
            Formato
            <select
              className="tem-select"
              style={{ marginTop: 6 }}
              value={record.key}
              onChange={(e) => {
                const next = options.find((f) => f.key === e.target.value);
                if (next) onPick(next);
              }}
            >
              {options.map((f) => <option key={f.key} value={f.key}>{f.name}{f.key === suggestion.format.key ? " (sugerido)" : ""}</option>)}
            </select>
          </label>
        </div>
      </div>
      <p className="tem-help">{record.key === suggestion.format.key ? `Sugerido: ${suggestion.why}` : `Sugerido: ${suggestion.format.name}. ${suggestion.why}`}</p>
      <HowToRecord record={record} theme={theme} />
    </div>
  );
}

/** El mismo selector sobre una pieza guardada: cada cambio se guarda solo. */
export function PieceFormat({ p }: { p: Proposal }) {
  const { actions } = useStore();
  const [orientation, setOrientation] = useState<Orientation>(defaultOrientation(p));
  const title = pieceTitle(p);
  const theme = themeOf(title, p.eyebrow);
  const suggestion = suggestFormat(theme, orientation, title, p.type);
  const saved = recordFormatOf(p);
  const record = saved?.orientation === orientation ? saved : suggestion.format;

  const change = (o: Orientation) => {
    setOrientation(o);
    if (saved) actions.setRecordFormat(p.id, suggestFormat(theme, o, title).format);
  };

  return <FormatPicker orientation={orientation} onOrientation={change} record={record} suggestion={suggestion} theme={theme} onPick={(r) => actions.setRecordFormat(p.id, r)} />;
}
