
import Editor from "@monaco-editor/react";
import LanguageSelector from "./LanguageSelector";
import { FileCode } from "lucide-react";

export default function CodeEditor({
  fileName,
  code,
  language,
  onLanguageChange,
  onCodeChange,
  theme,
}) {
  const currentLanguage = (language || "javascript").toLowerCase();

  // Monaco uses JavaScript syntax highlighting for React JSX.
  const editorLanguage =
    currentLanguage === "react" ? "javascript" : currentLanguage;

  return (
    <section className="editor-panel">
      <div className="editor-toolbar">
        <div className="active-tab">
          <FileCode size={15} />
          <span>{fileName}</span>
          <span
            className="unsaved-dot"
            title="Changes are saved locally"
          />
        </div>

        <LanguageSelector
          language={currentLanguage}
          onChange={onLanguageChange}
        />
      </div>

      <div className="monaco-container">
        <Editor
          height="100%"
          language={editorLanguage}
          value={code}
          theme={theme || "vs-dark"}
          onChange={(value) => onCodeChange(value ?? "")}
          options={{
            fontSize: 14,
            fontFamily: "'Fira Code', Consolas, monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            scrollBeyondLastLine: false,
            padding: { top: 16 },
            lineNumbers: "on",
            folding: true,
            bracketPairColorization: { enabled: true },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
          }}
        />
      </div>

      <div className="editor-status">
        <span>{currentLanguage.toUpperCase()}</span>
        <span>UTF-8</span>
        <span>Spaces: 2</span>
      </div>
    </section>
  );
}