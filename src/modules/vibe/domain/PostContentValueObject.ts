export type SupportedLanguage =
  | "typescript"
  | "javascript"
  | "tsx"
  | "jsx"
  | "json"
  | "html"
  | "css"
  | "sql"
  | "bash"
  | "python"
  | "java"
  | "go"
  | "csharp"
  | "cpp"
  | "php"
  | "rust"
  | "plaintext";

export interface CodeBlock {
  language: SupportedLanguage;
  code: string;
}

export interface StructuredPostContent {
  text: string;
  codeBlock?: CodeBlock;
}

const SUPPORTED_LANGUAGES: Set<string> = new Set([
  "typescript",
  "javascript",
  "tsx",
  "jsx",
  "json",
  "html",
  "css",
  "sql",
  "bash",
  "python",
  "java",
  "go",
  "csharp",
  "cpp",
  "php",
  "rust",
  "plaintext",
]);

export class PostContentValueObject {
  public static parse(rawContent: string | null | undefined): StructuredPostContent {
    if (!rawContent) {
      return { text: "" };
    }

    // Markdown fence code block pattern: ```[language]\n[code]```
    const codeBlockRegex = /```([a-zA-Z0-9_+#-]*)\n([\s\S]*?)```/;
    const match = rawContent.match(codeBlockRegex);

    if (!match) {
      return { text: rawContent };
    }

    const rawLang = (match[1] || "").toLowerCase().trim();
    const code = (match[2] || "").replace(/\n$/, "");
    
    // Determine language with fallback
    let language: SupportedLanguage = "plaintext";
    if (rawLang && SUPPORTED_LANGUAGES.has(rawLang)) {
      language = rawLang as SupportedLanguage;
    } else if (rawLang === "ts") {
      language = "typescript";
    } else if (rawLang === "js") {
      language = "javascript";
    } else if (rawLang === "py") {
      language = "python";
    } else if (rawLang === "sh" || rawLang === "shell") {
      language = "bash";
    } else if (rawLang === "c++") {
      language = "cpp";
    } else if (rawLang === "cs" || rawLang === "c#") {
      language = "csharp";
    }

    // Extract text before and after the code block
    const textBefore = rawContent.slice(0, match.index).trim();
    const textAfter = rawContent.slice((match.index || 0) + match[0].length).trim();
    const combinedText = [textBefore, textAfter].filter(Boolean).join("\n\n");

    return {
      text: combinedText,
      codeBlock: {
        language,
        code,
      },
    };
  }

  public static format(text: string, codeBlock?: CodeBlock): string {
    const trimmedText = text ? text.trim() : "";
    if (!codeBlock || !codeBlock.code || !codeBlock.code.trim()) {
      return trimmedText;
    }

    const lang = codeBlock.language || "plaintext";
    const formattedCode = `\`\`\`${lang}\n${codeBlock.code}\n\`\`\``;

    if (!trimmedText) {
      return formattedCode;
    }

    return `${trimmedText}\n\n${formattedCode}`;
  }
}
