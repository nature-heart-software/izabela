export function normalizeDiagnosticSpan(text, start, length) {
  return {
    start: text.slice(0, start).replace(/\r\n/g, '\n').length,
    length:
      length === undefined
        ? undefined
        : text.slice(start, start + length).replace(/\r\n/g, '\n').length,
  }
}
