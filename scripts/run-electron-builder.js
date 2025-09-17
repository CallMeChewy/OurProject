#!/usr/bin/env node

const fs = require('fs');
const { spawn, spawnSync } = require('child_process');
const path = require('path');

if (process.platform === 'linux') {
  const packagedBinary = getPackaged7zaPath();
  if (!packagedBinary || !fs.existsSync(packagedBinary)) {
    const resolvedPath = resolveSystem7za();
    if (resolvedPath) {
      process.env.USE_SYSTEM_7ZA = process.env.USE_SYSTEM_7ZA || 'true';
      process.env.PATH_7ZA = resolvedPath;
      ensure7zaShim(resolvedPath);
    }
  }
}

function getPackaged7zaPath() {
  const projectRoot = path.join(__dirname, '..');
  const arch = process.arch === 'arm64' ? 'arm64' : process.arch;
  return path.join(projectRoot, 'node_modules', '7zip-bin', 'linux', arch, '7za');
}

function resolveSystem7za() {
  const defaultPath = '/usr/bin/7za';
  if (process.env.PATH_7ZA && fs.existsSync(process.env.PATH_7ZA)) {
    return process.env.PATH_7ZA;
  }
  if (fs.existsSync(defaultPath)) {
    return defaultPath;
  }
  const whichResult = spawnSync('which', ['7za'], { encoding: 'utf8' });
  if (whichResult.status === 0 && whichResult.stdout) {
    const candidate = whichResult.stdout.trim();
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function ensure7zaShim(sourcePath) {
  try {
    const projectRoot = path.join(__dirname, '..');
    const moduleDir = path.join(projectRoot, 'node_modules', '7zip-bin');
    const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
    const targetDir = path.join(moduleDir, 'linux', arch);
    const targetPath = path.join(targetDir, '7za');

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    if (!fs.existsSync(moduleDir)) {
      fs.mkdirSync(moduleDir, { recursive: true });
    }

    const packageJsonPath = path.join(moduleDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      const packageJson = {
        name: '7zip-bin',
        version: '0.0.0-dev-local',
        description: 'Local shim for system 7zip binary',
        main: 'index.js'
      };
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }

    const indexPath = path.join(moduleDir, 'index.js');
    if (!fs.existsSync(indexPath)) {
      const indexSource = `const path = require('path');\nconst platform = process.platform;\nconst arch = process.arch === 'arm64' ? 'arm64' : 'x64';\n\nfunction resolveLinux() {\n  return path.join(__dirname, 'linux', arch, '7za');\n}\n\nfunction resolveDarwin() {\n  return path.join(__dirname, 'mac', arch, '7za');\n}\n\nfunction resolveWindows(executable) {\n  const subdir = arch === 'arm64' ? 'arm64' : (arch === 'ia32' ? 'ia32' : 'x64');\n  return path.join(__dirname, 'win', subdir, executable);\n}\n\nlet path7za = '7za';\nlet path7x = '7z';\n\nif (platform === 'linux') {\n  path7za = resolveLinux();\n  path7x = path7za;\n} else if (platform === 'darwin') {\n  path7za = resolveDarwin();\n  path7x = path7za;\n} else if (platform === 'win32') {\n  path7za = resolveWindows('7za.exe');\n  path7x = resolveWindows('7z.exe');\n}\n\nmodule.exports = { path7za, path7x };\n`;
      fs.writeFileSync(indexPath, indexSource);
    }

    if (!fs.existsSync(targetPath)) {
      try {
        fs.copyFileSync(sourcePath, targetPath);
      } catch (copyError) {
        try {
          fs.symlinkSync(sourcePath, targetPath);
        } catch (symlinkError) {
          console.warn(`Failed to prepare 7zip binary at ${targetPath}: ${symlinkError.message}`);
        }
      }
    }

    try {
      fs.chmodSync(targetPath, 0o755);
    } catch (chmodError) {
      console.warn(`Failed to set permissions on ${targetPath}: ${chmodError.message}`);
    }
  } catch (error) {
    console.warn(`Unable to configure 7zip shim: ${error.message}`);
  }
}

const searchPaths = [
  __dirname,
  process.cwd(),
  path.join(__dirname, '..')
];

let cliPath;
try {
  cliPath = require.resolve('electron-builder/cli.js', { paths: searchPaths });
} catch (resolveError) {
  console.warn('electron-builder CLI not found in local node_modules, falling back to npx.');
}

const args = process.argv.slice(2);

const command = cliPath
  ? process.execPath
  : (process.platform === 'win32' ? 'npx.cmd' : 'npx');
const commandArgs = cliPath ? [cliPath, ...args] : ['electron-builder', ...args];

const child = spawn(command, commandArgs, {
  stdio: 'inherit',
  env: process.env
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});
