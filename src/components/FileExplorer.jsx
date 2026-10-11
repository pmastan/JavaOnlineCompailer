
import { useState } from "react";
import {
  Files,
  FileCode,
  FilePlus,
  Trash2,
  ChevronRight,
} from "lucide-react";

export default function FileExplorer({
  files,
  activeFile,
  language,
  onSelect,
  onCreate,
  onDelete,
}) {
  const [creating, setCreating] = useState(false);
  const [fileName, setFileName] = useState("");

  const extensionMap = {
    javascript: ".js",
    typescript: ".ts",
    python: ".py",
    java: ".java",
    cpp: ".cpp",
    c: ".c",
    html: ".html",
    css: ".css",
    json: ".json",
    react: ".jsx",
  };

  function createFile(e) {
    e.preventDefault();

    let name = fileName.trim();

    if (!name) return;

    // Add the selected language's extension if missing.
    if (!name.includes(".")) {
      name += extensionMap[language] || ".txt";
    }

    // Prevent duplicate filenames.
    if (
      files.some(
        (file) => file.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      alert("A file with this name already exists.");
      return;
    }

    onCreate(name);
    setFileName("");
    setCreating(false);
  }

  return (
    <aside className="explorer">
      <div className="panel-heading">
        <span>EXPLORER</span>

        <button
          type="button"
          className="small-icon"
          onClick={() => setCreating(!creating)}
          title="New file"
        >
          <FilePlus size={17} />
        </button>
      </div>

      <div className="project-name">
        <ChevronRight size={15} />
        <Files size={15} />
        <span>MY PROJECT</span>
      </div>

      {creating && (
        <form className="new-file-form" onSubmit={createFile}>
          <input
            autoFocus
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="example"
            aria-label="New file name"
          />

          <button type="submit">Add</button>
        </form>
      )}

      <div className="file-list">
        {files.map((file) => (
          <div
            key={file.name}
            className={`file-item ${
              activeFile === file.name ? "active" : ""
            }`}
          >
            <button
              type="button"
              className="file-select"
              onClick={() => onSelect(file.name)}
            >
              <FileCode size={16} />
              <span>{file.name}</span>
            </button>

            {files.length > 1 && (
              <button
                type="button"
                className="delete-file"
                title={`Delete ${file.name}`}
                onClick={() => {
                  if (window.confirm(`Delete ${file.name}?`)) {
                    onDelete(file.name);
                  }
                }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="explorer-footer">
        {files.length} file{files.length !== 1 ? "s" : ""}
      </div>
    </aside>
  );
}
