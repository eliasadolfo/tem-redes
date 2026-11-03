import { useState } from "react";
import { useStore } from "../store";
import { HANDLE, VARIANTS } from "../data/mock";
import { guideFor, pieceFormat } from "../lib/formatos";
import Card916 from "../components/Card916";
import { downloadPiecePng } from "../lib/exportCard";
import { AdvanceBar, StageHeader, StageSections } from "../components/stages/StageFlow";
import Teleprompter from "../components/Teleprompter";

/** Ficha de la pieza en el teléfono: la misma lógica por etapa que en escritorio. */
export default function EditSheet() {
  const s = useStore();
  const { actions } = s;
  const work = s.proposals.find((p) => p.id === s.work);
  const [exporting, setExporting] = useState(false);
  const [tele, setTele] = useState(false);

  if (!work) return null;

  const cur = VARIANTS[s.variant];
  const guide = guideFor(pieceFormat(work));
  const horizontal = guide.orientation === "horizontal";

  const exportPng = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const r = await downloadPiecePng(work, cur);
      actions.flash(`Imagen descargada: ${r.width}×${r.height} px`);
    } catch {
      actions.flash("No pude crear la imagen. Vuelve a intentarlo en unos segundos.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="hoja-movil">
      <div className="hoja-movil__cabeza">
        <div className="pila pila--chica" style={{ flex: 1 }}>
          <button className="tem-btn tem-btn--texto ficha__volver" onClick={actions.closeWork}>Volver</button>
          <StageHeader p={work} compact />
        </div>
      </div>

      <div className="hoja-movil__scroll">
        <StageSections p={work} slots={{ onTeleprompter: () => setTele(true) }} />

        <div className="fila" style={{ alignItems: "flex-start", flexWrap: "nowrap", gap: 16 }}>
          <Card916 line={work.line} variant={cur} handle={HANDLE} aspect={guide.aspect} width={horizontal ? 180 : 120} />
          <div className="pila pila--chica crece">
            {!horizontal && (
              <div className="tem-field">
                <label className="tem-label" htmlFor="estilo-movil">Estilo</label>
                <select id="estilo-movil" className="tem-select" value={s.variant} onChange={(e) => actions.setVariant(Number(e.target.value) as 0 | 1 | 2)}>
                  {VARIANTS.map((v, i) => <option key={v.name} value={i}>{v.name}</option>)}
                </select>
              </div>
            )}
            <button className="tem-btn tem-btn--secundario" onClick={() => void exportPng()} disabled={exporting}>
              {exporting && <span className="spinner" aria-hidden="true" />}
              {exporting ? "Creando…" : horizontal ? "Descargar miniatura" : "Descargar imagen"}
            </button>
          </div>
        </div>

        <button className="tem-btn tem-btn--peligro" onClick={() => actions.reject(work.id)}>Descartar pieza</button>
        {tele && <Teleprompter p={work} onClose={() => setTele(false)} />}
      </div>

      <div className="hoja-movil__pie"><AdvanceBar p={work} /></div>
    </div>
  );
}
