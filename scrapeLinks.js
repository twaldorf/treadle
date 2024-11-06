export const scrapeLinks = async (globalState) => {
  console.log('Initializing browser instance...')
  const browser = await puppeteer.launch({headless: "new"})
  console.log(`Starting scrape for ${globalState.numberOfPages} pages...`)
  globalState = await scrapeItemLinksFromBrowse(browser, globalState)
  // Checkpoint with collection of all item links
  checkpoint(globalState, 'item link collection')
  browser.close()
  await scrapeItems()
}