const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const winPy = path.join(projectRoot, 'venv', 'Scripts', 'python.exe');
const unixPy = path.join(projectRoot, 'venv', 'bin', 'python');

let py = 'python';
if (fs.existsSync(winPy)) {
  py = winPy;
} else if (fs.existsSync(unixPy)) {
  py = unixPy;
}

const args = process.argv.slice(2);
const child = spawn(py, args, { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
