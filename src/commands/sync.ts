import ora from 'ora';
import pc from 'picocolors';
import { loadConfig } from '../utils/config.js';
import { isGitRepo, execWithOutput, subtreePull, subtreePush } from '../utils/git.js';

export async function sync(): Promise<void> {
  if (!isGitRepo()) {
    console.log(pc.red('Not a git repository'));
    process.exit(1);
  }

  console.log();
  console.log(pc.cyan(pc.bold('Syncing everything')));
  console.log();

  const config = loadConfig();

  let spinner = ora('Pulling main repo...').start();
  try {
    execWithOutput('git pull');
    spinner.succeed('Main repo pulled');
  } catch {
    spinner.warn('Main repo pull skipped');
  }

  if (config.subtrees.length > 0) {
    for (const subtree of config.subtrees) {
      spinner = ora(`Pulling ${subtree.name}...`).start();
      try {
        subtreePull(subtree.prefix, subtree.remote, subtree.branch);
        spinner.succeed(`${subtree.name} pulled`);
      } catch {
        spinner.warn(`${subtree.name} pull skipped`);
      }
    }
  }

  spinner = ora('Pushing main repo...').start();
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
  console.log(pc.green('✓ All synced'));
  console.log();
}
