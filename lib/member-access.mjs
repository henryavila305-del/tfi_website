import {allowedCategories,publicPick} from './member-policy.mjs';
export async function memberData(userId,{checkAccess,readPicks,products}){
 if(!/^user_[a-zA-Z0-9]+$/.test(userId||''))return {status:401,body:{state:'signed_out',error:'Sign in with Whop to continue.'}};
 if(!/^prod_[a-zA-Z0-9]+$/.test(products.premium||'')||!/^prod_[a-zA-Z0-9]+$/.test(products.all_access||'')||products.premium===products.all_access)throw Error('Product mapping missing');
 const [premium,all_access]=await Promise.all([checkAccess(userId,products.premium),checkAccess(userId,products.all_access)]);
 const allowed=allowedCategories({premium,all_access});
 if(!allowed.length)return {status:403,body:{state:'no_access',error:'You are signed in, but no active TFI Premium or All Access membership was found. Use the account you subscribed with, or manage your membership on Whop.'}};
 const rows=await readPicks(allowed);
 if(!Array.isArray(rows))throw Error('Invalid picks');
 return {status:200,body:{state:'active',tier:all_access===true?'All Access':'Premium',categories:allowed,picks:rows.filter(p=>p&&allowed.includes(p.category)).map(publicPick),updatedAt:new Date().toISOString()}};
}

