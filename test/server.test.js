import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanHtml, visibleDocs } from '../server.js';

test('cleanHtml removes scripts and inline event handlers', () => {
  assert.equal(cleanHtml('<p onclick="bad()">Safe</p><script>alert(1)</script>'), '<p>Safe</p>');
});
test('visibleDocs returns owned and shared documents only', () => {
  const store = { documents: [{ id: '1', ownerId: 'u-ava', sharedWith: [] }, { id: '2', ownerId: 'u-maya', sharedWith: ['u-ava'] }, { id: '3', ownerId: 'u-leo', sharedWith: [] }] };
  assert.deepEqual(visibleDocs(store, 'u-ava').map(d => d.id), ['1', '2']);
});
