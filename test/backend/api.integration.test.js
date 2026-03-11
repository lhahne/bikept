const request = require('supertest');
const { createApp } = require('../../src/app');

describe('POST /api/generate integration', () => {
  it('returns 400 when prompt is missing', async () => {
    const app = createApp();
    const response = await request(app).post('/api/generate').send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Prompt is required/i);
  });

  it('returns workout payload with Zwift XML', async () => {
    delete process.env.OPENAI_API_KEY;
    const app = createApp();
    const response = await request(app)
      .post('/api/generate')
      .send({ prompt: '30 min zone 2' });

    expect(response.status).toBe(200);
    expect(response.body.workout.title).toMatch(/30 min/i);
    expect(response.body.workout.intervals[0].type).toBe('Warmup');
    expect(response.body.workout.intervals.at(-1).type).toBe('Cooldown');
    expect(response.body.zwiftXml).toContain('<workout_file>');
    expect(response.body.zwiftXml).toContain('<Warmup');
    expect(response.body.zwiftXml).toContain('<Cooldown');
  });
});
