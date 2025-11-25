import ora from 'ora';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { loadConfig } from '../utils/config.js';
import { isGitRepo, exec, execWithOutput, subtreePush } from '../utils/git.js';

export async function save(message?: string): Promise<void> {
  if (!isGitRepo()) {
    console.log(pc.red('Not a git repository'));
    process.exit(1);
  }

  let commitMsg = message;
  const status = exec('git status --short');
  
  console.log();
  console.log(pc.cyan(pc.bold('Saving everything')));
  console.log();

  if (status) {
    if (!commitMsg) {
      const result = await p.text({
        message: 'Commit message',
        placeholder: 'feat: add new feature',
        validate: (value) => {
          if (!value) return 'Message is required';
        }
      });
      if (p.isCancel(result)) process.exit(0);
      commitMsg = result;
    }

    const spinner = ora('Committing...').start();
    try {
      execWithOutput('git add -A');
      execWithOutput(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);
      spinner.succeed('Committed');
    } catch (error) {
      spinner.fail('Commit failed');
      console.log(pc.dim(String(error)));
      process.exit(1);
    }
  }

  const config = loadConfig();

  let spinner = ora('Pushing main repo...').start();
  try {
    execWithOutput('git push');
    spinner.succeed('Main repo pushed');
  } catch {
    spinner.warn('Main repo push skipped');
  }

  if (config.subtrees.length > 0) {
    for (const subtree of config.subtrees) {
      spinner = ora(`Pushing ${subtree.name}...`).start();
      try {
        subtreePush(subtree.prefix, subtree.remote, subtree.branch);
        spinner.succeed(`${subtree.name} pushed`);
      } catch {
        spinner.warn(`${subtree.name} push skipped`);
      }
    }
  }

  console.log();
  console.log(pc.green('✓ All saved'));
  console.log();
}
