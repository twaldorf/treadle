// scraper-cli.js

import { match } from 'node:assert'
import { fileURLToPath } from 'node:url'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as readline from 'node:readline/promises'
import * as puppeteer from 'puppeteer'
import { getInfoFromProductPage, scrapeItemLinksFromBrowse, scrapeItemElementsFromLink } from './scrapeItem.js'
import { collectBrowseUrl } from './scrapeBrowse.js'
import { Schemes } from './schemes.js'
import 'dotenv/config'

// get path for file IO use
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up global state file
// TODO: make const and define elements to be updated
var globalState = {
    browseUrls: [],
    itemLinks: [],
    selectors: {},
    scrapedData: {},
    errorCount: 0,
    successCount: 0,
    llmProcessedData: [],
    totalTokens: 0,
    jobLog: {},
    config: {},
}

// CLI prompts setup
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

// Not implemented
const loadParamsFromTmp = () => {
  const params = JSON.parse(fs.readFileSync(__dirname + '/temp/lastrun.json'))
  globalState = params.globalState
}

// Main function
async function main() {
    console.log('Welcome to Treadle scraper.')
    
    // const retry = await rl.question('Retry with last inputs? y / n ') == 'y' ? true : false
    // if (retry) {
    //   globalState = loadParamsFromTmp();
    // }

    // Continue from last checkpoint
    const continueFromLast = await rl.question('Continue from last checkpoint? y / n')
    if (continueFromLast.toLocaleLowerCase() == 'y') {
      // Chose most recent file in temp
      const tempDir = path.join(__dirname, 'temp')
      const files = fs.readdirSync(tempDir)
        // .filter(file => file.startsWith('item link collection_'))
        .map(file => path.join(tempDir, file))
        .sort((a, b) => fs.statSync(b).mtime - fs.statSync(a).mtime)
      if (files.length > 0) {
        const latestCheckpointFile = files[0]
        console.log(`Loading from checkpoint: ${latestCheckpointFile}`)

        const lastState = JSON.parse(fs.readFileSync(latestCheckpointFile, 'utf8'))
        console.log(lastState)
        globalState = lastState
        
        console.log("Loaded state from last checkpoint.")
      }
    } else {
      // 1. Input project info
      const projectTitle = await rl.question('Enter scraping project title: ')
      const appendCode = await rl.question('Enter project append code (e.g., FPC): ')

      const configPath = path.join(path.resolve(__dirname), 'config.json')
      let config = {}
      try {
          config = JSON.parse(fs.readFileSync(configPath))
          // const configContent = Object.keys(config).reduce((prev, curr, index, arr) => { return prev + '\n' + config[arr[index]]})
          const confirmConfig = await rl.question(`Found the following config. Does it look right? Enter y or n for yes or no.\n${JSON.stringify(config)}`)
          if (confirmConfig == 'n') {
            console.error('Config rejected, aborting')
            process.exit(1)
          }
          globalState.config = config
      } catch (err) {
          console.error('Error loading config:', err)
          process.exit(1)
      }

      // 2. Input Browse page URL and number of pages to scrape
      console.log('Browsing schemes:\n1. Page-by-page\n2. Infinite scroll, single page\n3. Single URL page, booklet')
      const browseScheme = parseInt(await rl.question('Enter the number corresponding to the scheme:'))
      switch (browseScheme) {
        case 1:
          globalState.browseScheme = Schemes.PAGEBYPAGE
          break
        case 2:
          globalState.browseScheme = Schemes.INFINITE
          break
        case 3:
          globalState.browseScheme = Schemes.BOOKLET
          break
        default:
          console.log('Invalid selection')
      }

      globalState = await collectBrowseUrl(globalState, rl)

      // 3. For each browse page, input CSS or XPath selector for item links
      const mainContentSelector = await rl.question('Enter CSS selector for main content on item page (to wait on page load): ')
      // Gather selectors for each element, save to globalState
      for (let i = 0; i < config.schema.length; ++i) {
        const selector = await rl.question(`Enter CSS selector for element ${config.schema[i]}: `)
        globalState.selectors[config.schema[i]] = selector;
        console.log('Selector saved.')
      }
      const itemLinkSelector = await rl.question('Enter CSS selector for item links on the browse page: ')
      // Store data in global state
      globalState.itemLinkSelector = itemLinkSelector
      globalState.mainContentSelector = mainContentSelector
      
      checkpoint(globalState, 'selectors_collected')
    } // end selector input checkpoint

    globalState.rl = rl;

    // 4. Start the scraping process, initialize the browser
    console.log('Initializing browser instance...')
    const browser = await puppeteer.launch({headless: "new"})
    console.log(`Starting scrape for ${globalState.numberOfPages} pages...`)
    globalState = await scrapeItemLinksFromBrowse(browser, globalState)
    // Checkpoint with collection of all item links
    checkpoint(globalState, 'item link collection')

    // 4.1 Begin scraping item elements
    console.log('Scraping data from links...')
    let scrapeCount = 0;
    let testLimit = globalState.config.testLimit
    for (let url of globalState.itemLinks) {
      if (testLimit > 0 && scrapeCount < testLimit) {
        try {
          // this design is too opaque
          globalState = await scrapeItemElementsFromLink(browser, url, globalState)
          scrapeCount++
          // this is the desired update methodology:
          // globalState.items[itemData.title] = itemData
          // globalState.items[itemData.title].scrapeIds.push(scrapeId)
          // console.log('Scraped item: ' + itemData.title)
          if (scrapeCount % globalState.config.checkpointThreshold == 0) {
            checkpoint(globalState, 'scrapeThreshold')
          }
        } catch (e) {
          console.log(e)
        } 
      }
    }

    browser.close()

    // After scraping, log and save checkpoint
    console.log('Scraping complete. Saving checkpoint...')

    // 4.999 Clean scripts (optional)
    if (config.cleanWhiteSpace == true) {
      const scrapeIds = Array.from(globalState.scrapedData)
      for (let item in globalState.scrapedData) {
        for (let attribute in item.elements) {
          item.elements[attribute] = cleanSpaces(item.elements[attribute])
        }
        // "35356scrapeid735": { "elements":{ {"title": "Pogonip Pullover",...}, } },
      }
      const cleanedData = keys.map(key => Object.keys(config.scrapedData[key]).map(element => config.scrapedData[key]) = cleanSpaces())
    }
    checkpoint(globalState, 'scraping')
    console.log('Checkpoint saved.')

    // 5. Begin LLM processing if API details are available
    const { config } = globalState;
    const apiKey = process.env.CHATGPT_API_KEY
    if (apiKey && config.prompt) {
        console.log('Starting LLM processing...')
        await processWithLLM(globalState.scrapedData, config)
    } else {
        console.log('LLM API details missing, skipping LLM processing...')
    }

    // Final output and logging
    checkpoint(globalState, 'final')
    console.log('Scraping process complete. Results saved.')
    rl.close()
}

// Checkpoint saver
function checkpoint(state, stepTitle) {
  const content = JSON.stringify(state, null, 2)
  if (!fs.existsSync(__dirname + '/temp/')) {
    fs.mkdirSync(__dirname + '/temp/')
  }
  fs.writeFileSync(`${__dirname}/temp/${stepTitle}_${Date.now().toString()}_checkpoint.json`, content)
  console.log('Checkpoint complete at ' + stepTitle + ' with ' + `${state.errorCount} errors. Continuing.`)
}

// Process data with ChatGPT API
async function processWithLLM(data, config) {
    const chatGPT = new ChatGPT(config.apiKey)
    for (let item of data) {
        try {
            const response = await chatGPT.processOne(item, config.prompt, config.tokenLimit)
            globalState.llmProcessedData.push(response)
            console.log(`LLM processed item, response saved.`)
        } catch (error) {
            logError(`Error with LLM processing: ${error}`)
            globalState.errorCount++
        }
    }
}

// Load utilities and start CLI
main().catch(err => console.error('Error in main:', err))

// utilities
// todo: move to utilities
function cleanSpaces(html) {
  // Collapse multiple spaces into a single space
  // Collapse multiple newlines and surrounding spaces to a single newline
  // Remove leading and trailing whitespace
  return html.replace(/\s+/g, ' ').replace(/\n\s*/g, '\n').trim()
}