import assert from 'node:assert/strict';
import {createDraft,approve,publish,grade,report,publicProjection,validateCard} from './model.mjs';
const date='2026-11-10';
const make=(category,sport,pickTeam,opponent,betType,selection,odds,status,startsAt)=>({category,sport,pickTeam,opponent,betType,selection,odds,status,gameDate:date,startsAt});
const fixture={date,historical:true,picks:[
make('Top 3 #3','NHL','Minnesota Wild','Montreal Canadiens','ML','Minnesota Wild',-125,'win','2026-11-11T00:00:00Z'),
make('Top 3 #2','NBA','Oklahoma City Thunder','Portland Trail Blazers','ML','Oklahoma City Thunder',-130,'loss','2026-11-11T04:00:00Z'),
make('Top 3 #1','NHL','Colorado Avalanche','Toronto Maple Leafs','ML','Colorado Avalanche',-155,'win','2026-11-11T00:00:00Z'),
make('Main Premium','NHL','Minnesota Wild','Montreal Canadiens','ML','Minnesota Wild',-125,'win','2026-11-11T00:00:00Z'),
make('NBA Premium','NBA','LA Clippers','Phoenix Suns','spread','LA Clippers +3.5',-112,'loss','2026-11-11T02:00:00Z'),
make('NHL Premium','NHL','New Jersey Devils','Winnipeg Jets','ML','New Jersey Devils',-155,'loss','2026-11-11T00:00:00Z')
]};
const check=validateCard(fixture);
assert.equal(check.duplicates.length,1);
assert.deepEqual(check.duplicates[0].categories,['Top 3 #3','Main Premium']);
const draft=createDraft(fixture);
assert.equal(draft.state,'draft');
const approved=approve(draft,'synthetic-admin');
assert.equal(approved.state,'approved');
assert.throws(()=>publish(approved),/Historical fixture/);
assert.throws(()=>publicProjection(draft),/Unpublished/);
const result=report(grade(approved,{}));
assert.deepEqual(result.publishedSelections,{win:3,loss:3,push:0,pending:0});
assert.deepEqual(result.distinctWagers,{win:2,loss:3,push:0,pending:0});
assert.deepEqual(result.topThree,{win:2,loss:1,push:0,pending:0});
assert.deepEqual(result.premiums,{win:1,loss:2,push:0,pending:0});
const future={...fixture,historical:false,date:'2026-12-10',picks:fixture.picks.map(p=>({...p,gameDate:'2026-12-10',startsAt:'2026-12-11T00:00:00Z'}))};
const before=new Date('2026-12-10T18:00:00Z');
const futureDraft=createDraft(future,before);
const published=publish(approve(futureDraft,'synthetic-admin',before),before);
assert.equal(publicProjection(published).length,3);
assert(publicProjection(published).every(p=>p.category.startsWith('Top 3')));
assert.throws(()=>validateCard(future,new Date('2026-12-10T23:00:00Z')),/two-hour/);
assert.throws(()=>publish(futureDraft,before),/Approval/);
console.log('PASS: November 10 historical card, overlap, category records, privacy, approval, deadlines, and publication guards.');
