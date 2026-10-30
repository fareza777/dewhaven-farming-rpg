import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as generator from './generate-unity-voice.mjs';

test('Deepgram streaming WAV lengths become finite without changing the spoken samples',async()=>{
  const source=await fs.readFile(new URL('../art/voice/deepgram-v1/probe-source.wav',import.meta.url));
  assert.equal(typeof generator.normalizeWav,'function');
  const normalized=generator.normalizeWav(source);
  assert.equal(normalized.readUInt32LE(4),normalized.length-8);
  assert.equal(normalized.readUInt32LE(40),normalized.length-44);
  assert.deepEqual(normalized.subarray(44),source.subarray(44));
  assert.ok(generator.wavInfo(normalized).seconds>1);
});
test('An API JSON error can never become a voice recording',()=>{
  assert.equal(typeof generator.normalizeWav,'function');
  assert.throws(()=>generator.normalizeWav(Buffer.from('{"err_code":"INVALID_AUTH"}')),/WAV/);
});
