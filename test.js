#!/usr/bin/env node
/**
 * scripts/test.js
 * Unit tests for pure utility functions (no DOM required).
 */
import { calcDayKPIs, calcWeekKPIs, calcForecast } from '../js/utils/calc.js';
import { fmtAED, fmtPct, fmtKD } from '../js/utils/format.js';
import { DAYS, getWeekBP, getDayBP, getCurrentWeekNum } from '../js/data/bp.js';

let pass = 0, fail = 0;

function assert(label, actual, expected) {
  const ok = Math.abs(actual - expected) < 0.01;
  console.log(ok ? '✅' : '❌', label, ok ? '' : `(got ${actual}, expected ${expected})`);
  ok ? pass++ : fail++;
}
function assertEq(label, actual, expected) {
  const ok = actual === expected;
  console.log(ok ? '✅' : '❌', label, ok ? '' : `(got "${actual}", expected "${expected}")`);
  ok ? pass++ : fail++;
}
function assertNull(label, actual) {
  const ok = actual === null || actual === undefined;
  console.log(ok ? '✅' : '❌', label + ' is null/undefined', ok ? '' : `(got ${actual})`);
  ok ? pass++ : fail++;
}

console.log('\n── calc.js ─────────────────────────────');
const ctx = { dayBP: 20000, n7DayBP: 2000, kdRate: 11.99, divAPercent: 60 };

const k1 = calcDayKPIs({ sales: 20000, trn: 200, items: 400, no7: 2000, aura: 30 }, ctx);
assert('ATV = sales/trn',       k1.atv,     100);
assert('IPC = items/trn',       k1.ipc,     2);
assert('no7Pct = no7/sales*100',k1.no7Pct,  10);
assert('achPct = sales/bp*100', k1.achPct,  100);
assert('gap = sales - bp',      k1.gap,     0);
assert('auraPct = aura/trn*100',k1.auraPct, 15);
assert('kdSales = sales/kdRate',k1.kdSales, 20000/11.99);
assert('divAValue = sales*0.6', k1.divAValue,12000);

const k2 = calcDayKPIs({ sales: null, trn: null }, ctx);
assertNull('null sales → null atv',    k2.atv);
assertNull('null sales → null no7Pct', k2.no7Pct);

const entries = [
  { sales:20000, trn:200, items:400, no7:2000, aura:30, _day:'Fri' },
  { sales:22000, trn:220, items:450, no7:2200, aura:35, _day:'Sat' },
  { sales:18000, trn:180, items:360, no7:1800, aura:28, _day:'Sun' },
];
const wk = calcWeekKPIs(entries, { weekBP:140000, n7WeekBP:14000 });
assert('wkSales = sum',    wk.wkSales, 60000);
assert('wkAtv correct',    wk.wkAtv,   60000/600);
assert('bestSales = 22000',wk.bestSales,22000);

const fc = calcForecast(entries, 140000);
assert('forecast daysIn=3',  fc.daysIn,  3);
assert('forecast projected',  fc.projected, (60000/3)*7);

console.log('\n── format.js ────────────────────────────');
assertEq('fmtAED 19794',       fmtAED(19794),       '19,794');
assertEq('fmtAED null → —',    fmtAED(null),        '—');
assertEq('fmtPct 12.3',        fmtPct(12.3),        '12.3%');
assertEq('fmtPct null → —%',   fmtPct(null),        '—%');
assertEq('fmtKD 11990 rate 11.99', fmtKD(11990, 11.99), '1000.00 KD');

console.log('\n── bp.js ────────────────────────────────');
assertEq('DAYS[0] = Fri',      DAYS[0],             'Fri');
assertEq('DAYS length = 7',    DAYS.length,         7);
const w1bp = getWeekBP(1);
assert('week 1 BP > 0',        w1bp,                w1bp);
assert('week 1 day Fri BP',    getDayBP(1,'Fri'),   23930);
assertNull('invalid week',     getWeekBP(99));
const wkNum = getCurrentWeekNum();
console.log('✅ getCurrentWeekNum() =', wkNum);
pass++;

console.log(`\n${'═'.repeat(40)}`);
console.log(`PASS: ${pass}   FAIL: ${fail}`);
process.exit(fail > 0 ? 1 : 0);
