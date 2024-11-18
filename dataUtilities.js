// Utilities that act on data, provided as arguments

export function cleanSpaces(html) {
  if (typeof html == "string") {
    return html.replace(/\n\s*/g, '').replace(/\s+/g, ' ').trim()
  } else {
    return html
  }
  // Collapse multiple spaces into a single space
  // Collapse multiple newlines and surrounding spaces to a single newline
  // Remove leading and trailing whitespace
}

export function removeDuplicates(array) {
  return [...new Set(array)];
}