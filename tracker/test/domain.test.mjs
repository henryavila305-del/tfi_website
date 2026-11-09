import test from 'node:test';
import assert from 'node:assert/strict';
import { oddsToDecimal, summarize, validatePick } from '../domain.mjs';
test('American odds convert both favorites and underdogs',()=>{
  assert.equal(oddsToDecimal(150,'american'),2.5);
  assert.equal(oddsToDecimal(-200,'american'),1.5);
  for(const n of [0,99,-99,Infinity,'bad'])assert.throws(()=>oddsToDecimal(n,'american'));
  assert.throws(()=>oddsToDecimal(1,'decimal'));
});
test('ROI includes pushes, excludes voids and pending; win rate excludes pushes',()=>{
  const rows=[['win',2,3],['loss',1,2],['push',3,2],['void',100,2],['pending',100,2]].map(([result,stake,decimalOdds],i)=>({id:String(i),result,stake,decimalOdds,settledAt:`2026-10-${10+i}T00:00:00Z`}));
  const s=summarize(rows);assert.equal(s.netUnits,3);assert.equal(s.roi,50);assert.equal(s.winPercentage,50);assert.equal(s.riskedUnits,6);assert.deepEqual(s.curve.map(p=>p.units),[4,3,3]);
  assert.equal(summarize([]).roi,null);assert.equal(summarize([]).winPercentage,null);
});
test('public entry cannot be late and units must be positive finite cents',()=>{
  const now=Date.parse('2026-11-01T00:00:00Z'),input={sport:'NFL',event:'A at B',market:'Moneyline',selection:'A',stake:1,odds:-110,oddsFormat:'american',startsAt:'2026-11-02T00:00:00Z',visibility:'public'};
  assert.equal(validatePick(input,now).late,false);
  for(const stake of [0,-1,NaN,Infinity,.001])assert.throws(()=>validatePick({...input,stake},now));
  assert.throws(()=>validatePick({...input,startsAt:new Date(now).toISOString()},now));
  assert.equal(validatePick({...input,visibility:'private',startsAt:new Date(now).toISOString()},now).late,true);
});
