const fs = require('fs/promises');
const path = require('path');

async function removeSandboxCandidate(candidatePath) {
  try {
    await fs.unlink(candidatePath);
    console.log(`[afterPack] Removed chrome-sandbox at ${candidatePath} to avoid SUID requirement.`);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`[afterPack] Could not remove chrome-sandbox at ${candidatePath}: ${error.message}`);
    }
  }
}

async function patchAppRun(appOutDir) {
  const appRunPath = path.join(appOutDir, 'AppRun');
  try {
    const script = `#!/bin/bash\nset -e\n\nexport ELECTRON_DISABLE_SANDBOX=1\nexport NO_AT_BRIDGE=1\n\nif [ -z \"$APPDIR\" ]; then\n  APPDIR=\"$(dirname \"$(readlink -f \"$0\")\")\"\nfi\n\nexec \"$APPDIR/ourlibrary-app\" --no-sandbox \"$@\"\n`;
    await fs.writeFile(appRunPath, script, 'utf8');
    await fs.chmod(appRunPath, 0o755);
    console.log('[afterPack] Replaced AppRun with custom launcher that passes --no-sandbox.');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`[afterPack] Could not patch AppRun: ${error.message}`);
    }
  }
}

module.exports = async ({ appOutDir, electronPlatformName }) => {
  if (electronPlatformName !== 'linux') {
    return;
  }

  const candidates = [
    path.join(appOutDir, 'chrome-sandbox'),
    path.join(appOutDir, 'resources', 'app.asar.unpacked', 'node_modules', 'electron', 'dist', 'chrome-sandbox')
  ];

  await Promise.all(candidates.map(removeSandboxCandidate));
  await patchAppRun(appOutDir);
};
