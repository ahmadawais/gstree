import * as p from '@clack/prompts';
import pc from 'picocolors';
import { exec } from './git.js';

export function checkGhCli(): boolean {
  try {
    exec('gh --version');
    return true;
  } catch {
    return false;
  }
}

export function checkGhAuth(): boolean {
  try {
    exec('gh auth status');
    return true;
  } catch {
    return false;
  }
}

export async function ensureGhCli(): Promise<void> {
  if (!checkGhCli()) {
    p.log.error('GitHub CLI (gh) is not installed');
    p.log.info('Install it from: https://cli.github.com/');
    p.log.info('  brew install gh');
    p.log.info('  Then run: gh auth login');
    process.exit(1);
  }

  if (!checkGhAuth()) {
    p.log.error('GitHub CLI is not authenticated');
    p.log.info('Run: gh auth login');
    process.exit(1);
  }
}

export function getGhUsername(): string {
  return exec('gh api user -q .login');
}

export function getGhOrgs(): string[] {
  try {
    const orgList = exec('gh api user/orgs -q ".[].login"');
    return orgList ? orgList.split('\n').filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function createRepo(org: string, name: string, isPrivate: boolean): void {
  const visibility = isPrivate ? '--private' : '--public';
  exec(`gh repo create ${org}/${name} ${visibility} --confirm`);
}

export function isRepoPrivate(): boolean {
  try {
    const result = exec('gh repo view --json isPrivate -q ".isPrivate"');
    return result.trim() === 'true';
  } catch {
    return true;
  }
}

export function ghPush(repoUrl: string, localBranch: string, remoteBranch: string): void {
  exec(`git push "${repoUrl}" ${localBranch}:${remoteBranch}`);
}

export function getHttpsUrl(org: string, repo: string): string {
  return `https://github.com/${org}/${repo}.git`;
}

export function getSshUrl(org: string, repo: string): string {
  return `git@github.com:${org}/${repo}.git`;
}
