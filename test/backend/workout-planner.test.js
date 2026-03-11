const { parseDuration, inferWorkoutType, fallbackPlan, sanitizePlan } = require('../../src/services/workout-planner');

describe('workout-planner unit tests', () => {
  it('parses and clamps duration from prompt', () => {
    expect(parseDuration('30 min zone 2')).toBe(30);
    expect(parseDuration('500 minutes endurance')).toBe(180);
    expect(parseDuration('no duration')).toBe(45);
  });

  it('infers workout type from prompt keywords', () => {
    expect(inferWorkoutType('threshold intervals')).toBe('threshold');
    expect(inferWorkoutType('just endurance miles')).toBe('endurance');
  });

  it('fallback plan includes warmup and cooldown', () => {
    const plan = fallbackPlan('40 min threshold workout');
    expect(plan.intervals[0].type).toBe('Warmup');
    expect(plan.intervals[plan.intervals.length - 1].type).toBe('Cooldown');
  });

  it('sanitize plan drops invalid intervals and normalizes power bounds', () => {
    const cleaned = sanitizePlan({
      title: 'X',
      intervals: [
        { type: 'Warmup', name: 'wu', durationSec: 10, startPower: 0.1, endPower: 2.0 },
        { type: 'SteadyState', name: 'main', durationSec: 100, power: 2.5 },
        { type: 'Cooldown', name: 'cd', durationSec: 100, startPower: 1, endPower: 0.2 },
        { type: 'FakeType', durationSec: 100 }
      ]
    });

    expect(cleaned.intervals).toHaveLength(3);
    expect(cleaned.intervals[0].startPower).toBeGreaterThanOrEqual(0.4);
    expect(cleaned.intervals[1].power).toBeLessThanOrEqual(1.3);
  });
});
