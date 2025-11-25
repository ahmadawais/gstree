import ora from 'ora';
import pc from 'picocolors';
import { loadConfig, getSubtree } from '../utils/config.js';
import { isGitRepo, subtreePull, copyPull } from '../utils/git.js';

export async function pull(name?: string): Promise<void> {
  if (!isGitRepo()) {
    console.log(pc.red('Not a git repository'));
    process.exit(1);
  }

  const config = loadConfig();
  const pullAll = !name;

  if (pullAll) {
    console.log();
    console.log(pc.cyan(pc.bold('Pulling')));
    console.log();

    if (config.subtrees.length > 0) {
      for (const subtree of config.subtrees) {
        const spinner = ora(`Pulling ${subtree.name}...`).start();
        try {
          const prefixes = subtree.prefixes || [subtree.prefix];
          
          if (subtree.mode === 'subtree') {
            subtreePull(subtree.prefix, subtree.remote, subtree.branch);
          } else {
            copyPull(prefixes, subtree.remote, subtree.branch);
          }
          spinner.succeed(`${subtree.name} pulled`);
        } catch (error) {
          const errMsg = String(error);
          spinner.fail(`${subtree.name} failed`);
          if (errMsg.includes('working tree has modifications')) {
            console.log(pc.yellow('  Commit your changes first: git add -A && git commit -m "your message"'));
          } else if (errMsg.includes('was never added')) {
            console.log(pc.yellow('  Subtree not registered. Try: gst rm ' + subtree.name + ' && gst init ' + subtree.prefix));
          } else {
            console.log(pc.dim(errMsg));
          }
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
    const spinner = ora(`Pulling ${name}...`).start();

    try {
      const prefixes = subtree.prefixes || [subtree.prefix];
      
      if (subtree.mode === 'subtree') {
        subtreePull(subtree.prefix, subtree.remote, subtree.branch);
      } else {
        copyPull(prefixes, subtree.remote, subtree.branch);
      }
      spinner.succeed(`${name} pulled`);
    } catch (error) {
      const errMsg = String(error);
      spinner.fail(`${name} failed`);
      if (errMsg.includes('working tree has modifications')) {
        console.log(pc.yellow('  Commit your changes first: git add -A && git commit -m "your message"'));
      } else if (errMsg.includes('was never added')) {
        console.log(pc.yellow('  Subtree not registered. Try: gst rm ' + name + ' && gst init ' + subtree.prefix));
      } else {
        console.log(pc.dim(errMsg));
      }
      process.exit(1);
    }
    console.log();
  }
}
