import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { fail, text, validatePick, summarize } from './domain.mjs';
const hash = token => createHash('sha256').update(token).digest('hex');
export function openStore(path, clock = Date.now) {
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, handle TEXT UNIQUE NOT NULL, salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS entitlements(user_id TEXT PRIMARY KEY REFERENCES users(id), plan TEXT NOT NULL CHECK(plan IN ('tracker','all_access')), expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS profiles(user_id TEXT PRIMARY KEY REFERENCES users(id), enabled INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS picks(id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL REFERENCES users(id), pick_id TEXT NOT NULL REFERENCES picks(id), at TEXT NOT NULL, action TEXT NOT NULL, data TEXT NOT NULL);
    CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit BEGIN SELECT RAISE(ABORT,'Audit is append-only'); END;
    CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit BEGIN SELECT RAISE(ABORT,'Audit is append-only'); END;
    CREATE TRIGGER IF NOT EXISTS picks_no_delete BEFORE DELETE ON picks BEGIN SELECT RAISE(ABORT,'Picks cannot be deleted'); END;`);
  const iso = () => new Date(clock()).toISOString();
  const transaction = fn => { db.exec('BEGIN IMMEDIATE'); try {const result=fn(); db.exec('COMMIT'); return result;} catch(e){db.exec('ROLLBACK');throw e;} };
  const account = id => { const u=db.prepare('SELECT id,handle FROM users WHERE id=?').get(id); if(!u)fail(401,'Sign in required'); return u; };
  const entitled = id => {account(id);return !!db.prepare('SELECT 1 FROM entitlements WHERE user_id=? AND expires>?').get(id,clock());};
  const requireAccess = id => {if(!entitled(id))fail(403,'An active Premium Tracker or All Access membership is required');};
  const owned = (id,pickId) => {const row=db.prepare('SELECT data FROM picks WHERE id=? AND user_id=?').get(pickId,id);if(!row)fail(404,'Pick not found');return JSON.parse(row.data);};
  const save = (id,pick,action,detail={}) => {
    db.prepare('INSERT INTO picks(id,user_id,data) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run(pick.id,id,JSON.stringify(pick));
    db.prepare('INSERT INTO audit(user_id,pick_id,at,action,data) VALUES(?,?,?,?,?)').run(id,pick.id,iso(),action,JSON.stringify(detail));
    return pick;
  };
  const list = id => db.prepare('SELECT data FROM picks WHERE user_id=? ORDER BY rowid DESC').all(id).map(r=>JSON.parse(r.data));
  return {
    close:()=>db.close(),
    register(input) {
      const handle=text(input.handle,'handle',24).toLowerCase();
      if(!/^[a-z][a-z0-9_]{2,23}$/.test(handle))fail(400,'Handle must be 3–24 lowercase letters, numbers or underscores, starting with a letter');
      if(typeof input.password!=='string'||input.password.length<12||input.password.length>128)fail(400,'Use a password between 12 and 128 characters');
      const salt=randomBytes(16).toString('hex'), passwordHash=scryptSync(input.password,salt,64).toString('hex');
      const id=randomUUID();
      try {transaction(()=>{db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(id,handle,salt,passwordHash,iso());db.prepare('INSERT INTO profiles(user_id) VALUES(?)').run(id);});}
      catch(e){if(e.code?.startsWith('ERR_SQLITE')&&db.prepare('SELECT 1 FROM users WHERE handle=?').get(handle))fail(409,'Handle unavailable');throw e;}
      return {id,handle};
    },
    login(input) {
      const handle=typeof input.handle==='string'?input.handle.toLowerCase():'';
      if(typeof input.password!=='string'||input.password.length>128)fail(401,'Invalid credentials');
      const row=db.prepare('SELECT * FROM users WHERE handle=?').get(handle);
      const attempt=scryptSync(input.password,row?.salt||'0'.repeat(32),64);
      if(!row||!timingSafeEqual(attempt,Buffer.from(row.password_hash,'hex')))fail(401,'Invalid credentials');
      const token=randomBytes(32).toString('hex');
      db.prepare('DELETE FROM sessions WHERE expires<=?').run(clock());
      db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(token),row.id,clock()+86400000);
      return {token,user:{id:row.id,handle:row.handle}};
    },
    authenticate(token) {if(typeof token!=='string'||token.length!==64)fail(401,'Sign in required');const s=db.prepare('SELECT user_id FROM sessions WHERE token_hash=? AND expires>?').get(hash(token),clock());if(!s)fail(401,'Session expired');return account(s.user_id);},
    logout(token) {if(token)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(token));},
    grant(handle,plan,expires) {if(!['tracker','all_access'].includes(plan)||!Number.isFinite(expires)||expires<=clock())fail(400,'Invalid entitlement');const u=db.prepare('SELECT id FROM users WHERE handle=?').get(handle);if(!u)fail(404,'Account not found');db.prepare('INSERT INTO entitlements VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET plan=excluded.plan,expires=excluded.expires').run(u.id,plan,expires);},
    dashboard(id) {const user=account(id), picks=list(id);return {user,active:entitled(id),profileEnabled:!!db.prepare('SELECT enabled FROM profiles WHERE user_id=?').get(id).enabled,picks,summary:summarize(picks)};},
    setProfile(id,enabled) {requireAccess(id);if(typeof enabled!=='boolean')fail(400,'Invalid profile setting');if(!enabled&&list(id).some(p=>p.publishedAt))fail(409,'Published records remain public; contact support for account privacy requests');db.prepare('UPDATE profiles SET enabled=? WHERE user_id=?').run(Number(enabled),id);return {enabled};},
    add(id,input) {requireAccess(id);return transaction(()=>{const data=validatePick(input,clock());if(data.visibility==='public'&&!db.prepare('SELECT enabled FROM profiles WHERE user_id=?').get(id).enabled)fail(400,'Enable your public profile before publishing');const pick={...data,id:randomUUID(),createdAt:iso(),publishedAt:data.visibility==='public'?iso():null,result:'pending',settledAt:null,verification:'self-reported'};return save(id,pick,'created',{snapshot:pick});});},
    publish(id,pickId) {requireAccess(id);return transaction(()=>{const p=owned(id,pickId);if(p.publishedAt)fail(409,'Already published');if(p.result!=='pending'||Date.parse(p.startsAt)<=clock())fail(409,'Cannot publish a started or settled pick');if(!db.prepare('SELECT enabled FROM profiles WHERE user_id=?').get(id).enabled)fail(400,'Enable your public profile first');p.visibility='public';p.publishedAt=iso();return save(id,p,'published',{snapshot:p});});},
    settle(id,pickId,input) {requireAccess(id);return transaction(()=>{const p=owned(id,pickId);if(Date.parse(p.startsAt)>clock())fail(409,'Event has not started');if(!['win','loss','push','void'].includes(input.result))fail(400,'Invalid result');const reason=text(input.reason,'grading source or correction reason',500);const old=p.result;p.result=input.result;p.settledAt=p.settledAt||iso();return save(id,p,old==='pending'?'graded':'corrected',{from:old,to:p.result,reason});});},
    audit(id,pickId) {owned(id,pickId);return db.prepare('SELECT at,action,data FROM audit WHERE pick_id=? ORDER BY id').all(pickId).map(r=>({...r,data:JSON.parse(r.data)}));},
    publicRecord(handle) {
      const user=db.prepare('SELECT u.id,u.handle FROM users u JOIN profiles p ON p.user_id=u.id WHERE u.handle=? AND p.enabled=1').get(handle);
      if(!user)fail(404,'Public profile not found');
      const picks=list(user.id).filter(p=>p.publishedAt).map(({id,sport,event,market,selection,decimalOdds,stake,startsAt,publishedAt,result,settledAt,verification})=>({id,sport,event,market,selection,decimalOdds,stake,startsAt,publishedAt,result,settledAt,verification,history:db.prepare("SELECT at,action,data FROM audit WHERE pick_id=? AND action IN ('graded','corrected') ORDER BY id").all(id).map(r=>({at:r.at,action:r.action,...JSON.parse(r.data)}))}));
      return {handle:user.handle,label:'Published picks record · self-reported',picks,summary:summarize(picks)};
    }
  };
}
