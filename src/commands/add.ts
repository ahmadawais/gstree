import * as p from '@clack/prompts';
import pc from 'picocolors';
import { addSubtree, getSubtree } from '../utils/config.js';
import { isGitRepo, subtreeAdd } from '../utils/git.js';

interface AddOptions {
  branch: string;
}

export async function add(
  name?: string,
  remote?: string,
  prefix?: string,
  options?: AddOptions
): Promise<void> {
  if (!isGitRepo()) {
    p.log.error('Not a git repository');
    process.exit(1);
  }

  p.intro(pc.cyan('Add a new subtree'));

  let subtreeName = name;
  let subtreeRemote = remote;
  let subtreePrefix = prefix;
  let subtreeBranch = options?.branch || 'main';

  if (!subtreeName) {
    const result = await p.text({
      message: 'Subtree name (e.g., studio)',
      placeholder: 'studio',
      validate: (value) => {
        if (!value) return 'Name is required';
        if (getSubtree(value)) return 'Subtree already exists';
      }
    });
    if (p.isCancel(result)) process.exit(0);
    subtreeName = result;
  } else if (getSubtree(subtreeName)) {
    p.log.error(`Subtree "${subtreeName}" already exists`);
    process.exit(1);
  }

  if (!subtreeRemote) {
    const result = await p.text({
      message: 'Remote repository URL',
      placeholder: 'git@github.com:org/repo.git',
      validate: (value) => {
        if (!value) return 'Remote URL is required';
      }
    });
    if (p.isCancel(result)) process.exit(0);
    subtreeRemote = result;
  }

  if (!subtreePrefix) {
    const result = await p.text({
      message: 'Local path prefix',
      placeholder: `packages/${subtreeName}`,
      initialValue: `packages/${subtreeName}`,
      validate: (value) => {
        if (!value) return 'Prefix is required';
      }
    });
    if (p.isCancel(result)) process.exit(0);
    subtreePrefix = result;
  }

  if (!options?.branch) {
    const result = await p.text({
      message: 'Branch to track',
      placeholder: 'main',
      initialValue: 'main'
    });
    if (p.isCancel(result)) process.exit(0);
    subtreeBranch = result || 'main';
  }

  const s = p.spinner();
  s.start('Adding subtree...');

  try {
    subtreeAdd(subtreePrefix, subtreeRemote, subtreeBranch);
    
    addSubtree({
      name: subtreeName,
      remote: subtreeRemote,
      prefix: subtreePrefix,
      branch: subtreeBranch
    });

    s.stop('Subtree added');
    p.outro(pc.green(`✓ Added subtree "${subtreeName}" at ${subtreePrefix}`));
  } catch (error) {
    s.stop('Failed to add subtree');
    p.log.error(String(error));
    process.exit(1);
  }
}
