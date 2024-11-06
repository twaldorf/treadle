// prefixes for saved and loaded checkpoints
const Prefixes = {
  INFO: "selectors_collected",
  BROWSE: "item link collection",
  LINKS:  "",
  SCRAPE: "scrap",
  CLEAN: "clean",
  LLM: "final"
}

// Checkpoint saver
export function checkpoint(state, stepTitle) {
  const content = JSON.stringify(state, null, 2)
  if (!fs.existsSync(__dirname + '/temp/')) {
    fs.mkdirSync(__dirname + '/temp/')
  }
  fs.writeFileSync(`${__dirname}/temp/${stepTitle}_${Date.now().toString()}_checkpoint.json`, content)
  console.log('Checkpoint complete at ' + stepTitle + ' with ' + `${state.errorCount} errors. Continuing.`)
}

export const loadCheckpoint = async (prefix) => {
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
    console.log(lastState)
    globalState = lastState

    console.log("Loaded state from last checkpoint.")
  }
}

export const loadConfig = async() => {
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
}
