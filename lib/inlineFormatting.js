// Single-pass, non-nested inline formatting tokenizer for the block notes
// editor. Supports one level of each marker (not combined bold+italic on the
// same span) — a deliberate simplification for a hand-built editor rather
// than pulling in a full markdown/AST library for four marker types.
//
//   **bold**   __underline__   *italic*   ==highlight==

const INLINE_PATTERN = /(==[^=]+==)|(\*\*[^*]+\*\*)|(__[^_]+__)|(\*[^*]+\*)/g;

export function parseInlineSegments(text) {
  if (!text) return [{ text: "" }];
  const segments = [];
  let lastIndex = 0;
  let match;
  INLINE_PATTERN.lastIndex = 0;
  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith("==")) segments.push({ text: token.slice(2, -2), highlight: true });
    else if (token.startsWith("**")) segments.push({ text: token.slice(2, -2), bold: true });
    else if (token.startsWith("__")) segments.push({ text: token.slice(2, -2), underline: true });
    else if (token.startsWith("*")) segments.push({ text: token.slice(1, -1), italic: true });
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) segments.push({ text: text.slice(lastIndex) });
  return segments.length > 0 ? segments : [{ text }];
}

/** Wraps (or unwraps, if already wrapped) a text range with a marker pair. */
export function toggleMarkerOnSelection(text, selection, marker) {
  const start = Math.min(selection.start, selection.end);
  const end = Math.max(selection.start, selection.end);
  const markerLen = marker.length;

  if (start === end) {
    // No selection: wrap the whole line for a predictable, simple result.
    const already =
      text.startsWith(marker) && text.endsWith(marker) && text.length >= markerLen * 2;
    const nextText = already ? text.slice(markerLen, text.length - markerLen) : `${marker}${text}${marker}`;
    return { text: nextText, cursor: nextText.length };
  }

  const before = text.slice(0, start);
  const selected = text.slice(start, end);
  const after = text.slice(end);

  const alreadyWrapped =
    before.endsWith(marker) && after.startsWith(marker);
  if (alreadyWrapped) {
    const nextText = before.slice(0, before.length - markerLen) + selected + after.slice(markerLen);
    return { text: nextText, cursor: start - markerLen + selected.length };
  }

  const nextText = `${before}${marker}${selected}${marker}${after}`;
  return { text: nextText, cursor: end + markerLen * 2 };
}
