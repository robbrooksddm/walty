// scripts/prompt-test.ts
import { getPromptForPlaceholder } from '../sanity/lib/getPromptForPlaceholder';

/* replace with a real ID from Studio */
getPromptForPlaceholder('dc9022bc-0c64-4d3a-8e85-bb3148aec8f2')
  .then(console.log)
  .catch(console.error)
  .finally(() => process.exit());
  