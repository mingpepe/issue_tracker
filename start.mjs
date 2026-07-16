import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 Building TaskPulse frontend for production...');
try {
  execSync('npm run build', { cwd: path.join(__dirname, 'client'), stdio: 'inherit' });
  console.log('✅ Build successful!');
} catch (err) {
  console.error('❌ Build failed:', err.message);
  process.exit(1);
}

console.log('\n🚀 Starting Application in Preview Mode...');

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

const serverProcess = runCommand('npm', ['start'], path.join(__dirname, 'server'), 'Server');
const clientProcess = runCommand('npm', ['run', 'preview'], path.join(__dirname, 'client'), 'Client');

// Handle termination
const killProcesses = () => {
  console.log('\n🛑 Shutting down...');
  serverProcess.kill();
  clientProcess.kill();
  process.exit();
};

process.on('SIGINT', killProcesses);
process.on('SIGTERM', killProcesses);
