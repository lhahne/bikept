const { FTP_MAP, POWER_MIN, POWER_MAX, MIN_INTERVAL_SEC, MAX_INTERVAL_SEC } = require('../config/constants');
const { clamp } = require('../utils/math');

function parseDuration(prompt) {
  const match = String(prompt).match(/(\d+)\s*(min|minute|minutes)/i);
  if (!match) return 45;
  return clamp(Number.parseInt(match[1], 10), 20, 180);
}

function inferWorkoutType(prompt) {
  const lower = String(prompt).toLowerCase();
  if (lower.includes('threshold')) return 'threshold';
  if (lower.includes('vo2') || lower.includes('vo₂')) return 'vo2';
  if (lower.includes('sweet spot') || lower.includes('sweetspot')) return 'sweetspot';
  if (lower.includes('tempo')) return 'tempo';
  if (lower.includes('zone 2') || lower.includes('z2') || lower.includes('endurance')) return 'endurance';
  return 'endurance';
}

function fallbackPlan(prompt) {
  const totalMinutes = parseDuration(prompt);
  const type = inferWorkoutType(prompt);

  const warmupMinutes = clamp(Math.round(totalMinutes * 0.18), 6, 15);
  const cooldownMinutes = clamp(Math.round(totalMinutes * 0.14), 5, 12);
  const mainMinutes = totalMinutes - warmupMinutes - cooldownMinutes;

  const warmup = [{
    name: 'Warmup',
    type: 'Warmup',
    durationSec: warmupMinutes * 60,
    startPower: FTP_MAP.z1,
    endPower: type === 'threshold' || type === 'vo2' ? 0.78 : 0.72
  }];

  const intervals = [];
  if (type === 'threshold') {
    const reps = mainMinutes >= 28 ? 3 : 2;
    const work = Math.floor((mainMinutes * 0.72) / reps);
    const recovery = Math.floor((mainMinutes - work * reps) / reps);
    for (let i = 0; i < reps; i += 1) {
      intervals.push({ name: `Threshold ${i + 1}`, type: 'SteadyState', durationSec: work * 60, power: FTP_MAP.threshold });
      intervals.push({ name: `Recovery ${i + 1}`, type: 'SteadyState', durationSec: clamp(recovery * 60, 120, 480), power: FTP_MAP.z2 });
    }
  } else if (type === 'vo2') {
    const reps = clamp(Math.floor(mainMinutes / 4), 4, 8);
    const workSec = 120;
    const recSec = Math.max(Math.floor((mainMinutes * 60 - reps * workSec) / reps), 120);
    for (let i = 0; i < reps; i += 1) {
      intervals.push({ name: `VO2 ${i + 1}`, type: 'SteadyState', durationSec: workSec, power: FTP_MAP.vo2 });
      intervals.push({ name: `Recovery ${i + 1}`, type: 'SteadyState', durationSec: recSec, power: FTP_MAP.z2 });
    }
  } else if (type === 'sweetspot') {
    const reps = mainMinutes >= 36 ? 3 : 2;
    const work = Math.floor((mainMinutes * 0.8) / reps);
    const recovery = Math.floor((mainMinutes - work * reps) / reps);
    for (let i = 0; i < reps; i += 1) {
      intervals.push({ name: `Sweet Spot ${i + 1}`, type: 'SteadyState', durationSec: work * 60, power: FTP_MAP.sweetspot });
      intervals.push({ name: `Recovery ${i + 1}`, type: 'SteadyState', durationSec: clamp(recovery * 60, 120, 420), power: FTP_MAP.z2 });
    }
  } else if (type === 'tempo') {
    intervals.push({ name: 'Tempo Block', type: 'SteadyState', durationSec: mainMinutes * 60, power: FTP_MAP.tempo });
  } else {
    intervals.push({ name: 'Zone 2 Endurance', type: 'SteadyState', durationSec: mainMinutes * 60, power: FTP_MAP.z2 });
  }

  const cooldown = [{
    name: 'Cooldown',
    type: 'Cooldown',
    durationSec: cooldownMinutes * 60,
    startPower: type === 'vo2' ? 0.72 : 0.65,
    endPower: 0.5
  }];

  return {
    title: `${totalMinutes} min ${type === 'endurance' ? 'Zone 2' : type.charAt(0).toUpperCase() + type.slice(1)} Workout`,
    description: `Auto-generated workout for "${prompt}" with warmup, structured main set, and cooldown.`,
    intervals: [...warmup, ...intervals, ...cooldown]
  };
}

function sanitizePlan(plan) {
  const cleaned = {
    title: String(plan.title || 'Generated Workout').trim().slice(0, 80),
    description: String(plan.description || '').trim().slice(0, 300),
    intervals: Array.isArray(plan.intervals) ? plan.intervals : []
  };

  cleaned.intervals = cleaned.intervals
    .map((step) => {
      const type = String(step.type || '').trim();
      if (!['Warmup', 'Cooldown', 'SteadyState'].includes(type)) return null;

      const interval = {
        name: String(step.name || type).trim().slice(0, 60),
        type,
        durationSec: clamp(Number(step.durationSec) || 60, MIN_INTERVAL_SEC, MAX_INTERVAL_SEC)
      };

      if (type === 'SteadyState') {
        interval.power = clamp(Number(step.power) || FTP_MAP.z2, POWER_MIN, POWER_MAX);
      } else {
        interval.startPower = clamp(Number(step.startPower) || FTP_MAP.z1, POWER_MIN, POWER_MAX);
        interval.endPower = clamp(Number(step.endPower) || FTP_MAP.z2, POWER_MIN, POWER_MAX);
      }

      return interval;
    })
    .filter(Boolean);

  if (cleaned.intervals.length < 3) {
    return fallbackPlan(cleaned.title || '45 min zone 2');
  }

  return cleaned;
}

module.exports = {
  parseDuration,
  inferWorkoutType,
  fallbackPlan,
  sanitizePlan
};
