import pc from 'picocolors';
import { loadConfig } from '../utils/config.js';
import { isGitRepo, exec } from '../utils/git.js';

export async function status(): Promise<void> {
  if (!isGitRepo()) {
    console.log(pc.red('Not a git repository'));
    process.exit(1);
  }

  const branch = exec('git branch --show-current');
  const status = exec('git status --short');
  const config = loadConfig();

  console.log();
  console.log(pc.cyan(pc.bold('Branch:')), branch);
  console.log();

  if (status) {
    console.log(pc.yellow(pc.bold('Changes:')));
    console.log(status);
  } else {
    console.log(pc.green('✓ Working tree clean'));
  }

  if (config.subtrees.length > 0) {
    console.log();
    console.log(pc.cyan(pc.bold('Subtrees:')), pc.dim(`(${config.subtrees.length} tracked)`));
    for (const st of config.subtrees) {
      console.log(`  ${pc.green('●')} ${st.name} ${pc.dim(`→ ${st.prefix}`)}`);
    }
  }

  console.log();
}
