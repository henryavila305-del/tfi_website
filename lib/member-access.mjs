import {allowedCategories,publicPick} from './member-policy.mjs';
export async function memberData(userId,{checkAccess,readPicks,products}){
 if(!/^user_[a-zA-Z0-9]+$/.test(userId||''))return {status:401,body:{error:'Sign in with Whop to continue.'}};
 if(!/^prod_/.test(products.premium||'')||!/^prod_/.test(products.all_access||'')||products.premium===products.all_access)throw Error('Product mapping missing');
 const [premium,all_access]=await Promise.all([checkAccess(userId,products.premium),checkAccess(userId,products.all_access)]);
 const allowed=allowedCategories({premium,all_access});
 if(!allowed.length)return {status:403,body:{error:'No active TFI Premium or All Access membership was found.'}};
 const rows=await readPicks(allowed);
 if(!Array.isArray(rows))throw Error('Invalid picks');
 return {status:200,body:{tier:all_access?'All Access':'Premium',picks:rows.filter(p=>allowed.includes(p.category)).map(publicPick),updatedAt:new Date().toISOString()}};
}
