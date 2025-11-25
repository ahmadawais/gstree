import ora from 'ora';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { basename, join } from 'path';
import { existsSync, rmSync, cpSync, mkdirSync } from 'fs';
import { addSubtree, getSubtree } from '../utils/config.js';
import { isGitRepo, exec, execWithOutput } from '../utils/git.js';
import { ensureGhCli, getGhUsername, getGhOrgs, createRepo, isRepoPrivate, getHttpsUrl } from '../utils/gh.js';

interface InitOptions {
  branch?: string;
  public?: boolean;
  private?: boolean;
  org?: string;
  subtree?: boolean;
}

export async function init(pathArg?: string, options?: InitOptions): Promise<void> {
  if (!isGitRepo()) {
    console.log(pc.red('Not a git repository'));
    process.exit(1);
  }

  await ensureGhCli();

  console.log();
  console.log(pc.cyan(pc.bold('Initialize sync repo')));
  console.log();

  const repoRoot = exec('git rev-parse --show-toplevel');
  const resolvePath = (p: string) => join(repoRoot, p);
  const pathExists = (p: string) => existsSync(resolvePath(p));

  let prefixes: string[] = [];

  if (!pathArg) {
    const result = await p.text({
      message: 'Path(s) to sync (comma-separated)',
      placeholder: 'packages/studio or packages/studio,packages/web',
      validate: (value) => {
        if (!value) return 'Path is required';
        const paths = value.split(',').map(p => p.trim());
        for (const path of paths) {
          if (!pathExists(path)) return `Path "${path}" does not exist`;
        }
      }
    });
    if (p.isCancel(result)) process.exit(0);
    prefixes = result.split(',').map(p => p.trim());
  } else {
    prefixes = pathArg.split(',').map(p => p.trim());
    for (const prefix of prefixes) {
      if (!pathExists(prefix)) {
        console.log(pc.red(`Path "${prefix}" does not exist in ${repoRoot}`));
        process.exit(1);
      }
    }
  }

  const mainRepoName = basename(repoRoot);
  const mode = options?.subtree ? 'subtree' : 'copy';
  
  // Generate repo name from paths
  // packages/studio,packages/web → mainrepo-packages-studio-web
  const pathParts = prefixes.map(p => p.replace(/\//g, '-')).join('-');
  const suggestedRepoName = `${mainRepoName}-${pathParts}`;
  
  const repoNameResult = await p.text({
    message: 'Repo name',
    initialValue: suggestedRepoName,
    validate: (value) => {
      if (!value) return 'Repo name is required';
      if (!/^[a-zA-Z0-9._-]+$/.test(value)) return 'Invalid characters in repo name';
    }
  });
  if (p.isCancel(repoNameResult)) process.exit(0);
  const repoName = repoNameResult;
  
  // Generate subtree name from last folder names
  // packages/studio,packages/web → studio-web
  const subtreeName = prefixes.map(p => basename(p)).join('-');
  
  const branch = options?.branch || 'main';

  if (getSubtree(subtreeName)) {
    console.log(pc.red(`"${subtreeName}" already tracked`));
    process.exit(1);
  }

  const username = getGhUsername();
  const orgs = getGhOrgs();
  const allOrgs = [username, ...orgs];

  let org = options?.org;
  let defaultOrg = org;

  if (!defaultOrg) {
    try {
      const remoteUrl = exec('git remote get-url origin');
      const match = remoteUrl.match(/github\.com[:/]([^/]+)\//);
      if (match?.[1]) defaultOrg = match[1];
    } catch {}
  }

  if (!org) {
    const result = await p.select({
      message: 'Create repo under',
      options: allOrgs.map(o => ({ 
        value: o, 
        label: o, 
        hint: o === username ? 'personal' : 'org' 
      })),
      initialValue: defaultOrg && allOrgs.includes(defaultOrg) ? defaultOrg : username
    });
    if (p.isCancel(result)) process.exit(0);
    org = result as string;
  }

  let isPrivate: boolean;
  if (options?.private) {
    isPrivate = true;
  } else if (options?.public) {
    isPrivate = false;
  } else {
    isPrivate = isRepoPrivate();
  }

  const remoteUrl = getHttpsUrl(org, repoName);

  console.log();
  console.log(`  ${pc.bold('Repo:')} github.com/${org}/${repoName} ${pc.dim(`(${isPrivate ? 'private' : 'public'})`)}`);
  console.log(`  ${pc.bold('Mode:')} ${mode === 'copy' ? 'copy (no git subtree)' : 'git subtree'}`);
  console.log(`  ${pc.bold('Paths:')} ${prefixes.join(', ')}`);
  console.log();

  const confirm = await p.confirm({
    message: 'Proceed?',
    initialValue: true
  });
  if (p.isCancel(confirm) || !confirm) process.exit(0);

  console.log();

  let spinner = ora('Creating GitHub repo...').start();
  try {
    createRepo(org, repoName, isPrivate);
    spinner.succeed('Repo created');
  } catch (error) {
    spinner.fail('Failed to create repo');
    console.log(pc.dim(String(error)));
    process.exit(1);
  }

  if (mode === 'copy') {
    try {
      spinner = ora('Preparing files...').start();
      const tempDir = `/tmp/gstree-${Date.now()}`;
      mkdirSync(tempDir, { recursive: true });
      
      // Copy all prefixes to temp dir maintaining structure
      for (const prefix of prefixes) {
        const srcPath = resolvePath(prefix);
        const destPath = join(tempDir, prefix);
        mkdirSync(join(tempDir, prefix.split('/').slice(0, -1).join('/')), { recursive: true });
        cpSync(srcPath, destPath, { recursive: true });
      }
      
      process.chdir(tempDir);
      exec('git init');
      exec('git add -A');
      exec(`git commit -m "📦 NEW: initial commit"`);
      exec(`git branch -M ${branch}`);
      spinner.succeed('Prepared');

      spinner = ora('Pushing to new repo...').start();
      exec(`git remote add origin "${remoteUrl}"`);
      execWithOutput(`git push -u origin ${branch}`);
      spinner.succeed('Pushed');
      
      process.chdir(repoRoot);
      exec(`rm -rf "${tempDir}"`);

      addSubtree({
        name: subtreeName,
        remote: remoteUrl,
        prefix: prefixes[0],
        prefixes: prefixes,
        branch,
        mode: 'copy'
      });

      const repoLink = `https://github.com/${org}/${repoName}`;
      
      console.log();
      console.log(pc.green(`✓ Pushed to ${repoLink}`));
      console.log();
      console.log(pc.dim(`  Tracking as "${subtreeName}"`));
      console.log(pc.dim(`  gst pull ${subtreeName}   # pull changes`));
      console.log(pc.dim(`  gst push ${subtreeName}   # push changes`));
      console.log();
    } catch (error) {
      spinner.fail('Failed');
      console.log(pc.dim(String(error)));
      process.exit(1);
    }
  } else {
    // Subtree mode - only supports single prefix
    if (prefixes.length > 1) {
      console.log(pc.red('Subtree mode only supports single path. Use copy mode for multiple paths.'));
      process.exit(1);
    }
    
    const subtreePrefix = prefixes[0];
    
    try {
      spinner = ora('Preparing subtree...').start();
      const fullPath = resolvePath(subtreePrefix);
      const tempDir = `/tmp/gstree-${Date.now()}`;
      
      mkdirSync(tempDir, { recursive: true });
      cpSync(fullPath, tempDir, { recursive: true });
      
      process.chdir(tempDir);
      exec('git init');
      exec('git add -A');
      exec(`git commit -m "📦 NEW: initial commit"`);
      exec(`git branch -M ${branch}`);
      spinner.succeed('Prepared');

      spinner = ora('Pushing to new repo...').start();
      exec(`git remote add origin "${remoteUrl}"`);
      execWithOutput(`git push -u origin ${branch}`);
      spinner.succeed('Pushed');
      
      process.chdir(repoRoot);

      spinner = ora('Registering subtree...').start();
      rmSync(fullPath, { recursive: true, force: true });
      
      const hasChanges = exec('git status --porcelain');
      if (hasChanges) {
        exec('git add -A');
        exec(`git commit -m "📦 NEW: ${subtreeName} subtree"`);
      }
      execWithOutput(`git subtree add --prefix="${subtreePrefix}" "${remoteUrl}" ${branch} --squash`);
      spinner.succeed('Registered');

      addSubtree({
        name: subtreeName,
        remote: remoteUrl,
        prefix: subtreePrefix,
        branch,
        mode: 'subtree'
      });

      const repoLink = `https://github.com/${org}/${repoName}`;
      
      console.log();
      console.log(pc.green(`✓ Pushed to ${repoLink}`));
      console.log();
      console.log(pc.dim(`  Tracking as "${subtreeName}"`));
      console.log(pc.dim(`  gst pull ${subtreeName}   # pull changes`));
      console.log(pc.dim(`  gst push ${subtreeName}   # push changes`));
      console.log();
    } catch (error) {
      spinner.fail('Failed');
      console.log(pc.dim(String(error)));
      process.exit(1);
    }
  }
}
