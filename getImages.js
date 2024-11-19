import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'

// from ChatGPT
export async function downloadAndSaveImage(url, outputDir, prefix="") {
  const imageUrl = normalizeUrl(url)
  console.log("scraping from ", imageUrl)
    try {
        // Create output directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true })
        }

        // Fetch the image data
        const response = await fetch(imageUrl)
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`)
        }

        // Generate the output file path
        const fileName = `${prefix}_${path.basename(imageUrl)}`
        const outputPath = path.join(outputDir, fileName)

        // Stream the response body to a file
        const writer = fs.createWriteStream(outputPath)
        response.body.pipe(writer)

        // Return a promise that resolves when the file is fully written
        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(imageUrl))
            writer.on('error', reject)
        })
    } catch (error) {
        console.error(`Failed to download image: ${imageUrl}`, error)
        throw error
    }
   return imageUrl
}

// from ChatGPT
export function normalizeUrl(url) {
  // Check if the URL starts with "//" and prepend "https:" to it
  if (url.startsWith('//')) {
    url = `https:${url}`
  }

  // Validate or fix other common issues with the URL
  try {
      const normalized = new URL(url)
      normalized.search = ""
      return normalized.href
  } catch (e) {
      console.error(`Invalid URL: ${url}`);
      throw new Error(`Unable to normalize URL: ${url}`);
  }
}