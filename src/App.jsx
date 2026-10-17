
import { useEffect, useState } from "react";

import Header from "./components/Header";
import FileExplorer from "./components/FileExplorer";
import CodeEditor from "./components/CodeEditor";
import OutputPanel from "./components/OutputPanel";
import { executeCode } from "./services/codeRunner";

import "./index.css";

const STORAGE_KEY = "codespace-project-v1";


const languageExamples = {
  javascript: `// Hello World
console.log("Hello, World!");`,

  python: `# Hello World
print("Hello, World!")`,

  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");   
    }
}`,

  cpp: `#include <iostream>
#include <algorithm>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,

  c: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,

  typescript: `const a: number = 10;
const b: number = 20;

console.log("Hello, World!");`,

  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CodeSpace Demo</title>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>Welcome to CodeSpace.</p>
  <button onclick="alert('Button clicked!')">
    Click Me
  </button>
</body>
</html>`,

  css: `body {
  font-family: Arial, sans-serif;
  background: #f1f5f9;
  padding: 24px;
}

h1 {
  color: #4f46e5;
}`,

  json: `{
  "message": "Hello, World!",
  "language": "CodeSpace",
  "success": true
}`,

  react: `import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: 24, fontFamily: "Arial" }}>
      <h1>Hello, React!</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Click Me
      </button>
    </div>
  );
}`
};

const initialFiles = [
  {
    name: "index.js",
    language: "javascript",
    code: languageExamples.javascript,
  },
  {
    name: "index.html",
    language: "html",
    code: languageExamples.html,
  },
  {
    name: "style.css",
    language: "css",
    code: languageExamples.css,
  },
  {
    name: "App.jsx",
    language: "react",
    code: languageExamples.react,
  },
  {
    name: "python.py",
    language: "python",
    code: languageExamples.python,
  },
  {
    name: "Main.java",
    language: "java",
    code: languageExamples.java,
  },
  {
    name: "main.cpp",
    language: "cpp",
    code: languageExamples.cpp,
  },
  {
    name: "main.c",
    language: "c",
    code: languageExamples.c,
  },
];

const extensionMap = {
  js: "javascript",
  jsx: "react",
  ts: "typescript",
  tsx: "react",
  py: "python",
  java: "java",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  c: "c",
  html: "html",
  htm: "html",
  css: "css",
  json: "json",
};

function detectLanguage(fileName) {
  const extension = fileName.split(".").pop().toLowerCase();
  return extensionMap[extension] || "plaintext";
}

function loadFiles() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return initialFiles;

    const parsed = JSON.parse(saved);

    if (
      !Array.isArray(parsed) ||
      parsed.length === 0 ||
      !parsed.every(
        (file) =>
          typeof file.name === "string" &&
          typeof file.code === "string" &&
          typeof file.language === "string"
      )
    ) {
      return initialFiles;
    }

    return parsed;
  } catch {
    return initialFiles;
  }
}

function getErrorMessage(error) {
  const data = error?.response?.data;

  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.error) return data.error;

  return error?.message || "Code execution failed.";
}

function normalizeOutput(result) {
  if (result && typeof result === "object" && "text" in result) {
    return [
      {
        type: result.type || "log",
        text: String(result.text ?? ""),
      },
    ];
  }

  if (Array.isArray(result)) {
    return result.map((item) => {
      if (item && typeof item === "object") {
        return {
          type: item.type || "log",
          text: String(item.text ?? item.output ?? ""),
        };
      }

      return {
        type: "log",
        text: String(item),
      };
    });
  }

  if (result && typeof result === "object") {
    const entries = [];

    if (result.stdout) {
      entries.push({
        type: "log",
        text: String(result.stdout),
      });
    }

    if (result.stderr) {
      entries.push({
        type: "error",
        text: String(result.stderr),
      });
    }

    if (result.compile_output) {
      entries.push({
        type: "error",
        text: String(result.compile_output),
      });
    }

    if (result.error || result.message) {
      entries.push({
        type: "error",
        text: String(result.error || result.message),
      });
    }

    if (entries.length > 0) return entries;

    return [
      {
        type: "log",
        text: JSON.stringify(result, null, 2),
      },
    ];
  }

  return [
    {
      type: "log",
      text: result == null ? "" : String(result),
    },
  ];
}

export default function App() {
  // All React hooks belong inside the component.
  const [files, setFiles] = useState(loadFiles);
  const [stdin, setStdin] = useState("");

  const [activeFile, setActiveFile] = useState(() => {
    const savedFiles = loadFiles();

    if (savedFiles.some((file) => file.name === "index.js")) {
      return "index.js";
    }

    return savedFiles[0].name;
  });

  const [theme, setTheme] = useState("vs-dark");
  const [output, setOutput] = useState([]);
  const [running, setRunning] = useState(false);
  const [preview, setPreview] = useState(null);
  const [showHome, setShowHome] = useState(true);

  const currentFile =
    files.find((file) => file.name === activeFile) || files[0];

  useEffect(() => {
    document.documentElement.dataset.theme =
      theme === "vs-dark" ? "dark" : "light";
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    } catch {
      setOutput((previous) => [
        ...previous,
        {
          type: "error",
          text: "Unable to save locally. Browser storage may be full.",
        },
      ]);
    }
  }, [files]);

  function updateCurrentCode(code) {
    setFiles((previous) =>
      previous.map((file) =>
        file.name === currentFile.name ? { ...file, code } : file
      )
    );
  }

  function updateCurrentLanguage(language) {
    setFiles((previous) =>
      previous.map((file) =>
        file.name === currentFile.name
          ? {
              ...file,
              language,
              code: languageExamples[language] ?? file.code,
            }
          : file
      )
    );

    setPreview(null);
    setOutput([]);
  }

  function createFile(name) {
    const normalizedName = name.trim();

    if (!normalizedName) return;

    const exists = files.some(
      (file) => file.name.toLowerCase() === normalizedName.toLowerCase()
    );

    if (exists) {
      setOutput([
        {
          type: "error",
          text: `File "${normalizedName}" already exists.`,
        },
      ]);
      return;
    }

    const language = detectLanguage(normalizedName);

    const newFile = {
      name: normalizedName,
      language,
      code: languageExamples[language] ?? "",
    };

    setFiles((previous) => [...previous, newFile]);
    setActiveFile(normalizedName);
    setPreview(null);
    setOutput([]);
    setStdin("");
  }

  function deleteFile(name) {
    if (files.length <= 1) {
      setOutput([
        {
          type: "error",
          text: "At least one file must remain in the project.",
        },
      ]);
      return;
    }

    const remaining = files.filter((file) => file.name !== name);

    setFiles(remaining);

    if (activeFile === name) {
      setActiveFile(remaining[0].name);
      setPreview(null);
      setStdin("");
    }

    setOutput([]);
  }

  function saveProject() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files));

      setOutput([
        {
          type: "success",
          text: "Project saved in this browser.",
        },
      ]);
    } catch {
      setOutput([
        {
          type: "error",
          text: "Could not save the project. Check browser storage.",
        },
      ]);
    }
  }

  async function runCode() {
    if (running) return;

    if (!currentFile) {
      setOutput([
        {
          type: "error",
          text: "Please select a file.",
        },
      ]);
      return;
    }

    const language = currentFile.language;

    // Live preview for React, HTML and CSS.
    if (["react", "html", "css"].includes(language)) {
      const htmlFile = files.find((file) => file.language === "html");
      const cssFile = files.find((file) => file.language === "css");

      if (language === "react") {
        setPreview({
          language: "react",
          code: currentFile.code,
          html: "",
          css: cssFile?.code || "",
        });
      } else if (language === "html") {
        setPreview({
          language: "html",
          code: currentFile.code,
          html: currentFile.code,
          css: cssFile?.code || "",
        });
      } else {
        setPreview({
          language: "css",
          code: currentFile.code,
          html: htmlFile?.code || "",
          css: currentFile.code,
        });
      }

      setOutput([
        {
          type: "success",
          text: `${language.toUpperCase()} preview updated successfully.`,
        },
      ]);

      return;
    }

    const supportedLanguages = [
      "javascript",
      "python",
      "java",
      "cpp",
      "c",
    ];

    if (!supportedLanguages.includes(language)) {
      setOutput([
        {
          type: "error",
          text: `Execution is not configured for ${language}.`,
        },
      ]);
      return;
    }

    setPreview(null);
    setRunning(true);

    setOutput([
      {
        type: "info",
        text: `Executing ${language} code...`,
      },
    ]);

    try {
      // Pass the program input to Judge0.
      const result = await executeCode(
        currentFile.code,
        language,
        stdin
      );

      setOutput(normalizeOutput(result));
    } catch (error) {
      setOutput([
        {
          type: "error",
          text: getErrorMessage(error),
        },
      ]);
    } finally {
      setRunning(false);
    }
  }

  if (!currentFile) {
    return (
      <div className="app-shell">
        No files found. Refresh the page.
      </div>
    );
  }

  // Public SEO-friendly homepage. The existing editor remains intact below.
  if (showHome) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 55%, #ecfeff 100%)",
          color: "#0f172a",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            padding: "20px clamp(20px, 6vw, 80px)",
            background: "rgba(255,255,255,0.9)",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <a
            href="/"
            aria-label="CodeSpace homepage"
            style={{ color: "#4338ca", fontSize: "22px", fontWeight: 800, textDecoration: "none" }}
          >
            CodeSpace
          </a>
          <button
            type="button"
            onClick={() => setShowHome(false)}
            style={{
              border: 0,
              borderRadius: "10px",
              background: "#4f46e5",
              color: "#fff",
              padding: "11px 18px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Open Code Editor
          </button>
        </header>

        <main style={{ maxWidth: "1080px", margin: "0 auto", padding: "64px 24px 48px" }}>
          <section style={{ textAlign: "center", padding: "28px 0 48px" }}>
            <p
              style={{
                display: "inline-block",
                margin: "0 0 18px",
                padding: "8px 13px",
                borderRadius: "999px",
                background: "#e0e7ff",
                color: "#3730a3",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              A simple browser-based coding workspace
            </p>
            <h1
              style={{
                maxWidth: "850px",
                margin: "0 auto 20px",
                fontSize: "clamp(36px, 6vw, 62px)",
                lineHeight: 1.08,
                letterSpacing: "-0.04em",
              }}
            >
              Free Online React Compiler and Code Editor
            </h1>
            <p
              style={{
                maxWidth: "760px",
                margin: "0 auto",
                color: "#475569",
                fontSize: "18px",
                lineHeight: 1.8,
              }}
            >
              Write and practice React, JSX, JavaScript, HTML, and CSS in an
              online coding workspace. Edit files, run supported programs, and
              preview web code directly in your browser.
            </p>
            <button
              type="button"
              onClick={() => setShowHome(false)}
              style={{
                marginTop: "28px",
                border: 0,
                borderRadius: "12px",
                background: "#4f46e5",
                color: "#fff",
                padding: "15px 24px",
                fontSize: "16px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 10px 24px rgba(79,70,229,0.22)",
              }}
            >
              Start Coding →
            </button>
            <p style={{ marginTop: "12px", color: "#64748b", fontSize: "13px" }}>
              Open the editor to try the available examples and tools.
            </p>
          </section>

          <section aria-labelledby="features-heading" style={{ padding: "24px 0 36px" }}>
            <h2
              id="features-heading"
              style={{ textAlign: "center", fontSize: "clamp(25px, 4vw, 36px)", marginBottom: "24px" }}
            >
              Features of the Online Code Editor
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "18px",
              }}
            >
              {[
                {
                  title: "React and JSX Practice",
                  description: "Practice React component code and JSX examples in the coding workspace.",
                },
                {
                  title: "HTML and CSS Preview",
                  description: "Edit HTML and CSS examples and view the available live preview.",
                },
                {
                  title: "Multiple Code Files",
                  description: "Create, select, edit, and manage files in your browser-based project.",
                },
                {
                  title: "Programming Examples",
                  description: "Explore examples for JavaScript, Python, Java, C, and C++ where execution is configured.",
                },
              ].map((feature) => (
                <article
                  key={feature.title}
                  style={{
                    padding: "24px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "18px",
                    background: "rgba(255,255,255,0.9)",
                    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
                  }}
                >
                  <h3 style={{ margin: "0 0 10px", fontSize: "19px" }}>{feature.title}</h3>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>{feature.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="how-to-heading"
            style={{
              marginTop: "20px",
              padding: "28px",
              borderRadius: "20px",
              background: "#fff",
              border: "1px solid #e2e8f0",
            }}
          >
            <h2 id="how-to-heading" style={{ marginTop: 0, fontSize: "26px" }}>
              How to Use the Online Code Editor
            </h2>
            <ol style={{ color: "#475569", lineHeight: 1.9, paddingLeft: "22px" }}>
              <li>Choose an example file or create a new file in the editor.</li>
              <li>Write or update your code in the editor panel.</li>
              <li>Use Run Code to execute supported languages or update web previews.</li>
              <li>Save your project in your browser when you want to keep your changes.</li>
            </ol>
            <button
              type="button"
              onClick={() => setShowHome(false)}
              style={{
                border: 0,
                borderRadius: "10px",
                background: "#0f172a",
                color: "#fff",
                padding: "12px 18px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Try the Code Editor
            </button>
          </section>
        </main>

        <footer
          style={{
            padding: "24px",
            textAlign: "center",
            borderTop: "1px solid #e2e8f0",
            color: "#64748b",
            fontSize: "14px",
          }}
        >
          © {new Date().getFullYear()} CodeSpace. Online coding workspace for learning and practice.
        </footer>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div style={{ padding: "8px 16px", display: "flex", justifyContent: "flex-start" }}>
        <button
          type="button"
          onClick={() => setShowHome(true)}
          style={{
            border: "1px solid #64748b",
            borderRadius: "8px",
            background: "transparent",
            color: "inherit",
            padding: "7px 12px",
            cursor: "pointer",
          }}
        >
          ← Home
        </button>
      </div>
      <Header
        theme={theme}
        setTheme={setTheme}
        onRun={runCode}
        onSave={saveProject}
        running={running}
      />

      <main className="workspace">
        <FileExplorer
          files={files}
          activeFile={currentFile.name}
          onSelect={(name) => {
            setActiveFile(name);
            setPreview(null);
            setOutput([]);
            setStdin("");
          }}
          onCreate={createFile}
          onDelete={deleteFile}
        />

        <div className="work-area">
          <div className="breadcrumbs">
            <span>workspace</span>
            <span>/</span>
            <strong>{currentFile.name}</strong>
          </div>

          <div className="editor-output-layout">
            <CodeEditor
              fileName={currentFile.name}
              code={currentFile.code}
              language={currentFile.language}
              onLanguageChange={updateCurrentLanguage}
              onCodeChange={updateCurrentCode}
              theme={theme}
            />

            <OutputPanel
              output={output}
              onClear={() => setOutput([])}
              preview={preview}
              stdin={stdin}
              onStdinChange={setStdin}
            />
          </div>
        </div>
      </main>

      <footer className="bottom-status">
        <span>● CodeSpace</span>
        <span>{currentFile.language}</span>
        <span>● mastanVali</span>
      </footer>
    </div>
  );
}
