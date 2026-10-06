import { useStore } from "../store";
import Sidebar from "./Sidebar";
import Calendar from "./Calendar";
import Copilot from "./Copilot";
import Inbox from "./Inbox";
import Library from "./Library";
import Metrics from "./Metrics";
import Newsletter from "./Newsletter";
import Profile from "./Profile";

export default function DesktopApp() {
  const { view, work } = useStore();

  let content;
  if (work) content = <Copilot />;
  else if (view === "calendar") content = <Calendar />;
  else if (view === "inbox") content = <Inbox />;
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
