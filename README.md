# Treadle Scraper CLI

An LLM-powered web scraping CLI built with Node.js and Puppeteer. It collects product data from listing pages, scrapes item detail pages with CSS selectors, optionally downloads images, and can post-process the scraped records through an OpenAI model to normalize/clean the data.

## What It Does

- Interactive CLI to configure a scraping run
- Supports multiple browse schemes: paginated, infinite scroll, or booklet-style pages
- Scrapes item detail pages via CSS selectors
- Cleans whitespace and normalizes scraped values
- Optional LLM post-processing using OpenAI
- Checkpointing to resume long runs
- Optional image downloading

## Requirements

- Node.js (ESM project)
- An OpenAI API key for LLM processing
- Puppeteer will download a compatible Chromium build during install

## Install

```bash
npm install
```

## Quick Start

1. Set your OpenAI API key in the environment.

```bash
export OPENAI_API_KEY="your-key"
```

2. Configure `config.json` (see below).
3. Run the CLI.

```bash
npm start
```

## Configuration

The scraper reads `config.json`. You can generate a blank config via the CLI prompt or edit it directly.

Key fields:

- `schema`: List of fields to scrape (used to prompt for selectors)
- `selectors`: CSS selectors for each field in `schema`
- `itemLinkSelector`: CSS selector for item links on browse pages
- `mainContentSelector`: CSS selector for the main content area on item pages
- `checkpointThreshold`: How often to write a checkpoint while scraping
- `testLimit`: Max number of item pages to scrape (0 or negative to disable)
- `retryLimit`: Selector retry limit per field
- `prompt`: System prompt for LLM post-processing
- `tokenLimit`: Passed to the LLM step (not currently enforced by the model call)
- `image_tag` / `image_url_attribute`: Image scraping settings

Example structure (trimmed):

```json
{
  "schema": ["title", "price", "desc", "imageUrls", "url"],
  "selectors": {
    "title": "h1.product__title",
    "price": ".product__price",
    "desc": ".product__description",
    "imageUrls": ".product__gallery",
    "url": ""
  },
  "itemLinkSelector": ".product-card a",
  "mainContentSelector": "#TemplateProduct"
}
```

## Usage Flow

When you run `npm start`, the CLI walks through these steps:

1. Project info
2. Browse scheme (paginated, infinite scroll, or booklet)
3. Selectors (for each schema field + item link selector)
4. Scrape item links from browse pages
5. Scrape item pages
6. Clean whitespace
7. LLM post-processing (optional)
8. Download images (optional)

You can resume from the last checkpoint by selecting the step number at startup.

## Outputs

- Checkpoints are written to `temp/` as JSON snapshots of the full run state.
- Image downloads (if enabled) go to `temp/images/`.
- The final checkpoint includes `scrapedData` and `patterns` (LLM-processed records).

## Notes and Limitations

- This tool is interactive and assumes a human is present to provide selectors and handle retries.
- The OpenAI model is currently set to `gpt-4o-mini` in `llm_process.js`.
- `tokenLimit` is not enforced in the current OpenAI call.
- The `bin` entry in `package.json` is not wired to a CLI file in this repo; use `npm start` for now.

## Project Structure

- `main.js`: CLI entrypoint and pipeline controller
- `scrapeLinks.js` / `scrapeItems.js`: Puppeteer scraping steps
- `scrapeItem.js`: Per-page scraping logic
- `llm_process.js`: OpenAI post-processing
- `checkpointUtilities.js`: Save/resume checkpoints
- `config.json`: Active config
- `blankConfig.json`: Template config
