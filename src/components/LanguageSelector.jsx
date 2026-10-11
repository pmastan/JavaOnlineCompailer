import { Code2 } from "lucide-react";

export const languages = [
  { label: "JavaScript", value: "javascript" },
  // { label: "TypeScript", value: "typescript" },
  { label: "Python", value: "python" },
  { label: "Java", value: "java" },
  { label: "C++", value: "cpp" },
  { label: "C", value: "c" },
  { label: "HTML", value: "html" },
  { label: "CSS", value: "css" },
  // { label: "JSON", value: "json" },
  { label: "React", value: "react" },
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