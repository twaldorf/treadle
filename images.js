import { downloadAndSaveImage } from './getImages.js';
import { globalState } from './state.js'

export const getImages = async () => {
  console.log("Getting images")
  for (let scrapeid in globalState.scrapedData) {
    if (globalState.scrapedData[scrapeid].elements.imageUrls) {
      const url = globalState.scrapedData[scrapeid].elements.imageUrls[0]
      console.log(globalState.scrapedData[scrapeid].elements.imageUrls)
      const dir = './images'
      // const append = globalState.projectInfo.appendCode + globalState.scrapedData[scrapeid].title
      const success = await downloadAndSaveImage(url, dir)
    }
  }
}

export const processImages = () => {
  return null;
}