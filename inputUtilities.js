export const intakeProjectInfo = async () => {
  const projectTitle = await rl.question('Enter scraping project title: ')
  const appendCode = await rl.question('Enter project append code (e.g., FPC): ')
  await loadConfig()
  // chain
  await intakeBrowseScheme()
}

export const intakeSelectors = async () => {
  // 3. For each browse page, input CSS or XPath selector for item links
  // const mainContentSelector = await rl.question('Enter CSS selector for main content on item page (to wait on page load): ')
  
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
  // chain
  await scrapeLinks()
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

  globalState = await collectBrowseUrl(globalState, rl)

  // chain
  await intakeSelectors
}


