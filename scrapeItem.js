import { Schemes } from "./schemes.js"

export const scrapeItemElementsFromLink = async (browser, url, globalState) => {
  const page = await browser.newPage()
  await page.waitForNetworkIdle()
  await page.goto(url)

  try {
    console.log('Getting elements from ', url)
    const newState = await getInfoFromProductPage(page, globalState)
    globalState = newState
  } catch (e) {console.log(e)}

  return globalState
}

export const scrapeItemLinksFromBrowse = async (browser, globalState) => {
  const page = await browser.newPage()

  const browseUrls = globalState.browseUrls
  const itemLinkSelector = globalState.itemLinkSelector

  globalState.itemLinks = []
  let attempts = 0
  const retryLimit = 10 // TODO move to config

  // Get product links on each page
  while (globalState.itemLinks.length < 1 && retryLimit != attempts) { 
    if (attempts > 0) {
      const newILS = await globalState.rl.question('0 links scraped, try another selector for item links from browse:')
      globalState.itemLinkSelector = newILS
    }
    // Handle browse schemes based on booklet or non-booklet schemes: infinite scroll or paginated
    if (globalState.browseScheme != Schemes.BOOKLET) {
      for (let i = 0; i < browseUrls.length; ++i) {
        const page_url = browseUrls[i]
        console.log('Navigating to ', page_url)
        await page.goto(page_url, {waitUntil: "domcontentloaded"})

        // force infinite scroll to load all content
        if (globalState.browseScheme == Schemes.INFINITE) {
          await autoScroll(page);
        }

        // gather links
        const products_on_page_pre = await page.$$eval(itemLinkSelector, (products, links) => {
          // if a link is already listed, do not add it
          return products.map(p => links.includes(p.href) ? null : p.href)
        }, globalState.itemLinks)

        // update state
        globalState.itemLinks = globalState.itemLinks.concat(products_on_page_pre)

        // record attempt for retry purposes
        attempts++
        console.log('Product links obtained from ' + page_url) 
      }
    }
  }

  // Booklet browse scheme for big 4 and other yui sites, speculative
    if (globalState.browseScheme == Schemes.BOOKLET) {
      while (!await page.$eval(itemLinkSelector).element.disabled) {
        const products_on_page_pre = await page.$$eval(itemLinkSelector, products => {
          return products.map(p => p.href)
        })

        // add links
        globalState.itemLinks = globalState.itemLinks.concat(products_on_page_pre)
        const nextbtn = await page.$eval(globalState.browseNextSelector)
        await page.waitForNetworkIdle()
        await page.click(nextbtn)
      }
    }

    return globalState
}

// Evaluate and assemble elements
export const getInfoFromProductPage = async (page, globalState) => {
  // Wait for the page to load, enough
  await page.waitForSelector(globalState.mainContentSelector);

  const scrapeId = Date.now().toString()
  const item = { elements: {} }
  item.elements.url = page.url()

  const scrapeImageUrls = async (page, containerSelector, tag, attribute) => {
    return await page.evaluate((selector, tag, attribute) => {
      console.log('images')
      const imgContainer = document.querySelector(selector)
      const images = imgContainer.querySelectorAll(tag)
      const image_urls_all = Array.from(images).map(elt => elt.getAttribute(attribute))
      const image_urls = image_urls_all.filter(e=>e) // remove null urls
      return image_urls
    }, containerSelector, tag, attribute)
  }

  const attemptSimpleScrape = async (selector, globalState) => {
    console.log('Scraping ', selector)
    let result = await page.$eval(globalState.selectors[selector], e => e.textContent)
    if (result.length == 0) {
      globalState.errorCount++
      throw new error('empty result, for: ', result, selector)
    }
    return result
  }
  
  // Attempt programmatically and gracefully to collect data and increment error counts where appropriate
  for (let selector in globalState.selectors) {
    let success = false
    let attempts = 0
    let retryLimit = globalState.config.retryLimit

    while (!success && retryLimit && attempts < retryLimit) {
      console.log(selector)
      if (globalState.selectors[selector].length > 0) {
        try {
          attempts++
          console.log(attempts)
          switch (selector) {
            case "imageUrls":
              const images = await scrapeImageUrls(page, globalState.selectors[selector], globalState.config.image_tag, globalState.config.image_url_attribute)
              item.elements[selector] = images
              success = true
              break
            default:
              console.log('scraping', selector)
              const result = await attemptSimpleScrape(selector, globalState)
              item.elements[selector] = result
              success = true
              break
          }
        } catch (e) {
          console.log('Failure in ' + selector, e)
          globalState.errorCount++
          const newSelector = await globalState.rl.question('Please enter another selector for ', selector)
          globalState.selectors[selector] = newSelector
        }
      } else {
        success = true
      }
    }
  }

  globalState.scrapedData[scrapeId] = item
  
  return globalState
}

// puppeteer page manipulation utilities
async function autoScroll(page) {
  await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
          let totalHeight = 0
          const distance = 100 // scroll distance in pixels
          const maxScrolls = 20 // limit the number of scrolls if necessary
          let scrollCount = 0

          const timer = setInterval(() => {
            console.log('Scrolling')
              window.scrollBy(0, distance)
              totalHeight += distance
              scrollCount++

              // Stop scrolling if we reach the bottom or a max scroll count
              if (totalHeight >= document.body.scrollHeight || scrollCount >= maxScrolls) {
                  clearInterval(timer)
                  resolve()
              }
          }, 500) // wait time between scrolls to allow content to load
      })
  })
}
