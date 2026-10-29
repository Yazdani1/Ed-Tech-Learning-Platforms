#!/usr/bin/env node
// `npm run dev`: the fast way to work on the project on Windows/macOS.
// MongoDB and the backend run in Docker; the frontend runs directly on this computer.
// Running the frontend inside Docker on a Windows drive is slow: every file read crosses into the Linux VM and
// file changes must be polled. On the host it reads the files directly, so pages compile in seconds.
//
//   1. checks that the frontend packages are installed and the ports are free
//   2. removes the Docker frontend container (if any) and starts mongo + backend in Docker
//   3. waits until the backend answers, then starts the frontend here (Ctrl+C stops it)
//
// Docker keeps running after Ctrl+C; `npm run dev:down` stops it.

import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';

const FRONTEND_DIR = fileURLToPath(new URL('../frontend/', import.meta.url));
const NEXT_BIN = `${FRONTEND_DIR}node_modules/next/dist/bin/next`;

// The first start builds the dev image and installs the backend packages: allow a few minutes
const BACKEND_WAIT_MS = 5 * 60_000;
const POLL_MS = 1000;
const HEALTH_TIMEOUT_MS = 2000;

const FRONTEND_PORT = Number(process.env.FRONTEND_PORT ?? '3000');
const BACKEND_PORT = Number(process.env.BACKEND_PORT ?? '5000');
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;

function fail(message, code = 1) {
  console.error(`\n${message}`);
  process.exit(code);
}

/** Runs a command with live output; exits the script when it fails. */
function run(command, args, failMessage) {
  console.log(`\n> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) fail(failMessage, result.status ?? 1);
}

function checkDocker() {
  const result = spawnSync('docker', ['info'], { stdio: 'ignore' });
  if (result.error)
    fail('Docker is not installed. Install Docker Desktop, then run `npm run dev` again.');
  if (result.status !== 0)
    fail('Docker is not running. Start Docker Desktop, then run `npm run dev` again.');
}

/** True when nothing listens on the port at this address. */
function addressIsFree(port, host) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', (error) => resolve(error.code === 'EADDRNOTAVAIL')); // no IPv6 on this computer
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port, host);
  });
}

/** True when the port is free on both IPv4 and IPv6 localhost ("localhost" may resolve to either). */
async function portIsFree(port) {
  return (await addressIsFree(port, '127.0.0.1')) && (await addressIsFree(port, '::1'));
}

function backendState() {
  const result = spawnSync('docker', ['compose', 'ps', '--format', '{{.State}}', 'backend'], {
    encoding: 'utf8',
  });
  return result.stdout.trim();
}

async function backendIsHealthy() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });
    return response.ok;
  } catch {
    return false; // not listening yet
  }
}

async function waitForBackend() {
  const deadline = Date.now() + BACKEND_WAIT_MS;
  process.stdout.write('\nWaiting for the backend');
  while (Date.now() < deadline) {
    if (await backendIsHealthy()) {
      console.log(' ready.');
      return;
    }
    if (backendState() === 'restarting') break; // crashed on start (e.g. a bad backend/.env value)
    process.stdout.write('.');
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
  fail('The backend did not start. See its logs with: docker compose logs backend');
}

/** Starts `next dev` on this computer with the same Node that runs this script, against the Docker backend. */
function startFrontend() {
  const args = ['dev', '--port', String(FRONTEND_PORT), '--hostname', 'localhost'];
  return spawn(process.execPath, [NEXT_BIN, ...args], {
    cwd: FRONTEND_DIR,
    stdio: 'inherit',
    env: { ...process.env, BACKEND_INTERNAL_URL: BACKEND_URL, NEXT_PUBLIC_SOCKET_URL: BACKEND_URL },
  });
}

if (!existsSync(NEXT_BIN)) {
  fail(
    'The frontend packages are not installed on this computer. Run `npm --prefix frontend ci` first.',
  );
}
if (!(await portIsFree(FRONTEND_PORT))) {
  fail(
    `Port ${FRONTEND_PORT} is already in use (another \`npm run dev\` or app). Close it and try again.`,
  );
}
checkDocker();
if (backendState() !== 'running' && !(await portIsFree(BACKEND_PORT))) {
  fail(
    `Port ${BACKEND_PORT} is already in use, probably by a backend started on this computer.\n` +
      'Stop it (PowerShell): Stop-Process -Id (Get-NetTCPConnection -LocalPort ' +
      `${BACKEND_PORT} -State Listen).OwningProcess -Force`,
  );
}

// Remove (not only stop) the opt-in Docker frontend, so a plain `docker compose down` works later
run(
  'docker',
  ['compose', '--profile', 'frontend', 'rm', '--stop', '--force', 'frontend'],
  'Could not remove the Docker frontend.',
);
run(
  'docker',
  ['compose', 'up', '-d', '--build', 'mongo', 'backend'],
  'Could not start MongoDB and the backend.',
);
await waitForBackend();

console.log(`\nStarting Next.js on http://localhost:${FRONTEND_PORT} (Ctrl+C to stop)\n`);
const frontend = startFrontend();
// Ctrl+C reaches the frontend too; wait for it to finish instead of exiting first
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {});
frontend.on('exit', (code, signal) => {
  console.log(
    '\nFrontend stopped. Docker (mongo + backend) is still running: `npm run dev:down` stops it.',
  );
  process.exit(code ?? (signal ? 1 : 0));
});
