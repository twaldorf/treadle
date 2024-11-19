import OpenAI from "openai";
import fs from "fs";
import { globalState } from './state.js'
import { checkpoint } from "./checkpointUtilities.js";


function prep(obj) {
  return JSON.stringify(obj, null, 2)
}

export async function processWithLLM() {
  const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
  const apiKey = process.env.OPENAI_API_KEY
  if (apiKey && globalState.config.prompt) {
    console.log('Processing all scraped patterns with LLM...')
    const { prompt, tokenLimit } = globalState.config
    const scrapedData = globalState.scrapedData
    let patterns = []
    let count = 0;
    for (let scrapeid in scrapedData) {
      // Saturation attempt to fight the duplication problem
      if (patterns.filter((pattern) => pattern.title == scrapedData[scrapeid].title).length == 0) {
        ++count
        const pattern = await processOne(openai, scrapedData[scrapeid].elements, prompt, tokenLimit)
        patterns.push(pattern)
        globalState.patterns = patterns
        if (count % globalState.config.checkpointThreshold == 0) {
          checkpoint(7)
        }
      } else {
        ++count
        globalState.errorCount++
      }
    }
    globalState.patterns = patterns
  } else {
    console.log('LLM API details missing, skipping LLM processing...')
  }
}

async function processOne(openai, pattern, prompt, limit) {
    const pattern_less = { title: pattern.title, designer: pattern.designer, desc: pattern.desc, notions: pattern.notions, fabric_recommendations: pattern.fabric_recommendations, fabric_requirements: pattern.fabric_requirements }

    setTimeout(() => {}, 2000)

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { "type": "json_object" },
        messages: [
            { role: "system", content: prompt },
            {
                role: "user",
                content: prep(pattern_less), 
            },
        ],
    });
    console.log(completion.choices[0].message)
    const result = JSON.parse(completion.choices[0].message.content);
    return result;
}