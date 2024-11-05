import OpenAI from "openai";
import fs from "fs";
const openai = new OpenAI();

function prep(obj) {
    return JSON.stringify(obj, null, 2)
}

async function processOne(pattern, prompt, limit) {
    const pattern_less = { title: pattern.title, designer: pattern.designer, desc: pattern.desc, notions: pattern.notions };

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
    const modifiedPattern = { ...pattern_less, ...result };
    return modifiedPattern;
}

const final_json = await processOne(test_pattern)

var all_patterns = {}

// for easy retry/continuation
const rangeStart = 56;

// for (let i = rangeStart; i < pattern_names.length; i++) {
//     console.log('processing pattern: ', pattern_names[i]);
//     const mod_pattern = await processOne(patterns[pattern_names[i]]);
//     console.log('results recieved from: ', pattern_names[i]);
//     all_patterns = {...all_patterns, [pattern_names[i]]: mod_pattern};
//     if (i % 5 == 0) {
//         console.log('saving to file for saving progress');
//         fs.writeFileSync(`mnm_patterns_ai_${i}.json`, JSON.stringify(all_patterns, null, 2));
//     }
// }