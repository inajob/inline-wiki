var chai = require('chai');
var assert = chai.assert;

var id = require("./inlineDecorator.js");

describe('capture', function(){
  it('空文字', function(){assert.deepEqual(id.capture("", [], 0),{pos: -1, target: ""})});
  it('1hit', function(){assert.deepEqual(id.capture("hoge(aaa", ["("], 0),{pos: 4, target: "("})});
  it('2hit', function(){assert.deepEqual(id.capture("ho=ge(aaa", ["(","="], 0),{pos: 2, target: "="})});
  it('offset', function(){assert.deepEqual(id.capture("hoge(fuga(", ["("], 5),{pos: 9, target: "("})});
});
describe('parse', function(){
  it('空文字', function(){assert.deepEqual(id.parse("", 0),[{kind: "text",body: ""}])});
  it('ただの文字列', function(){assert.deepEqual(id.parse("hoge", 0),[{kind: "text",body: "hoge"}])});
  it('タグ付き文字', function(){assert.deepEqual(id.parse("ab{{hoge}}yz", 0),[
    {kind: "text",body: "ab"},
    [{kind: "text",body: "hoge"}],
    {kind: "text",body: "yz"},
  ])});
  it('url', function(){assert.deepEqual(id.parse("hohttp://hoge.foo/ aa", 0),[{kind: "text",body: "ho"},{kind: "url",body: "http://hoge.foo/"},{kind: "text",body: " aa"}])});
  it('url', function(){assert.deepEqual(id.parse("http://", 0),[{kind: "url",body: "http://"}])});
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
  it('入れ子2', function(){assert.deepEqual(id.parse("ab{{link {{img http://hoge/a}} piyo}}yz", 0),[
    {kind: "text",body: "ab"},
    [
      {kind: "text",body: "link "},
      [{kind: "text",body: "img http://hoge/a"}],
      {kind: "text",body: " piyo"},
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
  it('url', function(){assert.deepEqual(id.htmlEncode([
    {kind: "text",body: "ab"},
    {kind: "url",body: "http://test.aaa"},
    {kind: "text",body: "yz"},
  ]
  ),"ab<a href='http://test.aaa'>http://test.aaa</a><a href='http://b.hatena.ne.jp/entry/http://test.aaa' target='_blank'><img src='http://b.hatena.ne.jp/entry/image/http://test.aaa' /></a>yz")});
  it('link', function(){assert.deepEqual(id.htmlEncode([
    {kind: "text",body: "ab"},
    [{kind: "text",body: "link address"}],
    {kind: "text",body: "yz"},
  ]
  ),"ab<span class='tiny'>{{link </span><a data-link='address'>address</a><span class='tiny'>}}</span>yz")});
  it('img', function(){assert.deepEqual(id.htmlEncode([
    {kind: "text",body: "ab"},
    [{kind: "text",body: "img address"}],
    {kind: "text",body: "yz"},
  ]
  ),"ab<img src='address' /><span class='tiny'>{{img address}}</span>yz")});

  it('link + img', function(){assert.deepEqual(id.htmlEncode([
    {kind: "text",body: "ab"},
    [
      {kind: "text",body: "link hoge "},
      [{kind: "text",body: "img address"}]
    ],
    {kind: "text",body: "yz"},
  ]
  ),"ab<span class='tiny'>{{link </span><a data-link='hoge'><img src='address' /><span class='tiny'>{{img address}}</span></a><span class='tiny'>}}</span>yz")});


});
