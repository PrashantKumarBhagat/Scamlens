#!/usr/bin/env node
/**
 * ScamLens Test Runner
 * Loads rules directly from index.html (single source of truth)
 * Evaluates test cases in tests/messages.json
 * Reports accuracy, false positives, and false negatives.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const htmlPath = path.join(rootDir, 'index.html');
const testCasesPath = path.join(__dirname, 'messages.json');

if (!fs.existsSync(htmlPath)) {
  console.error(`Error: index.html not found at ${htmlPath}`);
  process.exit(1);
}

if (!fs.existsSync(testCasesPath)) {
  console.error(`Error: messages.json not found at ${testCasesPath}`);
  process.exit(1);
}

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const testCases = JSON.parse(fs.readFileSync(testCasesPath, 'utf8'));

// Extract RULES array from index.html
function extractRules(html) {
  const match = html.match(/var RULES\s*=\s*(\[[\s\S]*?\]);\s*function/);
  if (!match) {
    throw new Error('Failed to extract RULES array from index.html');
  }

  // Safely evaluate the RULES array within a sandbox
  const code = `"use strict"; return (${match[1]});`;
  const fn = new Function(code);
  return fn();
}

let rules;
try {
  rules = extractRules(htmlContent);
} catch (err) {
  console.error('Error parsing rules from index.html:', err.message);
  process.exit(1);
}

function num(v) {
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v || '').replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

function analyse(text, mode, listingPrice, usualPrice) {
  const hits = [];
  let s = 0;

  rules.forEach((r) => {
    if (r.m.indexOf(mode) > -1 && r.re.test(text)) {
      hits.push(r);
      s += r.w;
    }
  });

  const p = num(listingPrice);
  const u = num(usualPrice);
  if (mode === 'buy' && p > 0 && u > 0 && p < u * 0.7) {
    const d = Math.round((1 - p / u) * 100);
    const w = p < u * 0.5 ? 3 : 2;
    hits.push({
      id: 'price',
      w: w,
      t: 'Price well below usual',
      y: `$${p} is about ${d}% below $${u}. Very low prices attract scammers.`
    });
    s += w;
  }

  const lv = s === 0 ? 0 : s <= 2 ? 1 : s <= 4 ? 2 : 3;
  return { hits, s, lv };
}

// Run test suite
console.log('='.repeat(70));
console.log(' ScamLens Rule Validation Test Suite');
console.log(` Loaded ${rules.length} rules from index.html`);
console.log(` Testing ${testCases.length} sample messages`);
console.log('='.repeat(70));

let passed = 0;
let falsePositives = [];
let falseNegatives = [];
let levelMismatches = [];

testCases.forEach((tc, index) => {
  const { id, mode, type, message, price, usualPrice, expectedLevel } = tc;
  const result = analyse(message, mode, price, usualPrice);

  const isExactMatch = result.lv === expectedLevel;
  const isFalsePositive = type === 'genuine' && result.lv > 0;
  const isFalseNegative = type === 'scam' && result.lv === 0;

  if (isFalsePositive) {
    falsePositives.push({ tc, result });
  } else if (isFalseNegative) {
    falseNegatives.push({ tc, result });
  } else if (!isExactMatch) {
    levelMismatches.push({ tc, result });
  }

  if (isExactMatch) {
    passed++;
    console.log(`  [PASS] [${tc.type.toUpperCase()}] ${id} -> Level ${result.lv} (Score: ${result.s})`);
  } else {
    const status = isFalsePositive
      ? 'FALSE POSITIVE'
      : isFalseNegative
      ? 'FALSE NEGATIVE'
      : 'LEVEL MISMATCH';
    console.log(`  [FAIL] [${status}] ${id} -> Expected Lv ${expectedLevel}, got Lv ${result.lv} (Score: ${result.s})`);
    if (result.hits.length) {
      console.log(`         Flags triggered: ${result.hits.map(h => h.id).join(', ')}`);
    }
  }
});

const accuracy = Math.round((passed / testCases.length) * 100);

console.log('\n' + '='.repeat(70));
console.log(' Test Summary');
console.log('='.repeat(70));
console.log(` Total Samples:     ${testCases.length}`);
console.log(` Passed:            ${passed} / ${testCases.length}`);
console.log(` Accuracy:          ${accuracy}% (Target: >= 90%)`);
console.log(` False Positives:   ${falsePositives.length}`);
console.log(` False Negatives:   ${falseNegatives.length}`);
console.log(` Level Mismatches:  ${levelMismatches.length}`);

if (falsePositives.length > 0) {
  console.log('\n--- False Positives (Genuine messages wrongly flagged) ---');
  falsePositives.forEach(({ tc, result }) => {
    console.log(`  * ${tc.id}: "${tc.message}"`);
    console.log(`    Triggered flags: ${result.hits.map(h => `${h.id} (${h.t})`).join(', ')}`);
  });
}

if (falseNegatives.length > 0) {
  console.log('\n--- False Negatives (Scam messages missed completely) ---');
  falseNegatives.forEach(({ tc }) => {
    console.log(`  * ${tc.id}: "${tc.message}"`);
  });
}

if (levelMismatches.length > 0) {
  console.log('\n--- Level Mismatches (Flagged, but different risk level) ---');
  levelMismatches.forEach(({ tc, result }) => {
    console.log(`  * ${tc.id}: Expected Lv ${tc.expectedLevel}, got Lv ${result.lv} (Score: ${result.s}, Flags: ${result.hits.map(h => h.id).join(', ')})`);
  });
}

console.log('='.repeat(70));

if (accuracy >= 90 && falsePositives.length === 0 && falseNegatives.length === 0) {
  console.log(' Result: SUCCESS! Test suite passed all targets (>= 90% accuracy, 0 FP, 0 FN).');
  process.exit(0);
} else if (accuracy >= 90) {
  console.log(' Result: SUCCESS! Accuracy >= 90% achieved.');
  process.exit(0);
} else {
  console.log(' Result: FAILURE. Accuracy below 90% target.');
  process.exit(1);
}
