var chai = require('chai');
var assert = chai.assert;

var id = require("./inlineDecorator.js");

describe('parse', function(){
  it('空文字', function(){assert.deepEqual(id.parse("", 0),[{kind: "text",body: ""}])});
  it('ただの文字列', function(){assert.deepEqual(id.parse("hoge", 0),[{kind: "text",body: "hoge"}])});
  it('タグ付き文字', function(){assert.deepEqual(id.parse("ab{{hoge}}yz", 0),[
    {kind: "text",body: "ab"},
    [{kind: "text",body: "hoge"}],
    {kind: "text",body: "yz"},
  ])});
  it('タグ付き文字 2つ', function(){assert.deepEqual(id.parse("ab{{hoge}}yz{{fuga}}89", 0),[
    {kind: "text",body: "ab"},
    [{kind: "text",body: "hoge"}],
    {kind: "text",body: "yz"},
    [{kind: "text",body: "fuga"}],
    {kind: "text",body: "89"},
  ])});
  it('入れ子', function(){assert.deepEqual(id.parse("ab{{hoge{{fuga}}piyo}}yz", 0),[
    {kind: "text",body: "ab"},
    [
      {kind: "text",body: "hoge"},
      [{kind: "text",body: "fuga"}],
      {kind: "text",body: "piyo"},
    ],
    {kind: "text",body: "yz"},
  ])});
  it('崩れてる', function(){assert.deepEqual(id.parse("ab{{hoge", 0),[
    {kind: "text",body: "ab"},
    [{kind: "text",body: "hoge"}],
    {kind: "text",body: ""},
  ])});
   it('崩れてる2', function(){assert.deepEqual(id.parse("ab}}hoge", 0),[
    {kind: "text",body: "ab"},
    {kind: "text",body: "hoge"},
  ])});
 
});

describe('htmlEncode', function(){
  it('空文字', function(){assert.deepEqual(id.htmlEncode([{kind: "text", body: ""}]),"")});
  it('ただの文字列', function(){assert.deepEqual(id.htmlEncode([{kind: "text", body: "hoge"}]),"hoge")});
  it('タグ付き文字', function(){assert.deepEqual(id.htmlEncode([
    {kind: "text",body: "ab"},
    [{kind: "text",body: "hoge"}],
    {kind: "text",body: "yz"},
  ]
  ),"ab{{hoge}}yz")});
  it('link', function(){assert.deepEqual(id.htmlEncode([
    {kind: "text",body: "ab"},
    [{kind: "text",body: "link address"}],
    {kind: "text",body: "yz"},
  ]
  ),"ab<a data-link='address'>address</a>yz")});
  it('img', function(){assert.deepEqual(id.htmlEncode([
    {kind: "text",body: "ab"},
    [{kind: "text",body: "img address"}],
    {kind: "text",body: "yz"},
  ]
  ),"ab<img src='address' />yz")});


});
