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
import { runCleanWhitespace } from './stepManagers.js'
import { intakeBrowseScheme, intakeProjectInfo, intakeSelectors } from './inputUtilities.js'
import { scrapeLinks } from './scrapeLinks.js'

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

// CLI prompt setup
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

const StepManagers = {
  1: intakeProjectInfo,
  2: intakeBrowseScheme,
  3: intakeSelectors,
  4: scrapeLinks,
  4.1: scrapeItems,
  4.9: cleanData,
  5: processWithLLM,
}

// Main function
async function main() {
    console.log('Welcome to Treadle scraper.')

    // Continue from last checkpoint, with updated config
    const continueFromCheckpoint = await rl.question('Continue from a checkpoint? y / n')

    if (continueFromCheckpoint.toLocaleLowerCase() == 'y') {
      const stepToContinue = await rl.question('Input step number:\n1. Input project info\n2. Input browse scheme\n3. Input selectors\n4. Scrape links\n4.1. Scrape data\n4.9. Clean data\n5. Process with LLM')
      await StepManagers[stepToContinue]()
    } else {
      await intakeProjectInfo()
    }

    // 3. Intake selectors
    // await intakeSelectors(globalState)

    globalState.rl = rl;

    // 4. Scrape links from browse page
    await scrapeLinks(globalState)

    // 4.1 Scrape items from the stored links
    await scrapeItems(globalState)

    // 4.999 Clean scripts (optional)
    if (config.cleanWhiteSpace == true) {
      runCleanWhitespace(globalState)
    }

    // 5. Begin LLM processing if API details are available 
    const resultPatterns = await processWithLLM(globalState)
    globalState.llmProcessedData = resultPatterns

    // Final output and logging
    checkpoint(globalState, 'final')
    console.log('Scraping process complete. Results saved.')
    rl.close()
}

// Load utilities and start CLI
main().catch(err => console.error('Error in main:', err))
