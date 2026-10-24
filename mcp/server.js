// Shipwright MCP server - exposes the delivery stage checks as MCP tools
// over stdio (JSON-RPC 2.0, newline-delimited). GitLab Duo Agent Platform
// can connect external MCP servers as clients, so a Duo agent or flow can
// call these tools to run real post-code checks and then propose actions
// for human approval (Assisted autonomy).
//
// Tools:
//   security_scan      - scan a project tree for committed secrets
//   code_review        - static review heuristics (debug leftovers, TODOs)
//   compliance_check   - license / README / CI compliance checks
//   release_readiness  - run all nine stages and return a summary
import { createInterface } from 'node:readline';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const STAGE_FILES = {
  plan: 'plan.js', create: 'review.js', verify: 'verify.js', package: 'package.js',
  secure: 'security.js', release: 'release.js', configure: 'configure.js',
  monitor: 'monitor.js', govern: 'govern.js',
};

async function runStage(id, root) {
  const mod = await import(new URL(`../agent/stages/${STAGE_FILES[id]}`, import.meta.url));
  return mod.run({ root, reportOnly: true });
}

const TOOLS = [
  {
    name: 'security_scan',
    description: 'Scan a project tree for committed secrets and credential-shaped strings.',
    inputSchema: { type: 'object', properties: { root: { type: 'string', description: 'Project root path (defaults to this project)' } } },
    stage: 'secure',
  },
  {
    name: 'code_review',
    description: 'Run static code review heuristics: debug statements, unresolved work markers, oversized files.',
    inputSchema: { type: 'object', properties: { root: { type: 'string' } } },
    stage: 'create',
  },
  {
    name: 'compliance_check',
    description: 'Check delivery compliance: MIT license, README setup docs, CI config, .gitignore hygiene.',
    inputSchema: { type: 'object', properties: { root: { type: 'string' } } },
    stage: 'govern',
  },
  {
    name: 'release_readiness',
    description: 'Run all nine post-code DevSecOps stages and return a readiness summary.',
    inputSchema: { type: 'object', properties: { root: { type: 'string' } } },
    stage: null,
  },
];

async function callTool(name, args) {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  const root = (args && args.root) || projectRoot;
  if (tool.stage) {
    const res = await runStage(tool.stage, root);
    return `${res.name} (${res.stage}): ${res.status.toUpperCase()}\n${res.findings.map((f) => `- ${f}`).join('\n')}`;
  }
  const lines = [];
  let ready = true;
  for (const id of Object.keys(STAGE_FILES)) {
    const res = await runStage(id, root);
    if (res.status === 'fail') ready = false;
    lines.push(`${res.stage}: ${res.status.toUpperCase()} - ${res.findings[0] || ''}`);
  }
  return `Release readiness: ${ready ? 'READY' : 'NOT READY'}\n${lines.join('\n')}`;
}

function send(obj) {
  process.stdout.write(`${JSON.stringify(obj)}\n`);
}

const rl = createInterface({ input: process.stdin });
rl.on('line', async (line) => {
  if (!line.trim()) return;
  let msg;
  try { msg = JSON.parse(line); } catch { return; }
  const { id, method, params } = msg;
  if (id === undefined || id === null) return; // notification, no response
  try {
    if (method === 'initialize') {
      send({
        jsonrpc: '2.0', id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'shipwright', version: '0.1.0' },
        },
      });
    } else if (method === 'ping') {
      send({ jsonrpc: '2.0', id, result: {} });
    } else if (method === 'tools/list') {
      send({
        jsonrpc: '2.0', id,
        result: { tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) },
      });
    } else if (method === 'tools/call') {
      const text = await callTool(params.name, params.arguments || {});
      send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text }] } });
    } else {
      send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
    }
  } catch (err) {
    send({ jsonrpc: '2.0', id, error: { code: -32603, message: String(err && err.message || err) } });
  }
});
