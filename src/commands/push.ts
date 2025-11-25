import ora from 'ora';
import pc from 'picocolors';
import { loadConfig, getSubtree } from '../utils/config.js';
import { isGitRepo, subtreePush, copyPush } from '../utils/git.js';

export async function push(name?: string): Promise<void> {
  if (!isGitRepo()) {
    console.log(pc.red('Not a git repository'));
    process.exit(1);
  }

  const config = loadConfig();
  const pushAll = !name;

  if (pushAll) {
    console.log();
    console.log(pc.cyan(pc.bold('Pushing')));
    console.log();

    if (config.subtrees.length > 0) {
      for (const subtree of config.subtrees) {
        const spinner = ora(`Pushing ${subtree.name}...`).start();
        try {
          const prefixes = subtree.prefixes || [subtree.prefix];
          
          if (subtree.mode === 'subtree') {
            subtreePush(subtree.prefix, subtree.remote, subtree.branch);
          } else {
            copyPush(prefixes, subtree.remote, subtree.branch);
          }
          spinner.succeed(`${subtree.name} pushed`);
        } catch (error) {
          spinner.fail(`${subtree.name} failed`);
          console.log(pc.dim(String(error)));
        }
      }
    } else {
      console.log(pc.dim('No repos configured. Use "gst init <path>" first.'));
    }

    console.log();
    console.log(pc.green('✓ Done'));
    console.log();
  } else {
    const subtree = getSubtree(name);
    if (!subtree) {
      console.log(pc.red(`"${name}" not found`));
      process.exit(1);
    }

    console.log();
    const spinner = ora(`Pushing ${name}...`).start();

    try {
      const prefixes = subtree.prefixes || [subtree.prefix];
      
      if (subtree.mode === 'subtree') {
        subtreePush(subtree.prefix, subtree.remote, subtree.branch);
      } else {
        copyPush(prefixes, subtree.remote, subtree.branch);
      }
      spinner.succeed(`${name} pushed`);
    } catch (error) {
      spinner.fail(`${name} failed`);
      console.log(pc.dim(String(error)));
      process.exit(1);
    }
    console.log();
  }
}
