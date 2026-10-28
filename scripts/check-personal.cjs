const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const path = require('path');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({crypto, structuredClone, TextEncoder, TextDecoder, setTimeout, clearTimeout, console});
vm.runInContext(fs.readFileSync(path.join(root, 'personal-engine.js'), 'utf8'), context, {timeout: 15000});

const result = vm.runInContext(`
  const profile = PersonalEngine.newPersonal('Offline QA', 4);
  // This tests serialization, not battle balance. A healthy level-50 practice
  // team using Growl keeps both sides alive even if the opponent lands a critical hit.
  const mon = profile.trainer.party[0];
  mon.level = 50;
  mon.xp = 117360;
  mon.moves = [{id: 45, pp: 40}];
  const game = new PersonalEngine.LocalGame(profile);
  game.dispatch({action: 'sync', seq: 1, steps: ['right', 'right']});
  let state = game.dispatch({action: 'propose', kind: 'coop', npc: 'guide', requestId: crypto.randomUUID()});
  state = game.dispatch({action: 'choose', battle: state.battle.id, turn: 1, choice: 'move 1', requestId: crypto.randomUUID()});
  const firstTurn = state.battle.turn;
  const firstPP = state.battle.you.moves[0].pp;
  const saved = JSON.parse(JSON.stringify(game.snapshot()));
  const reloaded = new PersonalEngine.LocalGame(null, saved);
  const resumed = reloaded.state();
  const resumedPP = resumed.battle.you.moves[0].pp;
  const next = reloaded.dispatch({action: 'choose', battle: resumed.battle.id, turn: resumed.battle.turn, choice: 'move 1', requestId: crypto.randomUUID()});
  ({version: PersonalEngine.version, firstTurn, firstPP, resumedPP, turn: next.battle.turn,
    pp: next.battle.you.moves[0].pp, id: reloaded.member.id, original: profile.trainer.id});
`, context);

assert.equal(result.version, '2.5.0');
assert.equal(result.firstTurn, 2);
assert.equal(result.firstPP, 39);
assert.equal(result.resumedPP, result.firstPP);
assert.equal(result.turn, 3);
assert.equal(result.pp, 38);
assert.equal(result.id, result.original);
assert.equal(typeof context.fetch, 'undefined');
console.log('PASS delivered browser bundle: offline combat, PP, identity and reload without networking');
