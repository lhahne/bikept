const { fallbackPlan, sanitizePlan } = require('./workout-planner');

async function generateWithLLM(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallbackPlan(prompt);
  }

  const schemaHint = {
    title: 'Workout title',
    description: 'Short description',
    intervals: [
      { name: 'Warmup', type: 'Warmup', durationSec: 600, startPower: 0.5, endPower: 0.75 },
      { name: 'Main', type: 'SteadyState', durationSec: 1800, power: 0.68 },
      { name: 'Cooldown', type: 'Cooldown', durationSec: 480, startPower: 0.65, endPower: 0.5 }
    ]
  };

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content:
            'You are a cycling coach. Return ONLY JSON matching the requested schema. Always include warmup and cooldown. All powers are fractional FTP targets between 0.4 and 1.3.'
        },
        {
          role: 'user',
          content: `Generate a Zwift workout plan from: "${prompt}". Use this shape: ${JSON.stringify(schemaHint)}`
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`LLM request failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data.output_text || '';
  const parsed = JSON.parse(text);
  return sanitizePlan(parsed);
}

module.exports = { generateWithLLM };
