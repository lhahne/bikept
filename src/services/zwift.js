function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toZwiftXml(workout) {
  const steps = workout.intervals
    .map((step) => {
      if (step.type === 'SteadyState') {
        return `      <SteadyState Duration="${Math.round(step.durationSec)}" Power="${step.power.toFixed(2)}" />`;
      }
      if (step.type === 'Warmup') {
        return `      <Warmup Duration="${Math.round(step.durationSec)}" PowerLow="${step.startPower.toFixed(2)}" PowerHigh="${step.endPower.toFixed(2)}" />`;
      }
      return `      <Cooldown Duration="${Math.round(step.durationSec)}" PowerLow="${step.startPower.toFixed(2)}" PowerHigh="${step.endPower.toFixed(2)}" />`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>bikept</author>
  <name>${escapeXml(workout.title)}</name>
  <description>${escapeXml(workout.description || '')}</description>
  <sportType>bike</sportType>
  <workout>
${steps}
  </workout>
</workout_file>`;
}

module.exports = { escapeXml, toZwiftXml };
