
import axios from "axios";

const API_URL = "https://ce.judge0.com";

const languageIds = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
};

export async function executeCode(code, language, stdin = "") {
  const normalizedLanguage = String(language).toLowerCase();
  const languageId = languageIds[normalizedLanguage];

  const response = await axios.post(
  `${API_URL}/submissions?base64_encoded=false&wait=true`,
  {
    source_code: code,
    language_id: languageId,
    stdin: String(stdin ?? ""),
  },
  {
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 30000,
  }
);

  if (!languageId) {
    throw new Error(
      `Execution is not configured for ${language}.`
    );
  }

  try {
    const response = await axios.post(
      `${API_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: code,
        language_id: languageId,
        stdin: String(stdin),
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const result = response.data;
    const statusId = result.status?.id;

    if (result.compile_output) {
      return {
        type: "error",
        text: result.compile_output,
      };
    }

    if (result.stderr) {
      return {
        type: "error",
        text: result.stderr,
      };
    }

    if (result.message) {
      return {
        type: "error",
        text: result.message,
      };
    }

    if (statusId === 5) {
      return {
        type: "error",
        text: "Time Limit Exceeded",
      };
    }

    if (statusId === 6) {
      return {
        type: "error",
        text: "Compilation Error",
      };
    }

    if (statusId === 3) {
      return {
        type: "success",
        text: result.stdout ?? "Program executed successfully.",
      };
    }

    return {
      type: "error",
      text:
        result.status?.description ||
        "Execution failed. Please try again.",
    };
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      throw new Error(
        "Code execution timed out. Please try again."
      );
    }

    throw new Error(
      error.response?.data?.message ||
      error.message ||
      "Unable to execute code. Please try again."
    );
  }
}
