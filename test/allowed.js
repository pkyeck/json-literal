var assert = require('assert')
var garbage = require('garbage')
var JSONL = require('../')

describe('parse', function () {
  it('accepts anything that JSON accepts', function () {
    for (var i = 0; i < 10000; i++) {
      var obj = garbage()
      var str = JSON.stringify(obj)
      try {
        assert.deepEqual(JSON.parse(str), JSONL.parse(str))
      } catch (ex) {
        ex.message += '\n' + str
        throw ex
      }
    }
  })
})
describe('stringify -> parse', function () {
  it('can handle anything that JSON accepts', function () {
    for (var i = 0; i < 10000; i++) {
      var obj = garbage()
      var str = JSONL.stringify(obj)
      try {
        assert(typeof str === 'string')
        assert.deepEqual(obj, JSONL.parse(str))
        assert.throws(function () {
          JSON.parse(str)
        })
      } catch (ex) {
        ex.message += '\n' + JSON.stringify(obj) + '\n' + str
        throw ex
      }
    }
  })
})

describe('dates', function () {
  it('stringifies them', function () {
    assert(JSONL.stringify(new Date('2013-07-13T00:28:00.000Z')) === '(new Date("2013-07-13T00:28:00.000Z"))')
  })
  it('parses them', function () {
    assert.deepEqual(new Date('2013-07-13T00:28:00.000Z'), JSONL.parse('(new Date("2013-07-13T00:28:00.000Z"))'))
  })
})
describe('regexps', function () {
  it('stringifies them', function () {
    assert(JSONL.stringify(/^[a-z]+$/g) === '(/^[a-z]+$/g)')
  })
  it('parses them', function () {
    assert.deepEqual(/^[a-z]+$/g, JSONL.parse('(/^[a-z]+$/g)'))
  })
})