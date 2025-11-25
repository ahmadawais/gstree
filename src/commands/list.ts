import * as p from '@clack/prompts';
import pc from 'picocolors';
import { loadConfig } from '../utils/config.js';

export async function list(): Promise<void> {
  const config = loadConfig();

  if (config.subtrees.length === 0) {
    p.log.warn('No subtrees configured. Use "gstree add" to add one.');
    return;
  }

  console.log();
  console.log(pc.cyan(pc.bold('Tracked Subtrees')));
  console.log();

  for (const subtree of config.subtrees) {
    console.log(`  ${pc.green('●')} ${pc.bold(subtree.name)}`);
    console.log(`    ${pc.dim('prefix:')} ${subtree.prefix}`);
    console.log(`    ${pc.dim('remote:')} ${subtree.remote}`);
    console.log(`    ${pc.dim('branch:')} ${subtree.branch}`);
    console.log();
  }
}
