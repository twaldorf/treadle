import { globalState, replaceState } from './state.js'
const { rl } = globalState
import * as path from 'node:path'
import * as fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url) // hmm
const __dirname = path.dirname(__filename)

// Legacy checkpoint prefixes
const prefixes = {
  1: "intakeProjectInfo",
  2: "intakeBrowseScheme",
  3: "intakeSelectors",
  4: "scrapeLinks",
  5: "scrapeItems",
  6: "cleanData",
  7: "processWithLLM",
  8: "getImages",
  9: "processImages",
}

// Checkpoint saver
export function checkpoint(stepNumber) {
  const content = JSON.stringify(globalState, null, 2)
  if (!fs.existsSync(__dirname + '/temp/')) {
    fs.mkdirSync(__dirname + '/temp/')
  }
  fs.writeFileSync(`${__dirname}/temp/${prefixes[stepNumber]}_${Date.now().toString()}_checkpoint.json`, content)
  console.log('Checkpoint complete at ' + prefixes[stepNumber] + ' with ' + `${globalState.errorCount} errors. Continuing.`)
}

export const loadCheckpoint = async (stepToContinue) => {

  const prefix = prefixes[stepToContinue]
  // Chose most recent file in temp
  const tempDir = path.join(__dirname, 'temp')
  const files = fs.readdirSync(tempDir)
    .filter(file => file.startsWith(prefix))
    .map(file => path.join(tempDir, file))
    .sort((a, b) => fs.statSync(b).mtime - fs.statSync(a).mtime)
  if (files.length > 0) {
    const latestCheckpointFile = files[0]
    console.log(`Loading from checkpoint: ${latestCheckpointFile}`)

    const lastState = JSON.parse(fs.readFileSync(latestCheckpointFile, 'utf8'))
    replaceState(lastState)

    console.log("Loaded state from checkpoint.")
  }
}

export const loadConfig = async() => {
  const configPath = path.join(path.resolve(__dirname), 'config.json')
  let config = {}
  try {
      config = JSON.parse(fs.readFileSync(configPath).toString())
      // const configContent = Object.keys(config).reduce((prev, curr, index, arr) => { return prev + '\n' + config[arr[index]]})
      const confirmConfig = await rl.question(`Found the following config. Does it look right? Enter y or n for yes or no.\n${JSON.stringify(config)}`)
      if (confirmConfig == 'n') {
        console.error('Config rejected, aborting')
        process.exit(1)
      }
      globalState.config = config
      globalState.itemLinkSelector = config.itemLinkSelector
      globalState.mainContentSelector = config.mainContentSelector
      console.log(globalState)
  } catch (err) {
      console.error('Error loading config:', err)
      process.exit(1)
  }
}
