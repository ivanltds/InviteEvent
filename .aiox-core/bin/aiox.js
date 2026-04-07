#!/usr/bin/env node

const { run } = require('../cli/index');

// Execute the CLI
run(process.argv).catch((error) => {
  console.error(`❌ Fatal Error: ${error.message}`);
  process.exit(1);
});
