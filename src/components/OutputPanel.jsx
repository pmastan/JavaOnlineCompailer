
import React from "react";

export default function OutputPanel({
  output = [],
  onClear,
  preview = null,
}) {
  const language = preview?.language?.toLowerCase();

  function createHtmlDocument(html = "", css = "") {
    const safeCss = String(css).replace(/<\/style/gi, "<\\/style");

    const style = `<style>${safeCss}</style>`;

    if (!html.trim()) {
      html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body>
  <h1>Hello, CodeSpace!</h1>
  <p>Your preview is ready.</p>
</body>
</html>`;
    }

    if (/<head[\s>]/i.test(html)) {
      return html.replace(/<\/head>/i, `${style}</head>`);
    }

    if (/<html[\s>]/i.test(html)) {
      return html.replace(/<body[\s>]/i, `${style}<body`);
    }

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${style}
</head>
<body>${html}</body>
</html>`;
  }

  function createReactDocument(code = "", css = "") {
    const serializedCode = JSON.stringify(String(code)).replace(
      /</g,
      "\\u003c"
    );

    const safeCss = String(css).replace(/<\/style/gi, "<\\/style");

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodeSpace React Preview</title>

  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: Arial, sans-serif;
      color: #1e293b;
    }

    #root {
      width: 100%;
    }

    ${safeCss}
  </style>

  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>

<body>
  <div id="root"></div>

  <script>
    (() => {
      const source = ${serializedCode};
      const rootElement = document.getElementById("root");

      function showError(error) {
        rootElement.replaceChildren();

        const message = document.createElement("pre");

        message.style.cssText =
          "white-space:pre-wrap;overflow-wrap:anywhere;" +
          "color:#b91c1c;background:#fee2e2;" +
          "padding:16px;border-radius:8px;font:14px monospace;";

        message.textContent =
          "React Preview Error: " +
          (error && error.message
            ? error.message
            : String(error));

        rootElement.appendChild(message);
        console.error(error);
      }

      // Display errors thrown while React renders or handles events.
      window.addEventListener("error", (event) => {
        if (event.message) {
          showError(new Error(event.message));
        }
      });

      window.addEventListener("unhandledrejection", (event) => {
        showError(event.reason || new Error("Unhandled promise rejection"));
      });

      function startReact() {
        try {
          if (!window.React || !window.ReactDOM || !window.Babel) {
            throw new Error(
              "React libraries failed to load. Check your internet connection " +
              "and make sure the CDN URLs are accessible."
            );
          }

          let cleanedCode = source;

          // Remove standard React imports. React and its hooks are
          // provided by the preview runtime below.
          cleanedCode = cleanedCode.replace(
            /^\\s*import\\s+(?:(?:\\*\\s+as\\s+\\w+)|(?:[\\w$]+\\s*(?:,\\s*\\{[^}]*\\})?)|(?:\\{[^}]*\\}))\\s+from\\s+["']react["'];?\\s*;?\\s*$/gm,
            ""
          );

          // Remove side-effect imports of React.
          cleanedCode = cleanedCode.replace(
            /^\\s*import\\s+["']react["'];?\\s*$/gm,
            ""
          );

          // This standalone preview cannot resolve npm package imports.
          const unsupportedImport =
            cleanedCode.match(/^\\s*import\\s+.+$/m);

          if (unsupportedImport) {
            throw new Error(
              "This preview supports React built-in hooks, but cannot load " +
              "additional npm packages such as lucide-react or axios. " +
              "Remove the extra import or use a bundled preview."
            );
          }

          // Remove supported export declarations.
          cleanedCode = cleanedCode.replace(
            /^\\s*export\\s+default\\s+/gm,
            ""
          );

          cleanedCode = cleanedCode.replace(
            /^\\s*export\\s+(?=(?:function|class|const|let|var)\\s)/gm,
            ""
          );

          cleanedCode = cleanedCode.replace(
            /^\\s*export\\s*\\{[^}]*\\};?\\s*$/gm,
            ""
          );

          // Classic React transform generates React.createElement(),
          // not CommonJS require() calls.
          const transformedCode = window.Babel.transform(
            cleanedCode,
            {
              presets: [
                [
                  "react",
                  {
                    runtime: "classic"
                  }
                ]
              ],
              sourceType: "script"
            }
          ).code;

          const createApp = new Function(
            "React",
            [
              '"use strict";',
              "const {",
              "useState, useEffect, useMemo, useRef,",
              "useCallback, useContext, createContext,",
              "useReducer, useLayoutEffect, Fragment",
              "} = React;",
              transformedCode,
              "return typeof App !== 'undefined' ? App : " +
                "(typeof app !== 'undefined' ? app : null);"
            ].join("\\n")
          );

          const AppComponent = createApp(window.React);

          if (typeof AppComponent !== "function") {
            throw new Error(
              "App component not found. Define function App() " +
              "or const App = () => ... and export default App."
            );
          }

          const root = window.ReactDOM.createRoot(rootElement);

          root.render(
            window.React.createElement(AppComponent)
          );
        } catch (error) {
          showError(error);
        }
      }

      // External scripts are loaded before the browser's load event.
      if (document.readyState === "complete") {
        startReact();
      } else {
        window.addEventListener("load", startReact, { once: true });
      }
    })();
  </script>
</body>
</html>`;
  }

  let previewDocument = "";

  if (preview) {
    if (language === "react") {
      previewDocument = createReactDocument(
        preview.code,
        preview.css
      );
    } else if (language === "html") {
      previewDocument = createHtmlDocument(
        preview.html || preview.code,
        preview.css
      );
    } else if (language === "css") {
      previewDocument = createHtmlDocument(
        preview.html || "",
        preview.css || preview.code
      );
    }
  }

  return (
    <div className="output-panel">
      {previewDocument && (
        <section className="live-preview">
          <div className="output-heading">
            <strong>Live Preview</strong>
            <span>{language?.toUpperCase()}</span>
          </div>

          <iframe
            key={`${language}-${preview.code}-${preview.css}`}
            title="CodeSpace Live Preview"
            srcDoc={previewDocument}
            sandbox="allow-scripts"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              minHeight: "300px",
              border: "none",
              background: "#fff",
            }}
          />
        </section>
      )}

      <section className="console-panel">
        <div className="output-heading">
          <strong>Output Console</strong>

          <button type="button" onClick={() => onClear?.()}>
            Clear
          </button>
        </div>

        <div className="console-content">
          {output.length === 0 ? (
            <p className="console-empty">
              Run your code to see output here.
            </p>
          ) : (
            output.map((item, index) => (
              <pre
                key={index}
                className={`console-line ${item.type || "log"}`}
              >
                {item.text ?? String(item)}
              </pre>
            ))
          )}
        </div>
      </section>
    </div>
  );
}