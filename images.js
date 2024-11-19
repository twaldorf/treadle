import { downloadAndSaveImage } from './getImages.js';
import { globalState } from './state.js'

export const getImages = async () => {
  console.log("Getting images")
  for (let scrapeid in globalState.scrapedData) {
    if (globalState.scrapedData[scrapeid].elements.imageUrls) {
      const url = globalState.scrapedData[scrapeid].elements.imageUrls[0]
      console.log(globalState.scrapedData[scrapeid].elements.imageUrls)
      const dir = './temp/images'
      // const append = globalState.projectInfo.appendCode + globalState.scrapedData[scrapeid].title
      const imgName = await downloadAndSaveImage(url, dir)
      if (imgName) {
        globalState.scrapedData[scrapeid].elements.imageName = imgName 
      }
    }
  }
}

export const processImages = () => {
  return null;
}