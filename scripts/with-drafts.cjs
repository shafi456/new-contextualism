// Runs Astro with drafts and scheduled items shown, for checking them before publication:
//   npm run dev:drafts
const { spawn } = require('child_process');
spawn('npx', ['astro', ...process.argv.slice(2)], { stdio: 'inherit', shell: true, env: { ...process.env, NC_PREVIEW: '1' } }).on('exit', (c) => process.exit(c ?? 0));
