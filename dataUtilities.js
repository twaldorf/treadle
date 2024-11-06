// Utilities that act on data, provided as arguments

export function cleanSpaces(html) {
  // Collapse multiple spaces into a single space
  // Collapse multiple newlines and surrounding spaces to a single newline
  // Remove leading and trailing whitespace
  return html.replace(/\s+/g, ' ').replace(/\n\s*/g, '\n').trim()
}