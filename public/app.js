const CHART_WIDTH = 760;
const CHART_HEIGHT = 320;
const AXIS_LEFT = 56;
const AXIS_RIGHT = 24;
const AXIS_TOP = 16;
const AXIS_BOTTOM = 40;
const PLOT_WIDTH = CHART_WIDTH - AXIS_LEFT - AXIS_RIGHT;
const PLOT_HEIGHT = CHART_HEIGHT - AXIS_TOP - AXIS_BOTTOM;

function colorFor(step) {
  if (step.type === 'Warmup') return '#f59e0b';
  if (step.type === 'Cooldown') return '#38bdf8';
  const p = step.power ?? step.endPower ?? 0.7;
  if (p >= 1.05) return '#ef4444';
  if (p >= 0.88) return '#fb7185';
  if (p >= 0.74) return '#22c55e';
  return '#60a5fa';
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function effortToY(effort) {
  const normalized = clamp(effort, 0.4, 1.3);
  const ratio = (normalized - 0.4) / (1.3 - 0.4);
  return AXIS_TOP + (1 - ratio) * PLOT_HEIGHT;
}

function timeToX(seconds, totalSeconds) {
  return AXIS_LEFT + (seconds / totalSeconds) * PLOT_WIDTH;
}

function renderChart(chartEl, intervals) {
  chartEl.innerHTML = '';
  const total = intervals.reduce((sum, step) => sum + step.durationSec, 0) || 1;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`);
  svg.classList.add('workout-chart');

  const plotBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  plotBg.setAttribute('x', AXIS_LEFT);
  plotBg.setAttribute('y', AXIS_TOP);
  plotBg.setAttribute('width', PLOT_WIDTH);
  plotBg.setAttribute('height', PLOT_HEIGHT);
  plotBg.setAttribute('fill', '#0b1428');
  plotBg.setAttribute('stroke', '#38537f');
  svg.appendChild(plotBg);

  [0.5, 0.7, 0.9, 1.1, 1.3].forEach((tick) => {
    const y = effortToY(tick);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', AXIS_LEFT);
    line.setAttribute('y1', y);
    line.setAttribute('x2', AXIS_LEFT + PLOT_WIDTH);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', '#22395f');
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', AXIS_LEFT - 8);
    label.setAttribute('y', y + 4);
    label.setAttribute('text-anchor', 'end');
    label.setAttribute('class', 'axis-text');
    label.textContent = `${Math.round(tick * 100)}%`;
    svg.appendChild(label);
  });

  let elapsed = 0;
  intervals.forEach((step) => {
    const x1 = timeToX(elapsed, total);
    const x2 = timeToX(elapsed + step.durationSec, total);
    elapsed += step.durationSec;

    const startEffort = step.type === 'SteadyState' ? step.power : step.startPower;
    const endEffort = step.type === 'SteadyState' ? step.power : step.endPower;
    const y1 = effortToY(startEffort);
    const y2 = effortToY(endEffort);
    const baseY = AXIS_TOP + PLOT_HEIGHT;

    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    poly.setAttribute('points', `${x1},${baseY} ${x1},${y1} ${x2},${y2} ${x2},${baseY}`);
    poly.setAttribute('fill', colorFor(step));
    poly.setAttribute('fill-opacity', '0.82');
    poly.setAttribute('stroke', '#d9e2f7');
    poly.setAttribute('stroke-opacity', '0.6');
    poly.setAttribute('stroke-width', '0.6');

    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = step.type === 'SteadyState'
      ? `${step.name}: ${Math.round(step.durationSec / 60)} min @ ${Math.round((step.power || 0) * 100)}% FTP`
      : `${step.name}: ${Math.round(step.durationSec / 60)} min, ${Math.round((step.startPower || 0) * 100)}% → ${Math.round((step.endPower || 0) * 100)}% FTP`;
    poly.appendChild(title);
    svg.appendChild(poly);
  });

  const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  xAxis.setAttribute('x1', AXIS_LEFT);
  xAxis.setAttribute('y1', AXIS_TOP + PLOT_HEIGHT);
  xAxis.setAttribute('x2', AXIS_LEFT + PLOT_WIDTH);
  xAxis.setAttribute('y2', AXIS_TOP + PLOT_HEIGHT);
  xAxis.setAttribute('stroke', '#8fa9d6');
  svg.appendChild(xAxis);

  const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  yAxis.setAttribute('x1', AXIS_LEFT);
  yAxis.setAttribute('y1', AXIS_TOP);
  yAxis.setAttribute('x2', AXIS_LEFT);
  yAxis.setAttribute('y2', AXIS_TOP + PLOT_HEIGHT);
  yAxis.setAttribute('stroke', '#8fa9d6');
  svg.appendChild(yAxis);

  const maxMinute = Math.round(total / 60);
  const tickCount = Math.min(8, Math.max(4, Math.floor(maxMinute / 5)));
  for (let i = 0; i <= tickCount; i += 1) {
    const t = (i / tickCount) * total;
    const x = timeToX(t, total);

    const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tick.setAttribute('x1', x);
    tick.setAttribute('y1', AXIS_TOP + PLOT_HEIGHT);
    tick.setAttribute('x2', x);
    tick.setAttribute('y2', AXIS_TOP + PLOT_HEIGHT + 6);
    tick.setAttribute('stroke', '#8fa9d6');
    svg.appendChild(tick);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', x);
    label.setAttribute('y', AXIS_TOP + PLOT_HEIGHT + 20);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('class', 'axis-text');
    label.textContent = `${Math.round(t / 60)}m`;
    svg.appendChild(label);
  }

  const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  xLabel.setAttribute('x', AXIS_LEFT + PLOT_WIDTH / 2);
  xLabel.setAttribute('y', CHART_HEIGHT - 8);
  xLabel.setAttribute('text-anchor', 'middle');
  xLabel.setAttribute('class', 'axis-title');
  xLabel.textContent = 'Time';
  svg.appendChild(xLabel);

  const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  yLabel.setAttribute('x', 16);
  yLabel.setAttribute('y', AXIS_TOP + PLOT_HEIGHT / 2);
  yLabel.setAttribute('transform', `rotate(-90 16 ${AXIS_TOP + PLOT_HEIGHT / 2})`);
  yLabel.setAttribute('text-anchor', 'middle');
  yLabel.setAttribute('class', 'axis-title');
  yLabel.textContent = 'Effort (% FTP)';
  svg.appendChild(yLabel);

  chartEl.appendChild(svg);
}

function initApp(doc = document, implFetch = fetch) {
  const form = doc.getElementById('generator-form');
  if (!form) return;

  const promptInput = doc.getElementById('prompt');
  const resultEl = doc.getElementById('result');
  const titleEl = doc.getElementById('workout-title');
  const descriptionEl = doc.getElementById('workout-description');
  const chartEl = doc.getElementById('chart');
  const downloadBtn = doc.getElementById('download-btn');

  let currentXml = '';
  let currentTitle = 'workout';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Generating...';

    try {
      const response = await implFetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to generate workout');
      }

      const { workout, zwiftXml } = payload;
      currentXml = zwiftXml;
      currentTitle = workout.title;

      titleEl.textContent = workout.title;
      descriptionEl.textContent = workout.description;
      renderChart(chartEl, workout.intervals);
      resultEl.classList.remove('hidden');
    } catch (error) {
      alert(error.message);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Generate Workout';
    }
  });

  downloadBtn.addEventListener('click', () => {
    if (!currentXml) return;
    const blob = new Blob([currentXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const anchor = doc.createElement('a');
    anchor.href = url;
    anchor.download = `${currentTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.zwo`;
    anchor.click();
    URL.revokeObjectURL(url);
  });
}

if (typeof document !== 'undefined') {
  initApp();
}

if (typeof module !== 'undefined') {
  module.exports = {
    colorFor,
    clamp,
    effortToY,
    timeToX,
    renderChart,
    initApp
  };
}
