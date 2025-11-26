import { execSync } from 'child_process';
import { cpSync, rmSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

export function exec(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (error: unknown) {
    const err = error as { stderr?: string; message?: string };
    throw new Error(err.stderr || err.message || 'Command failed');
  }
}

export function execWithOutput(cmd: string): void {
  execSync(cmd, { stdio: 'inherit' });
}

export function isGitRepo(): boolean {
  try {
    exec('git rev-parse --git-dir');
    return true;
  } catch {
    return false;
  }
}

function toHttpsUrl(remote: string): string {
  if (remote.startsWith('git@github.com:')) {
    return remote.replace('git@github.com:', 'https://github.com/');
  }
  return remote;
}

export function subtreeAdd(prefix: string, remote: string, branch: string): void {
  const url = toHttpsUrl(remote);
  execWithOutput(`git subtree add --prefix="${prefix}" "${url}" ${branch} --squash`);
}

export function subtreePull(prefix: string, remote: string, branch: string): void {
  const url = toHttpsUrl(remote);
  execWithOutput(`git subtree pull --prefix="${prefix}" "${url}" ${branch} --squash -m "📦 SYNC: ${prefix}"`);
}

export function subtreePush(prefix: string, remote: string, branch: string): void {
  const url = toHttpsUrl(remote);
  const tempDir = `/tmp/gstree-push-${Date.now()}`;
  const repoRoot = exec('git rev-parse --show-toplevel');
  const fullPath = `${repoRoot}/${prefix}`;

  exec(`git clone --depth 1 "${url}" "${tempDir}"`);
  exec(`rsync -a --delete --exclude='.git' --filter=':- .gitignore' "${fullPath}/" "${tempDir}/"`);

  const status = execSync(`git -C "${tempDir}" status --porcelain`, { encoding: 'utf-8' }).trim();
  if (!status) {
    exec(`rm -rf "${tempDir}"`);
    return;
  }

  exec(`git -C "${tempDir}" add -A`);
  exec(`git -C "${tempDir}" commit -m "📦 SYNC: ${prefix}"`);
  execSync(`git -C "${tempDir}" push origin ${branch}`, { stdio: 'inherit' });
  exec(`rm -rf "${tempDir}"`);
}

// Copy mode functions
export function copyPull(prefixes: string[], remote: string, branch: string): void {
  const url = toHttpsUrl(remote);
  const tempDir = `/tmp/gstree-pull-${Date.now()}`;
  const repoRoot = exec('git rev-parse --show-toplevel');
  
  exec(`git clone --depth 1 "${url}" "${tempDir}"`);
  
  for (const prefix of prefixes) {
    const srcPath = join(tempDir, prefix);
    const destPath = join(repoRoot, prefix);
    
    if (existsSync(srcPath)) {
      rmSync(destPath, { recursive: true, force: true });
      mkdirSync(dirname(destPath), { recursive: true });
      cpSync(srcPath, destPath, { recursive: true });
    }
  }
  
  exec(`rm -rf "${tempDir}"`);
}

export function copyPush(prefixes: string[], remote: string, branch: string): void {
  const url = toHttpsUrl(remote);
  const tempDir = `/tmp/gstree-push-${Date.now()}`;
  const repoRoot = exec('git rev-parse --show-toplevel');

  exec(`git clone --depth 1 "${url}" "${tempDir}"`);

  // Remove old files in prefixes from temp
  for (const prefix of prefixes) {
    const destPath = join(tempDir, prefix);
    if (existsSync(destPath)) {
      rmSync(destPath, { recursive: true, force: true });
    }
  }

  // Copy current files using rsync to respect .gitignore
  for (const prefix of prefixes) {
    const srcPath = join(repoRoot, prefix);
    const destPath = join(tempDir, prefix);

    if (existsSync(srcPath)) {
      mkdirSync(destPath, { recursive: true });
      exec(`rsync -a --exclude='.git' --filter=':- .gitignore' "${srcPath}/" "${destPath}/"`);
    }
  }

  const status = execSync(`git -C "${tempDir}" status --porcelain`, { encoding: 'utf-8' }).trim();
  if (!status) {
    exec(`rm -rf "${tempDir}"`);
    return;
  }

  exec(`git -C "${tempDir}" add -A`);
  exec(`git -C "${tempDir}" commit -m "📦 SYNC: ${prefixes.join(', ')}"`);
  execSync(`git -C "${tempDir}" push origin ${branch}`, { stdio: 'inherit' });
  exec(`rm -rf "${tempDir}"`);
}
