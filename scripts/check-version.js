const fs = require('fs');
const path = require('path');

const currentBranch = require('child_process')
  .execSync('git rev-parse --abbrev-ref HEAD')
  .toString()
  .trim();

const versionFile = fs.readFileSync(
  path.join(__dirname, '../config/versioning/version.js'),
  'utf8'
);

const version = versionFile.includes("'v1'") ? 'v1' : 'v2';

if (
  (currentBranch === 'main' && version !== 'v1') ||
  (currentBranch === 'feature/v2' && version !== 'v2')
) {
  console.error(`❌ Erreur: Mauvaise version dans version.js !
    Branche: ${currentBranch}
    Version: ${version}

    Sur main => VERSION doit être 'v1'
    Sur feature/v2 => VERSION doit être 'v2'
  `);
  process.exit(1);
}

console.log(`✅ Version correcte: ${version} pour la branche ${currentBranch}`);