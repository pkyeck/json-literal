'use strict'

var type = require('type-of')
var util = require('util')
var esprima = require('esprima')

module.exports = {parse: parse, stringify: stringify}
function parse(src) {
  var result
  var ast = esprima.parse('(' + src.replace(/^\((.*)\)$/, '$1') + ')');

  if (ast.body.length !== 1) {
    throw new Error('unexpected extra expression');
  }
  else if (ast.body[0].type !== 'ExpressionStatement') {
    throw new Error('expected ExpressionStatement');
  }

  var root = ast.body[0].expression;
  return (function walk (node) {
    if (node.type === 'Literal') {
      return node.value
    } else if (node.type === 'UnaryExpression' && node.operator === '-' && node.argument.type === 'Literal' && typeof node.argument.value === 'number') {
      return -node.argument.value
    } else if (node.type === 'ArrayExpression') {
      return node.elements.map(walk)
    } else if (node.type === 'ObjectExpression') {
      var obj = {}
      for (var i = 0; i < node.properties.length; i++) {
        var prop = node.properties[i]
        var value = prop.value === null ? prop.value : walk(prop.value)
        var key = prop.key.type === 'Literal' ? prop.key.value : (prop.key.type === 'Identifier' ? prop.key.name : null)
        if (key === null) throw new Error('Object key of type ' + prop.key.type + ' not allowed, expected Literal or Identifier')
        obj[key] = value
      }
      return obj;
    } else if (node.type === 'Identifier' && node.name === 'undefined') {
      return undefined
    } else if (node.type === 'NewExpression' && node.callee.type === 'Identifier' && node.callee.name === 'Date') {
      var args = node.arguments.map(walk)
      return eval('new Date(' + args.map(JSON.stringify).join(',') + ')')
    } else {
      var ex = new Error('unexpected ' + node.type + ' node')
      throw ex
    }
  }(root))
}
function stringify(obj) {
  var sentinel = {}
  var res = (function walk(node) {
    switch (type(node)) {
      case 'date':
        return 'new Date(' + walk(node.toISOString()) + ')'
      case 'null':
        return 'null'
      case 'undefined':
        return 'undefined'
      case 'string':
        return JSON.stringify(node)
      case 'boolean':
        return node.toString()
      case 'number':
        return node.toString()
      case 'regexp':
        return util.inspect(node)
      case 'arguments':
        node = Array.prototype.slice(node)
      case 'array':
        return '[' + node.map(walk).map(function (v) { return v === sentinel ? 'undefined' : v }).join(',') + ']'
      case 'object':
        var partial = []
        for (var k in node) {
          if (Object.prototype.hasOwnProperty.call(node, k)) {
            var v = walk(node[k]);
            if (v !== sentinel) {
              partial.push((/^[a-zA-Z]+$/.test(k) ? k : walk(k)) + ':' + v)
            }
          }
        }
        return '{' + partial.join(',') + '}'
      default:
        return sentinel
    }
  }(obj))
  if (res === sentinel) {
    throw new Error('Cannot stringify ' + type(obj))
  } else {
    return '(' + res + ')'
  }
}