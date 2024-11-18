import { globalState } from './state.js'
import { checkpoint, loadConfig } from './checkpointUtilities.js'
import { Schemes } from './schemes.js'
import { collectBrowseUrl } from './scrapeBrowse.js'

const { rl } = globalState

export const intakeProjectInfo = async () => {
  const projectTitle = await rl.question('Enter scraping project title: ')
  const appendCode = await rl.question('Enter project append code (e.g., FPC): ')
  globalState.projectInfo = { projectTitle, appendCode }
  await loadConfig()
}

export const intakeSelectors = async () => {
  const { config } = globalState
  if (globalState.config.selectors) {
    globalState.selectors = globalState.config.selectors
  } else {
    // Gather selectors for each element, save to globalState
    for (let i = 0; i < config.schema.length; ++i) {
      const selector = await rl.question(`Enter CSS selector for element ${config.schema[i]}: `)
      globalState.selectors[config.schema[i]] = selector;
      console.log('Selector saved.')
    }
    const itemLinkSelector = await rl.question('Enter CSS selector for item links on the browse page: ')
    
    // Store data in global state
    globalState.itemLinkSelector = itemLinkSelector
    
    checkpoint(3)
  }
}

export const intakeBrowseScheme = async () => {
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

  await collectBrowseUrl(globalState, rl)
}


