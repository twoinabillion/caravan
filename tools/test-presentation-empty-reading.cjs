const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function setup(reading = null, pending = null) {
  const context = vm.createContext({G: {}, S: {pendingPresentation: pending}});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/04h-engine-presentation.js'), 'utf8'), context);
  context.G.presentationOwner = () => ({reading});
  context.G.presentationReading = value => value;
  return context.G;
}

test('ID-less temporary event with no reading receipt can render unchanged', () => {
  const state = {phase: 'event', index: 0};
  setup().restorePresentationView(state);
  assert.deepEqual(state, {phase: 'event', index: 0});
});

test('named event without a reading receipt can render unchanged', () => {
  const state = {eventId: 'fixture', phase: 'event', index: 0};
  setup().restorePresentationView(state);
  assert.equal(state.index, 0);
});

test('matching reading restores cursor without running an effect', () => {
  const state = {eventId: 'fixture', phase: 'event', index: 0};
  setup({eventId: 'fixture', phase: 'event', view: {index: 2}}).restorePresentationView(state);
  assert.equal(state.index, 2);
});

test('saved result retains selection and history', () => {
  const state = {eventId: 'fixture', phase: 'outcome'};
  setup({eventId: 'fixture', phase: 'outcome', view: {index: 1}, history: {index: 3}, selection: '확인', updates: []}).restorePresentationView(state);
  assert.equal(state.index, 1);
  assert.equal(state.history.index, 3);
  assert.equal(state.selection, '확인');
});

test('legacy view fallback restores only the matching event phase', () => {
  const pending = {eventId: 'fixture', phase: 'result', view: {index: 4}};
  const state = {eventId: 'fixture', phase: 'outcome', index: 0};
  setup(null, pending).restorePresentationView(state);
  assert.equal(state.index, 4);
  const other = {eventId: 'other', phase: 'outcome', index: 0};
  setup(null, pending).restorePresentationView(other);
  assert.equal(other.index, 0);
});
