import { Code2, Sun, Moon, Play, Save } from "lucide-react";

export default function Header({
  theme,
  setTheme,
  onRun,
  onSave,
  running,
}) {
  return (
    <header className="topbar">
      <div className="brand">
        <Code2 size={27} />
        <span>Code<span className="brand-accent">Space</span></span>
        <span className="version">WEB IDE</span>
      </div>

      <div className="header-actions">
        <button className="icon-button" onClick={onSave} title="Save project">
          <Save size={17} />
          <span>Save</span>
        </button>

        <button
          className="icon-button"
          onClick={() => setTheme(theme === "vs-dark" ? "light" : "vs-dark")}
          title="Change theme"
        >
          {theme === "vs-dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <button className="run-button" onClick={onRun} disabled={running}>
          <Play size={16} fill="currentColor" />
          {running ? "Running..." : "Run Code"}
        </button>
      </div>
    </header>
  );
}