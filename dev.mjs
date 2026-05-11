import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function runCommand(command, args, cwd, label) {
  const child = spawn(command, args, { 
    cwd, 
    shell: true,
    stdio: 'inherit' 
  });

  child.on('error', (err) => {
    console.error(`[${label}] Error:`, err);
  });

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`[${label}] Process exited with code ${code}`);
    }
  });

  return child;
}

console.log('🚀 Starting IssueTracker Development Environment...');

const serverProcess = runCommand('npm', ['start'], path.join(__dirname, 'server'), 'Server');
const clientProcess = runCommand('npm', ['run', 'dev'], path.join(__dirname, 'client'), 'Client');

// Handle termination
const killProcesses = () => {
  console.log('\n🛑 Shutting down...');
  serverProcess.kill();
  clientProcess.kill();
  process.exit();
};

process.on('SIGINT', killProcesses);
process.on('SIGTERM', killProcesses);
