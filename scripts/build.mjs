import { build } from 'vite';

const configFiles = ['vite.pages.config.ts', 'vite.content.config.ts', 'vite.background.config.ts'];

try {
  for (const configFile of configFiles) {
    await build({ configFile });
  }
} catch (error) {
  console.error(error);
  process.exit(1);
}
