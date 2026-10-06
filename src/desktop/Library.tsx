import { useStore } from "../store";
import { GALLERY, LIB_CHIPS, HANDLE } from "../data/mock";
import Card916 from "../components/Card916";

export default function Library() {
  const { libFilter, actions } = useStore();
  const items = libFilter === "Todas" ? GALLERY : GALLERY.filter((g) => g.net === libFilter);

  return (
    <div style={{ padding: "32px 40px" }}>
      <div className="eyebrow">Biblioteca</div>
      <h1 style={{ margin: "6px 0 20px", fontWeight: 700, fontSize: 30, letterSpacing: "-.02em" }}>
        Tu contenido
      </h1>

      {/* filtros */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {LIB_CHIPS.map((f) => {
          const active = libFilter === f;
          return (
            <button
              key={f}
              className="press"
              onClick={() => actions.setLib(f)}
              style={{
                all: "unset", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: "7px 14px",
                borderRadius: 999, border: "1.5px solid var(--tem-ink)",
                background: active ? "var(--tem-ink)" : "var(--tem-surface)",
                color: active ? "#fff" : "var(--tem-ink)",
              }}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* galería */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))",
          gap: 18,
        }}
      >
        {items.map((g, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Card916
              eyebrow={g.eyebrow}
              line={{ pre: g.pre, key: g.key, post: g.post }}
              bg={g.bg}
              fg={g.fg}
              handle={HANDLE}
              style={{ boxShadow: "var(--sh-card)" }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2px" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--tem-handle)" }}>{g.platStr}</span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{g.reach}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
