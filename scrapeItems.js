import puppeteer from 'puppeteer';
import { checkpoint } from './checkpointUtilities.js';
import { scrapeItemElementsFromLink } from './scrapeItem.js';
import { globalState } from './state.js'

export const scrapeItems = async () => {
  // 4.1 Begin scraping item elements
  console.log('Scraping data from links...')
  const browser = await puppeteer.launch({headless: "new"})
  let scrapeCount = 0;
  let testLimit = globalState.config.testLimit
  for (let url of globalState.itemLinks) {
    if (testLimit > 0 && scrapeCount < testLimit) {
      try {
        // this design is too opaque
        await scrapeItemElementsFromLink(browser, url)
        scrapeCount++
        // this is the desired update methodology:
        // globalState.items[itemData.title] = itemData
        // globalState.items[itemData.title].scrapeIds.push(scrapeId)
        // console.log('Scraped item: ' + itemData.title)
        if (scrapeCount % globalState.config.checkpointThreshold == 0) {
          checkpoint(5)
        }
      } catch (e) {
        console.log(e)
      } 
    }
  }
  console.log('Scraping complete. Saving checkpoint...')
  checkpoint(5)
  // After scraping, log and save checkpoint
  console.log('Checkpoint saved.')
}