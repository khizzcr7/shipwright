// Shipwright demo service - the small product that the delivery agent ships.
// Zero-dependency HTTP service used to prove the pipeline end to end,
// including the monitor stage, which boots it and probes /health.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8'));

export function createAppServer() {
  return createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: 'shipwright-demo', version: pkg.version }));
      return;
    }
    if (req.url === '/api/version') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ name: pkg.name, version: pkg.version }));
      return;
    }
    if (req.url === '/') {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(
        '<!doctype html><title>Shipwright Demo</title>' +
          '<h1>Shipwright demo service</h1>' +
          '<p>This tiny service exists so the Shipwright delivery agent has ' +
          'something real to review, test, scan, package, release, and monitor.</p>' +
          '<p>Try <a href="/health">/health</a> or <a href="/api/version">/api/version</a>.</p>',
      );
      return;
    }
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found' }));
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT || 3000);
  createAppServer().listen(port, () => {
    process.stdout.write(`shipwright-demo listening on port ${port}\n`);
  });
}
