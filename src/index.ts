import { Command } from 'commander';
import { createRequire } from 'module';
import { init } from './commands/init.js';
import { add } from './commands/add.js';
import { pull } from './commands/pull.js';
import { push } from './commands/push.js';
import { list } from './commands/list.js';
import { remove } from './commands/remove.js';
import { status } from './commands/status.js';
import { commit } from './commands/commit.js';
import { sync } from './commands/sync.js';
import { save } from './commands/save.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const program = new Command();

program
  .name('gst')
  .description('Git + Subtree manager - all your git in one tool')
  .version(pkg.version, '-v, --version')
  .helpOption('-h, --help')
  .action(status);

program
  .command('init')
  .description('Create synced repo from path(s)')
  .argument('[paths]', 'Path(s) to sync (comma-separated, e.g., packages/studio,packages/web)')
  .option('-b, --branch <branch>', 'Branch to use', 'main')
  .option('--public', 'Make repo public')
  .option('-p, --private', 'Make repo private')
  .option('-o, --org <org>', 'GitHub org/username')
  .option('--subtree', 'Use git subtree mode (default: copy mode)')
  .action(async (paths, opts) => { await init(paths, opts); });

program
  .command('add')
  .description('Add an existing external repo as subtree')
  .argument('[name]', 'Name for the subtree')
  .argument('[remote]', 'Remote repository URL')
  .argument('[prefix]', 'Local path prefix')
  .option('-b, --branch <branch>', 'Branch to use', 'main')
  .action(add);

program
  .command('pull')
  .description('Pull from synced repo(s)')
  .argument('[name]', 'Repo name (omit for all)')
  .action(pull);

program
  .command('push')
  .description('Push to synced repo(s)')
  .argument('[name]', 'Repo name (omit for all)')
  .action(push);

program
  .command('sync')
  .description('Pull then push everything')
  .action(sync);

program
  .command('save')
  .alias('s')
  .description('Commit + push everything')
  .argument('[message]', 'Commit message')
  .action(save);

program
  .command('commit')
  .alias('c')
  .description('Add all + commit')
  .argument('[message]', 'Commit message')
  .action(commit);

program
  .command('status')
  .alias('st')
  .description('Show git status + subtrees')
  .action(status);

program
  .command('list')
  .alias('ls')
  .description('List tracked subtrees')
  .action(list);

program
  .command('remove')
  .alias('rm')
  .description('Remove subtree from tracking')
  .argument('<name>', 'Subtree name')
  .option('-f, --force', 'Also delete directory')
  .action(remove);

program.parse();
