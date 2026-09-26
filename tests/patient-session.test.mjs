import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as session from '../src/lib/patient-session.ts';
const values = new Map();
globalThis.sessionStorage = { getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k) };
beforeEach(() => { values.clear(); session.clearPatientSession(); });
test('old national ID session never authenticates', () => {
  values.set('patient_national_id', '1234567890');
  assert.equal(session.readPatientSession(), null);
});
test('patient tokens are isolated and sign out drops credentials', () => {
  session.savePatientSession({access:'a',refresh:'r'}, '1234567890');
  assert.equal(session.readPatientSession().access,'a');
  session.clearPatientSession();
  assert.equal(session.readPatientSession(),null);
});
test('expired access refreshes and retries only own records', async () => {
  session.savePatientSession({access:'old',refresh:'refresh'}, '1234567890');
  const calls=[];
  globalThis.fetch=async (url, options) => {
    calls.push([url, options]);
    return calls.length===1 ? new Response('{}',{status:401}) : calls.length===2 ? Response.json({access:'new'}) : Response.json([{id:1}]);
  };
  assert.deepEqual(await session.fetchPatientRecords('https://api.test/api'),[{id:1}]);
  assert.equal(calls[0][0], 'https://api.test/api/saderat-bank-health-monitoring/patient-records/me/');
  assert.equal(calls[2][1].headers.Authorization,'JWT new');
});
test('rejected refresh signs patient out', async () => {
  session.savePatientSession({access:'old',refresh:'bad'}, '1234567890');
  globalThis.fetch=async()=>new Response('{}',{status:401});
  await assert.rejects(session.fetchPatientRecords('https://api.test/api'));
  assert.equal(session.readPatientSession(),null);
});
test('late refresh cannot restore signed out patient or replace second account', async () => {
  session.savePatientSession({access:'a',refresh:'r'}, '1234567890');
  let finish; let calls=0;
  globalThis.fetch=async()=> ++calls===1 ? new Response('{}',{status:401}) : new Promise(resolve=>{finish=resolve});
  const pending=session.fetchPatientRecords('https://api.test/api');
  while(!finish) await new Promise(r=>setTimeout(r,0));
  session.clearPatientSession();
  session.savePatientSession({access:'b',refresh:'s'}, '0987654321');
  finish(Response.json({access:'late'}));
  await assert.rejects(pending);
  assert.equal(session.readPatientSession().access,'b');
});
test('wrong password and unknown ID use the same generic error without establishing a session', async () => {
  const requests=[];
  globalThis.fetch=async(url,options)=>{ requests.push([url,JSON.parse(options.body)]); return new Response('{}',{status:401}); };
  for (const id of ['1234567890','0987654321']) {
    await assert.rejects(session.authenticatePatient('https://api.test/api',id,'provided-password'), {message:'Patient request failed',status:401});
    assert.equal(session.readPatientSession(),null);
  }
  assert.equal(requests[0][0],'https://api.test/api/auth/patient/jwt/create/');
  assert.equal(requests[0][1].password,'provided-password');
});
test('password characters are preserved and successful sign in does not require records', async () => {
  let sent;
  globalThis.fetch=async(url,options)=>{sent=JSON.parse(options.body);return Response.json({access:'a',refresh:'r'});};
  assert.deepEqual(await session.authenticatePatient('https://api.test/api','1234567890',' رمز ۱۲۳ '),{access:'a',refresh:'r'});
  assert.equal(sent.password,' رمز ۱۲۳ ');
});
test('late record response cannot be returned after switching accounts', async () => {
  session.savePatientSession({access:'a',refresh:'r'},'1234567890');
  let finish;
  globalThis.fetch=async()=>new Promise(resolve=>{finish=resolve});
  const pending=session.fetchPatientRecords('https://api.test/api');
  session.clearPatientSession();
  session.savePatientSession({access:'b',refresh:'s'},'0987654321');
  finish(Response.json([{id:'first-patient-private-record'}]));
  await assert.rejects(pending);
});
test('sign out cleanup removes only patient cache and aborts an in-flight request', async () => {
  const { QueryClient } = await import('@tanstack/react-query');
  const { clearPatientRecords } = await import('../src/lib/patient-query-cache.ts');
  const client = new QueryClient();
  client.setQueryData(['staff-records'],['staff-data']);
  client.setQueryData(['patient-own-records','first'],['private-data']);
  let signal;
  const pending=client.fetchQuery({queryKey:['patient-own-records','pending'],queryFn:ctx=>{signal=ctx.signal;return new Promise(()=>{});}});
  clearPatientRecords(client);
  await assert.rejects(pending);
  assert.equal(signal.aborted,true);
  assert.equal(client.getQueryData(['patient-own-records','first']),undefined);
  assert.deepEqual(client.getQueryData(['staff-records']),['staff-data']);
  client.setQueryData(['patient-own-records','second'],['second-data']);
  assert.deepEqual(client.getQueryData(['patient-own-records','second']),['second-data']);
  client.clear();
});
