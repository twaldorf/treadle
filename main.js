import 'dotenv/config'
import { intakeBrowseScheme, intakeProjectInfo, intakeSelectors } from './inputUtilities.js'
import { scrapeLinks } from './scrapeLinks.js'
import { getImages, processImages } from './images.js'
import { scrapeItems } from './scrapeItems.js'
import { cleanData } from './cleanData.js'
import { processWithLLM } from './llm_process.js'
import { globalState } from './state.js'
import { checkpoint } from './checkpointUtilities.js'


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
async function main() {
    console.log('Welcome to Treadle scraper.')
    const { rl } = globalState

    // Continue from last checkpoint, with updated config
    const continueFromCheckpoint = await rl.question('Continue from a checkpoint? y / n')

    if (continueFromCheckpoint.toLocaleLowerCase() == 'y') {
      let stepToContinue = await rl.question('Input step number:\n1. Input project info\n2. Input browse scheme\n3. Input selectors\n4. Scrape links\n5. Scrape data\n6. Clean data\n7. Process with LLM')
      while (stepToContinue < StepManagers[Object.keys(StepManagers).length]) {
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
    checkpoint(globalState, 'final')
    console.log('Scraping process complete. Results saved.')
    rl.close()
}

// Load utilities and start CLI
main().catch(err => console.error('Error in main:', err))
