import { globalState } from './state.js'
import { checkpoint, loadCheckpoint, loadConfig } from './checkpointUtilities.js'
import * as fs from 'node:fs'
import path from 'node:path'
import { normalizeUrl } from './getImages.js'

const __dirname = path.dirname(process.cwd())

export const stickScrapeAttrToPattern = (attrFrom, attrTo, index=null) => {
  for (const scrapeid in globalState.scrapedData) {
    const value = index != null ? globalState.scrapedData[scrapeid].elements[attrFrom][index] : globalState.scrapedData[scrapeid].elements[attrFrom] 
    const title = globalState.scrapedData[scrapeid].elements.title
    for (let i = 0; i < globalState.patterns.length; ++i) {
      if (globalState.patterns[i].title == title) {
        globalState.patterns[i][attrTo] = value
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

export const cutAttrValueAfterSlash = (attribute) => {
  const regex = /[^/]+$/;
  for (const sid in globalState.scrapedData) {
    globalState.scrapedData[sid].elements[attribute] = globalState.scrapedData[sid].elements[attribute].match(regex)
  }
}

export const cutImageNameAfterSlash = () => {
  const regex = /[^/]+$/;
  let newPatterns = []
  for (let pattern of globalState.patterns) {
    pattern.image_name = pattern.image_name.match(regex)
    newPatterns.push(pattern)
  }
  globalState.patterns = newPatterns
}

export const addAttrToPattern = (attr, value) => {
  let newPatterns = []
  for (let pattern of globalState.patterns) {
    pattern[attr] = value
    newPatterns.push(pattern)
  }
  globalState.patterns = newPatterns
}

export const remove$FromPatternCost = () => {
  let newPatterns = []
  for (let pattern of globalState.patterns) {
    if (pattern.price) {
      pattern.price = pattern.price.split('$')[1]
    }
    newPatterns.push(pattern)
  }
  globalState.patterns = newPatterns
}

// linkPatternImageNames()


// Todos:
// 1 Optionally, save the image used for a product link listing instead of the main page image
//  This would require the links to be enriched. Which would be fine.