export const categories=Object.freeze({premium:['Main Premium'],all_access:['Main Premium','NBA Premium','NHL Premium','NFL Premium','NCAAF Premium','NCAAB Premium']});
export function allowedCategories(access){return access?.all_access===true?[...categories.all_access]:access?.premium===true?[...categories.premium]:[];}
export function publicPick(p){return Object.fromEntries(['id','sport','category','pick_team','opponent','bet_type','selection','odds','game_date','espn_event_id','status'].map(k=>[k,p[k]]));}
