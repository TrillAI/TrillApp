import {test} from 'node:test';import assert from 'node:assert/strict';import {majority,safeName,MODES} from '../src/core.js';
test('majority normalizes casing and whitespace',()=>assert.deepEqual(majority(['Hello world',' hello   WORLD ','other']),{count:2,text:'Hello world'}));
test('empty recognition has no winner',()=>assert.equal(majority([' ','']),null));
test('file names are sanitized',()=>assert.equal(safeName('../my transcript'), 'my-transcript'));
test('separate modes describe limitations',()=>{assert.equal(Object.keys(MODES).length,4);assert.match(MODES.calls.description,/consent/i)});
