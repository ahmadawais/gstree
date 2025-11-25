import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface Subtree {
  name: string;
  remote: string;
  prefix: string;
  prefixes?: string[];
  branch: string;
  mode?: 'copy' | 'subtree';
}

export interface Config {
  useGhCli?: boolean;
  subtrees: Subtree[];
}

const CONFIG_FILE = '.gstree.json';
const DEFAULT_CONFIG: Config = {
  useGhCli: true,
  subtrees: []
};

export function getConfigPath(): string {
  return join(process.cwd(), CONFIG_FILE);
}

export function loadConfig(): Config {
  const configPath = getConfigPath();
  if (!existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const content = readFileSync(configPath, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function useGhCli(): boolean {
  return loadConfig().useGhCli !== false;
}

export function setUseGhCli(value: boolean): void {
  const config = loadConfig();
  config.useGhCli = value;
  saveConfig(config);
}

export function saveConfig(config: Config): void {
  const configPath = getConfigPath();
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
}

export function getSubtree(name: string): Subtree | undefined {
  const config = loadConfig();
  return config.subtrees.find(s => s.name === name);
}

export function addSubtree(subtree: Subtree): void {
  const config = loadConfig();
  const existing = config.subtrees.findIndex(s => s.name === subtree.name);
  if (existing >= 0) {
    config.subtrees[existing] = subtree;
  } else {
    config.subtrees.push(subtree);
  }
  saveConfig(config);
}

export function removeSubtree(name: string): boolean {
  const config = loadConfig();
  const index = config.subtrees.findIndex(s => s.name === name);
  if (index >= 0) {
    config.subtrees.splice(index, 1);
    saveConfig(config);
    return true;
  }
  return false;
}
