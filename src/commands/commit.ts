import * as p from '@clack/prompts';
import pc from 'picocolors';
import { isGitRepo, exec, execWithOutput } from '../utils/git.js';

export async function commit(message?: string): Promise<void> {
  if (!isGitRepo()) {
    p.log.error('Not a git repository');
    process.exit(1);
  }

  let commitMsg = message;

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

  const status = exec('git status --short');
  if (!status) {
    p.log.warn('Nothing to commit');
    return;
  }

  try {
    execWithOutput('git add -A');
    execWithOutput(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);
    p.log.success('Committed');
  } catch (error) {
    p.log.error(String(error));
    process.exit(1);
  }
}
