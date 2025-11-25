import pc from 'picocolors';

export function banner() {
  const art = `
   __ _ ___| |_ _ __ ___  ___ 
  / _\` / __| __| '__/ _ \\/ _ \\
 | (_| \\__ \\ |_| | |  __/  __/
  \\__, |___/\\__|_|  \\___|\\___|
   __/ |                      
  |___/   git subtree manager
`;
  console.log(pc.cyan(art));
}
