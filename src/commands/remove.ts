import * as p from '@clack/prompts';
import pc from 'picocolors';
import { rmSync, existsSync } from 'fs';
import { getSubtree, removeSubtree } from '../utils/config.js';

interface RemoveOptions {
  force?: boolean;
}

export async function remove(name: string, options?: RemoveOptions): Promise<void> {
  const subtree = getSubtree(name);

  if (!subtree) {
    p.log.error(`Subtree "${name}" not found`);
    process.exit(1);
  }

  p.intro(pc.cyan(`Removing subtree "${name}"`));

  if (options?.force && existsSync(subtree.prefix)) {
    const confirm = await p.confirm({
      message: `Also delete directory "${subtree.prefix}"?`,
      initialValue: false
    });

    if (p.isCancel(confirm)) process.exit(0);

    if (confirm) {
      rmSync(subtree.prefix, { recursive: true, force: true });
      p.log.info(`Deleted ${subtree.prefix}`);
    }
  }

  removeSubtree(name);
  p.outro(pc.green(`✓ Removed "${name}" from tracking`));
}
