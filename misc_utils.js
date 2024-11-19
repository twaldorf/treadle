import { fileURLToPath } from 'node:url'
import { globalState } from './state.js'
import { checkpoint, loadCheckpoint, loadConfig } from './checkpointUtilities.js'
import * as fs from 'node:fs'
import path from 'node:path'
import { normalizeUrl } from './getImages.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

loadCheckpoint(10)
loadConfig()

export const stickScrapeAttrToPattern = (attrFrom, attrTo, index=null) => {
  for (const scrapeid in globalState.scrapedData) {
    const value = index != null ? globalState.scrapedData[scrapeid].elements[attrFrom][index] : globalState.scrapedData[scrapeid].elements[attrFrom] 
    const title = globalState.scrapedData[scrapeid].elements.title
    for (let i = 0; i < globalState.patterns.length; ++i) {
      if (globalState.patterns[i].title == title) {
        globalState.patterns[i][attrTo] = normalizeUrl(value)
      }
    }
  }
}

export const linkPatternImageNames = () => {
  const imgNames = fs.readdirSync(path.join(__dirname, '/images/'))
  console.log(imgNames)

  const newPatterns = []

  for (const pattern of globalState.patterns) {
    const patternTitle = pattern.title
    for (const imgName of imgNames) {
      if (imgName.includes(patternTitle)) {
        pattern.imgName = imgName
        newPatterns.push(pattern)
      }
    }
    newPatterns.push(pattern)
  }
  globalState.patterns = newPatterns
}

// linkPatternImageNames()
stickScrapeAttrToPattern("imageUrls", "image_name", 0)
checkpoint(10)

// Todos:
// 1 Optionally, save the image used for a product link listing instead of the main page image
//  This would require the links to be enriched. Which would be fine.