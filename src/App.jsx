
import { useEffect, useState } from "react";

import Header from "./components/Header";
import FileExplorer from "./components/FileExplorer";
import CodeEditor from "./components/CodeEditor";
import OutputPanel from "./components/OutputPanel";
import { executeCode } from "./services/codeRunner";

import "./index.css";

const STORAGE_KEY = "codespace-project-v1";

const languageExamples = {
  javascript: `const name = "Developer";
console.log("Hello, " + name);

const numbers = [10, 20, 30, 40, 50];
console.log("Numbers:", numbers);
console.log("Total:", numbers.reduce((sum, n) => sum + n, 0));`,

  typescript: `function greet(name: string): string {
  return "Hello, " + name + "!";
}

console.log(greet("Developer"));`,

  python: `name = input("Enter your name: ")
age = int(input("Enter your age: "))

print("Hello,", name)
print("Age:", age)`,

  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        System.out.print("Enter your name: ");
        String name = sc.nextLine();

        System.out.print("Enter your age: ");
        int age = Integer.parseInt(sc.nextLine());

        System.out.println("Hello, " + name);
        System.out.println("Age: " + age);

        sc.close();
    }
}`,

  cpp: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string name;
    int age;

    cout << "Enter your name: ";
    getline(cin, name);

    cout << "Enter your age: ";
    cin >> age;

    cout << "Hello, " << name << endl;
    cout << "Age: " << age << endl;

    return 0;
}`,

  c: `#include <stdio.h>
#include <string.h>

int main() {
    char name[100];
    int age;

    printf("Enter your name: ");
    if (fgets(name, sizeof(name), stdin) == NULL) {
        return 1;
    }
    name[strcspn(name, "\\n")] = '\\0';

    printf("Enter your age: ");
    if (scanf("%d", &age) != 1) {
        printf("Invalid age input.\\n");
        return 1;
    }

    printf("Hello, %s\\n", name);
    printf("Age: %d\\n", age);

    return 0;
}`,

  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My Web Page</title>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>Welcome to CodeSpace.</p>
  <button onclick="alert('Hello!')">Click Me</button>
</body>
</html>`,

  css: `body {
  font-family: Arial, sans-serif;
  background: #f1f5f9;
  color: #1e293b;
  padding: 24px;
}

h1 {
  color: #4f46e5;
}

button {
  padding: 10px 16px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}`,

  json: `{
  "message": "Hello, JSON!",
  "success": true,
  "numbers": [10, 20, 30]
}`,

  react: `function App() {
  const [count, setCount] = React.useState(0);

  return (
    <div style={{ padding: "24px", fontFamily: "Arial" }}>
      <h1>Hello, React!</h1>
      <p>Welcome to CodeSpace.</p>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Click Me
      </button>
    </div>
  );
}

export default App;`,
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

  return (
    <div className="app-shell">
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
