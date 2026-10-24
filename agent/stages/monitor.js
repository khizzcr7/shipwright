// MONITOR stage - boots the demo service on an ephemeral port and probes its
// health endpoint, the same check a post-deploy monitor would run.
import { result } from './util.js';

export async function run(ctx) {
  let createAppServer;
  try {
    ({ createAppServer } = await import(new URL('../../src/app.js', import.meta.url)));
  } catch (err) {
    return result('monitor', 'Monitor', 'fail', [`Could not load the demo service: ${err.message}`]);
  }
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const started = Date.now();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    const body = await res.json();
    const ms = Date.now() - started;
    if (res.status === 200 && body.status === 'ok') {
      return result('monitor', 'Monitor', 'pass',
        [`Health probe OK: GET /health -> 200 in ${ms}ms (service ${body.service}, v${body.version}).`],
        { latencyMs: ms });
    }
    return result('monitor', 'Monitor', 'fail', [`Health probe unhealthy: HTTP ${res.status}, body ${JSON.stringify(body)}`]);
  } catch (err) {
    return result('monitor', 'Monitor', 'fail', [`Health probe error: ${err.message}`]);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}
