export const runCleanWhitespace = (globalState) => {
  console.log('Cleaning whitespace...')
  for (let item in globalState.scrapedData) {
    for (let attribute in item.elements) {
      item.elements[attribute] = cleanSpaces(item.elements[attribute])
    }
    // "35356scrapeid735": { "elements":{ {"title": "Pogonip Pullover",...}, } },
  }
}
