#!/usr/bin/env node

/**
 * Verification script to check backend setup
 * Run with: node verify-setup.js
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const checks = [];
let passed = 0;
let failed = 0;

function check(name, condition, details = '') {
  if (condition) {
    console.log(`✅ ${name}`);
    checks.push({ name, status: 'PASS', details });
    passed++;
  } else {
    console.log(`❌ ${name}`);
    checks.push({ name, status: 'FAIL', details });
    failed++;
  }
}

console.log('\n🔍 Backend Setup Verification\n');
console.log('=' .repeat(50));

// Check package.json
console.log('\n📦 Package Configuration:');
const packagePath = join(__dirname, 'package.json');
check('package.json exists', existsSync(packagePath));

if (existsSync(packagePath)) {
  try {
    const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
    check('Has start script', !!pkg.scripts?.start);
    check('Has express dependency', !!pkg.dependencies?.express);
    check('Has pg dependency', !!pkg.dependencies?.pg);
    check('Has @solana/web3.js dependency', !!pkg.dependencies?.['@solana/web3.js']);
    check('Uses ES modules (type: module)', pkg.type === 'module');
  } catch (e) {
    check('package.json is valid JSON', false, e.message);
  }
}

// Check file structure
console.log('\n📁 File Structure:');
const requiredFiles = [
  'src/index.js',
  'src/config/database.js',
  'src/config/solana.js',
  'src/models/database.js',
  'src/models/user.js',
  'src/models/group.js',
  'src/models/message.js',
  'src/routes/users.js',
  'src/routes/groups.js',
  'src/routes/messages.js',
  'src/middleware/validation.js',
  'src/utils/migrate.js',
];

requiredFiles.forEach(file => {
  const filePath = join(__dirname, file);
  check(`File exists: ${file}`, existsSync(filePath));
});

// Check Railway config
console.log('\n🚂 Railway Configuration:');
const railwayPath = join(__dirname, 'railway.json');
check('railway.json exists', existsSync(railwayPath));

if (existsSync(railwayPath)) {
  try {
    const railway = JSON.parse(readFileSync(railwayPath, 'utf8'));
    check('Has startCommand', !!railway.deploy?.startCommand);
    check('Start command is "npm start"', railway.deploy?.startCommand === 'npm start');
  } catch (e) {
    check('railway.json is valid JSON', false, e.message);
  }
}

// Check .gitignore
console.log('\n🔒 Git Configuration:');
const gitignorePath = join(__dirname, '.gitignore');
check('.gitignore exists', existsSync(gitignorePath));

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 Summary:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Total: ${passed + failed}`);

if (failed === 0) {
  console.log('\n🎉 All checks passed! Your backend is ready to deploy.');
  console.log('\n📝 Next steps:');
  console.log('1. Push to GitHub: git push origin main');
  console.log('2. Configure Railway environment variables');
  console.log('3. Deploy and check logs');
} else {
  console.log('\n⚠️  Some checks failed. Please review the errors above.');
}

console.log('\n');

