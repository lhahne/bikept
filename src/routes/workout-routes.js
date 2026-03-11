const express = require('express');
const { generateWithLLM } = require('../services/llm');
const { fallbackPlan, sanitizePlan } = require('../services/workout-planner');
const { toZwiftXml } = require('../services/zwift');

const router = express.Router();

router.post('/generate', async (req, res) => {
  try {
    const prompt = String(req.body.prompt || '').trim();
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    let plan;
    try {
      plan = await generateWithLLM(prompt);
    } catch (err) {
      plan = fallbackPlan(prompt);
      plan.description += ` (Fallback used: ${err.message})`;
    }

    const workout = sanitizePlan(plan);
    const zwiftXml = toZwiftXml(workout);
    return res.json({ workout, zwiftXml });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unexpected error' });
  }
});

module.exports = router;
