#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const command = process.argv[2];
const backendArg = process.argv.slice(3).find((arg) => arg.startsWith('--backend='));
const selectedTarget = (backendArg ? backendArg.split('=')[1] : process.env.REACT_APP_BACKEND_TARGET || 'local').toLowerCase();

if (!command || (command !== 'start' && command !== 'build')) {
  console.error('Usage: node scripts/run-with-backend.js <start|build> [--backend=local|production]');
  process.exit(1);
}

process.env.REACT_APP_BACKEND_TARGET = selectedTarget;

const reactScriptsBin = require.resolve('react-scripts/bin/react-scripts.js');
const child = spawn(process.execPath, [reactScriptsBin, command], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code === null ? 1 : code);
});
