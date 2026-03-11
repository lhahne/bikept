/* @vitest-environment jsdom */
const { renderChart, initApp } = require('../../public/app');

function setupDom() {
  document.body.innerHTML = `
    <form id="generator-form">
      <textarea id="prompt"></textarea>
      <button type="submit">Generate Workout</button>
    </form>
    <section id="result" class="hidden">
      <h2 id="workout-title"></h2>
      <p id="workout-description"></p>
      <div id="chart"></div>
      <button id="download-btn" type="button">Download .zwo</button>
    </section>
  `;
}

describe('frontend chart and UI tests', () => {
  beforeEach(() => {
    setupDom();
  });

  it('renders svg chart with time/effort axis labels', () => {
    const chart = document.getElementById('chart');
    renderChart(chart, [
      { name: 'Warmup', type: 'Warmup', durationSec: 300, startPower: 0.5, endPower: 0.7 },
      { name: 'Main', type: 'SteadyState', durationSec: 600, power: 0.9 },
      { name: 'Cooldown', type: 'Cooldown', durationSec: 300, startPower: 0.7, endPower: 0.5 }
    ]);

    expect(chart.querySelector('svg')).toBeTruthy();
    expect(chart.textContent).toContain('Time');
    expect(chart.textContent).toContain('Effort (% FTP)');
    expect(chart.querySelectorAll('polygon').length).toBe(3);
  });

  it('submits prompt and renders response payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        workout: {
          title: '30 min Zone 2 Workout',
          description: 'Sample',
          intervals: [
            { name: 'Warmup', type: 'Warmup', durationSec: 300, startPower: 0.5, endPower: 0.7 },
            { name: 'Main', type: 'SteadyState', durationSec: 1200, power: 0.68 },
            { name: 'Cooldown', type: 'Cooldown', durationSec: 300, startPower: 0.65, endPower: 0.5 }
          ]
        },
        zwiftXml: '<workout_file></workout_file>'
      })
    });

    initApp(document, fetchMock);
    document.getElementById('prompt').value = '30 min zone 2';
    document.getElementById('generator-form').dispatchEvent(new Event('submit'));

    await Promise.resolve();
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledWith('/api/generate', expect.any(Object));
    expect(document.getElementById('result').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('workout-title').textContent).toContain('30 min Zone 2');
    expect(document.querySelector('#chart svg')).toBeTruthy();
  });
});
