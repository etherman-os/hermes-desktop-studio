/**
 * Pure SSE (Server-Sent Events) parser extracted for testability.
 *
 * Handles edge cases:
 * - Multi-line data fields (concatenated with newlines)
 * - "event:" with or without leading space
 * - "data:" with or without leading space
 * - Partial/incomplete blocks (caller manages buffering)
 * - Comment lines (colon with no field name = comment, skipped)
 * - Malformed input (returns null instead of throwing)
 */

export interface ParsedSSEEvent {
  event: string;
  data: string;
}

/**
 * Parse a single SSE block (text between blank lines).
 *
 * Returns `null` if the block is malformed or has no parseable event+data.
 *
 * @param raw - A single SSE block (lines joined by `\n`, no trailing `\n\n`).
 */
export function parseSSEEvent(raw: string): ParsedSSEEvent | null {
  if (!raw || !raw.trim()) return null;

  const lines = raw.split("\n");
  let eventType = "";
  const dataParts: string[] = [];

  for (const line of lines) {
    // Comment line (starts with colon)
    if (line.startsWith(":")) continue;

    if (line.startsWith("event:")) {
      eventType = line.slice(6).replace(/^ /, "").trim();
    } else if (line.startsWith("data:")) {
      // data: may or may not have a space after colon
      dataParts.push(line.slice(5).replace(/^ /, ""));
    }
    // id:, retry:, and other fields are ignored for now
  }

  if (!eventType || dataParts.length === 0) return null;

  // Multi-line data is concatenated with newlines per SSE spec
  const data = dataParts.join("\n");

  return { event: eventType, data };
}

/**
 * Split a raw SSE stream buffer into individual blocks.
 *
 * SSE blocks are separated by blank lines (`\n\n`).
 * Returns the parsed complete blocks and any trailing incomplete text.
 *
 * @param buffer - The raw stream buffer.
 * @returns Object with `blocks` (parsed events) and `remainder` (incomplete trailing text).
 */
export function splitSSEBlocks(buffer: string): {
  blocks: string[];
  remainder: string;
} {
  const parts = buffer.split("\n\n");
  const remainder = parts.pop() ?? "";
  return { blocks: parts, remainder };
}

/**
 * Parse a raw SSE stream buffer into typed events.
 *
 * Combines `splitSSEBlocks` and `parseSSEEvent` for convenience.
 * Returns parsed events and the remaining incomplete buffer text.
 *
 * @param buffer - The raw stream buffer accumulated from ReadableStream chunks.
 */
export function parseSSEStream(buffer: string): {
  events: ParsedSSEEvent[];
  remainder: string;
} {
  const { blocks, remainder } = splitSSEBlocks(buffer);
  const events: ParsedSSEEvent[] = [];

  for (const block of blocks) {
    const parsed = parseSSEEvent(block);
    if (parsed) events.push(parsed);
  }

  return { events, remainder };
}
