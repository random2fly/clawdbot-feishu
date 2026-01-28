// Utilities for splitting outbound text into platform-sized chunks.
// Similar to moltbot's src/auto-reply/chunk.ts

/**
 * Split text into chunks by length, preferring word boundaries.
 */
export function chunkText(text: string, limit: number): string[] {
  if (!text) return [];
  if (limit <= 0) return [text];
  if (text.length <= limit) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > limit) {
    const window = remaining.slice(0, limit);
    const { lastNewline, lastWhitespace } = scanBreakpoints(window);

    // Prefer newline, then whitespace, then hard break
    let breakIdx = lastNewline > 0 ? lastNewline : lastWhitespace;
    if (breakIdx <= 0) breakIdx = limit;

    const rawChunk = remaining.slice(0, breakIdx);
    const chunk = rawChunk.trimEnd();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    const brokeOnSeparator = breakIdx < remaining.length && /\s/.test(remaining[breakIdx]);
    const nextStart = Math.min(remaining.length, breakIdx + (brokeOnSeparator ? 1 : 0));
    remaining = remaining.slice(nextStart).trimStart();
  }

  if (remaining.length) chunks.push(remaining);
  return chunks;
}

interface Breakpoints {
  lastNewline: number;
  lastWhitespace: number;
}

function scanBreakpoints(window: string): Breakpoints {
  let lastNewline = -1;
  let lastWhitespace = -1;

  for (let i = 0; i < window.length; i++) {
    const char = window[i];
    if (char === "\n") lastNewline = i;
    else if (/\s/.test(char)) lastWhitespace = i;
  }

  return { lastNewline, lastWhitespace };
}

/**
 * Split markdown text into chunks, preserving code fences.
 */
export function chunkMarkdownText(text: string, limit: number): string[] {
  if (!text) return [];
  if (limit <= 0) return [text];
  if (text.length <= limit) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > limit) {
    const window = remaining.slice(0, limit);

    // Find last safe break point
    const lastNewline = window.lastIndexOf("\n");
    const lastSpace = window.lastIndexOf(" ");

    let breakIdx: number;
    if (lastNewline > 0) {
      // Prefer breaking at newlines
      breakIdx = lastNewline + 1;
    } else if (lastSpace > 0) {
      // Fall back to word boundary
      breakIdx = lastSpace + 1;
    } else {
      // Hard break at limit
      breakIdx = limit;
    }

    const rawChunk = remaining.slice(0, breakIdx).trimEnd();
    if (rawChunk.length > 0) {
      chunks.push(rawChunk);
    }

    const brokeOnSeparator = breakIdx < remaining.length && /\s/.test(remaining[breakIdx]);
    const nextStart = Math.min(remaining.length, breakIdx + (brokeOnSeparator ? 1 : 0));
    remaining = remaining.slice(nextStart).trimStart();
  }

  if (remaining.length) chunks.push(remaining);
  return chunks;
}
