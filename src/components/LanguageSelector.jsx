import { Code2 } from "lucide-react";

export const languages = [
  { label: "C", value: "c" },
  { label: "C++", value: "cpp" },
  { label: "CSS", value: "css" },
  { label: "HTML", value: "html" },
  { label: "Java", value: "java" },
  { label: "JavaScript", value: "javascript" },
  // { label: "JSON", value: "json" },
  { label: "Python", value: "python" },
  { label: "React", value: "react" },
  // { label: "TypeScript", value: "typescript" },
];

export default function LanguageSelector({ language, onChange }) {
  return (
    <div className="language-selector">
      <Code2 size={16} />

      <select
        value={language}
        onChange={(event) => onChange(event.target.value)}
      >
        {languages.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}