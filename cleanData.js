import { checkpoint } from './checkpointUtilities.js'
import { cleanSpaces } from './dataUtilities.js'
import { globalState } from './state.js'

export const cleanData = () => {
    console.log('Cleaning whitespace...')
    for (let item in globalState.scrapedData) {
      for (let attribute in globalState.scrapedData[item].elements) {
        if (globalState.config.cleanWhiteSpace == true) {
          console.log(`Cleaning attribute ${attribute} from ${globalState.scrapedData[item].elements.title}`)
          globalState.scrapedData[item].elements[attribute] = cleanSpaces(globalState.scrapedData[item].elements[attribute])
        }
      }
      // "35356scrapeid735": { "elements": {"title": "Pogonip Pullover",...}, } },
    }
    checkpoint(6)
}
