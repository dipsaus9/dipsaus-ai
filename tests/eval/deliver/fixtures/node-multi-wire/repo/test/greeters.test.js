import { test } from 'node:test'
import assert from 'node:assert/strict'
import { greeters } from '../src/index.js'

test('shout greeter is registered and works', () => {
  assert.equal(typeof greeters.shout, 'function')
  assert.equal(greeters.shout('hi'), 'HI!')
})
