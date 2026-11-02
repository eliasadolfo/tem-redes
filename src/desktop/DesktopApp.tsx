import { useStore } from "../store";
import Sidebar from "./Sidebar";
import Tablero from "./Tablero";
import Ideas from "./Ideas";
import Calendar from "./Calendar";
import Copilot from "./Copilot";
import Library from "./Library";
import Metrics from "./Metrics";
import Newsletter from "./Newsletter";
import Profile from "./Profile";
import RecordSession from "../components/RecordSession";

export default function DesktopApp() {
  const { view, work } = useStore();

  let content;
  if (work) content = <Copilot />;
  else if (view === "tablero") content = <Tablero />;
  else if (view === "ideas") content = <Ideas />;
  else if (view === "grabar") content = <RecordSession />;
  else if (view === "calendar") content = <Calendar />;
  else if (view === "library") content = <Library />;
  else if (view === "metrics") content = <Metrics />;
  else if (view === "newsletter") content = <Newsletter />;
  else content = <Profile />;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--tem-bg)" }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0 }}>{content}</main>
    </div>
  );
}
