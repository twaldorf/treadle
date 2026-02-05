import 'dotenv/config'
import { globalState } from './state.js'
import { intakeBrowseScheme, intakeProjectInfo, intakeSelectors } from './inputUtilities.js'
import { scrapeLinks } from './scrapeLinks.js'
import { getImages, processImages } from './images.js'
import { scrapeItems } from './scrapeItems.js'
import { cleanData } from './cleanData.js'
import { processWithLLM } from './llm_process.js'
import { checkpoint, initConfig, loadCheckpoint, loadConfig } from './checkpointUtilities.js'
import { addAttrToPattern, cutAttrValueAfterSlash, cutImageNameAfterSlash, remove$FromPatternCost, stickScrapeAttrToPattern } from './misc_utils.js'

// Pipeline steps and their corresponding functions
const StepManagers = {
  1: intakeProjectInfo,
  2: intakeBrowseScheme,
  3: intakeSelectors,
  4: scrapeLinks,
  5: scrapeItems,
  6: cleanData,
  7: processWithLLM,
  8: getImages,
  9: processImages,
}

// Main function
export default async function main() {
    console.log('Treadle scraper is active.')
    const { rl } = globalState

    // Check for basic config setup, create blank if not
    const runMisc = await rl.question('Run misc utilities? y / n\n')
    if (runMisc.toLocaleLowerCase() == 'y') {
      try {
        loadCheckpoint(10)
        // add scripts here
        addAttrToPattern("designer", "True Bias")
        stickScrapeAttrToPattern('url', 'url')
        stickScrapeAttrToPattern('price', 'price')
        remove$FromPatternCost()
        // cutImageNameAfterSlash()
        checkpoint(10)
      } catch (e) { 
        console.log(e)
      }
    }

    // Check for basic config setup, create blank if not
    const createConfig = await rl.question('Create a blank config file? y / n\n')
    if (createConfig.toLocaleLowerCase() == 'y') {
      initConfig()
    }

    // Continue from last checkpoint, with updated config
    const continueFromCheckpoint = await rl.question('Continue from a checkpoint? y / n')

    if (continueFromCheckpoint.toLocaleLowerCase() == 'y') {
      let stepToContinue = parseInt(await rl.question('Input step number:\n1. Input project info\n2. Input browse scheme\n3. Input selectors\n4. Scrape links\n5. Scrape data\n6. Clean data\n7. Process with LLM'))
      await loadCheckpoint(stepToContinue - 1)
      // Load a new config over the old one to account for the use retrying selectors
      await loadConfig()
      while (stepToContinue < Object.keys(StepManagers).length) {
        await StepManagers[stepToContinue]()
        stepToContinue++
      }
    } else {
      let stepToContinue = 1
      while (stepToContinue < Object.keys(StepManagers).length) {
        await StepManagers[stepToContinue]()
        stepToContinue++
      }
    }

    // Final output and logging
    checkpoint(10)
    console.log('Scraping process complete. Results saved.')
    rl.close()
    process.exit(0);
}

// Load utilities and start CLI
main().catch(err => console.error('Error in main:', err))
