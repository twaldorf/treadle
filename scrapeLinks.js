import { globalState } from './state.js'
import puppeteer from 'puppeteer'
import { scrapeItemLinksFromBrowse } from './scrapeItem.js'
import { checkpoint } from './checkpointUtilities.js'
import { scrapeItems } from './scrapeItems.js'

export const scrapeLinks = async () => {
  console.log('Initializing browser instance...')
  const browser = await puppeteer.launch({headless: "new"})
  console.log(`Starting scrape for ${globalState.numberOfPages} pages...`)
  await scrapeItemLinksFromBrowse(browser)
  // Checkpoint with collection of all item links
  checkpoint(4)
  browser.close()
  await scrapeItems()
}