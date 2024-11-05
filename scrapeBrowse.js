import { Schemes } from "./schemes.js"

export const collectBrowseUrl = async ( globalState, rl ) => {
  const browsePageURL = await rl.question('Enter Browse Page URL: ')
  switch (globalState.browseScheme) {
    default:
      console.log('No browse schema found, failing')
      break

    case Schemes.PAGEBYPAGE:
      const numberOfPages = await rl.question('Enter number of browse pages to scrape: ')
      globalState.numberOfPages = numberOfPages

      if (numberOfPages > 1) {
        // Build out the URLs for all browse pages assuming a pattern like 'page=n' for n pages
        const browseUrlBase = browsePageURL.split('=')[0]
        console.log('Base URL: ' + browseUrlBase)
        var browseUrls = []
        for (let i = 1; i <= numberOfPages; ++i) {
          browseUrls.push(browseUrlBase + '=' + i)
        }
        // Preview browse URLs
        console.log('Browsing the following URLs for items:\n')
        browseUrls.map(e => console.log(e))
        globalState.browseUrls = browseUrls
      } else {
        globalState.browseUrls = []
        
      }
      break

    case Schemes.INFINITE:
      globalState.browseUrls = []
      globalState.browseUrls.push(browsePageURL)
      break

    case Schemes.BOOKLET:
      const browseNextSelector = await rl.question('Enter the CSS selector for the advance page button:')
      globalState.browseNextSelector = browseNextSelector
      break
  }

  return globalState
}
