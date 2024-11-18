import * as readline from 'node:readline/promises'

// CLI prompt setup
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

export const replaceState = (newState) => {
  Object.assign(globalState, newState)
}

export const updateState = (stateItem) => {
  // globalstate[stateItem]
}

// Set up global state file
// TODO: make const and define elements to be updated
export const globalState = {
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
  rl: rl,
  itemLinkSelector: "",
  mainContentSelector: "",
}