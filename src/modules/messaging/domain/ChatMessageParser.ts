export interface ChatMediaAttachment {
  type: "image" | "video" | "file" | "voice";
  url: string;
  name?: string;
  size?: number;
  duration?: number; // for audio / voice in seconds
}

export interface ParsedChatMessage {
  text: string;
  codeBlock?: {
    language: string;
    code: string;
  };
  attachment?: ChatMediaAttachment;
}

export class ChatMessageParser {
  public static parse(raw: string | null | undefined): ParsedChatMessage {
    if (!raw) return { text: "" };

    let attachment: ChatMediaAttachment | undefined = undefined;
    let textToProcess = raw;

    // Check for JSON-encoded media metadata envelope: [VG_ATTACHMENT]{...}[/VG_ATTACHMENT]
    const attachRegex = /\[VG_ATTACHMENT\]([\s\S]*?)\[\/VG_ATTACHMENT\]/;
    const attachMatch = textToProcess.match(attachRegex);
    if (attachMatch) {
      try {
        attachment = JSON.parse(attachMatch[1]);
        textToProcess = textToProcess.replace(attachMatch[0], "").trim();
      } catch (err) {
        // ignore parse error
      }
    }

    // Extract code block
    const codeBlockRegex = /```([a-zA-Z0-9_+#-]*)\n([\s\S]*?)```/;
    const codeMatch = textToProcess.match(codeBlockRegex);

    if (codeMatch) {
      const language = (codeMatch[1] || "plaintext").toLowerCase().trim();
      const code = (codeMatch[2] || "").replace(/\n$/, "");
      const textBefore = textToProcess.slice(0, codeMatch.index).trim();
      const textAfter = textToProcess.slice((codeMatch.index || 0) + codeMatch[0].length).trim();
      const combinedText = [textBefore, textAfter].filter(Boolean).join("\n\n");

      return {
        text: combinedText,
        codeBlock: { language, code },
        attachment,
      };
    }

    return {
      text: textToProcess,
      attachment,
    };
  }

  public static format(params: {
    text: string;
    codeBlock?: { language: string; code: string };
    attachment?: ChatMediaAttachment;
  }): string {
    const parts: string[] = [];

    if (params.text && params.text.trim()) {
      parts.push(params.text.trim());
    }

    if (params.codeBlock && params.codeBlock.code.trim()) {
      const lang = params.codeBlock.language || "plaintext";
      parts.push(`\`\`\`${lang}\n${params.codeBlock.code.trim()}\n\`\`\``);
    }

    if (params.attachment) {
      parts.push(`[VG_ATTACHMENT]${JSON.stringify(params.attachment)}[/VG_ATTACHMENT]`);
    }

    return parts.join("\n\n");
  }

  public static getPreviewText(raw: string | null | undefined): string {
    if (!raw) return "Started a conversation";
    const parsed = this.parse(raw);
    if (parsed.text && parsed.text.trim()) {
      return parsed.text.trim();
    }
    if (parsed.codeBlock) {
      return `💻 [Code: ${parsed.codeBlock.language}]`;
    }
    if (parsed.attachment) {
      if (parsed.attachment.type === "image") return "📷 Image";
      if (parsed.attachment.type === "video") return "🎥 Video";
      if (parsed.attachment.type === "voice") return "🎤 Voice Note";
      if (parsed.attachment.type === "file") return `📎 ${parsed.attachment.name || "File"}`;
    }
    return "Started a conversation";
  }
}

