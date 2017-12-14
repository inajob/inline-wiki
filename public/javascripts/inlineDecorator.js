var inlineDecorator = (function(){
  var exports = {};
  /*
  {{link url}}
  {{img img}}
  */

  function newPiece(s){
    return {kind:"text", body: s};
  }

  function parse(body){
    var pos = 0;
    function inner(level){
      var out = [];
      while(true){
        var index = body.indexOf("{{", pos);
        var index2 = body.indexOf("}}", pos);
        if((index != -1 && index2 != -1 && index < index2) || (index != -1 && index2 == -1)){
          out.push(newPiece(body.slice(pos, index)));
          pos = index + "{{".length;
          out.push(inner(level + 1));
        }else if((index2 != -1 && index != -1 && index2 < index) || (index == -1 && index2 != -1)){
          out.push(newPiece(body.slice(pos, index2)));
          pos = index2 + "}}".length;
          if(level > 0){
            break;
          }
        }else{
          out.push(newPiece(body.slice(pos, body.length)));
          pos = body.length;
          break;
        }
      }
      return out;
    };
    return inner(0);
  }

  function htmlEncode(body){
    var out = [];
    var tmp;
    var list;
    var cmd;
    body.forEach(function(v){
      if(Array.isArray(v)){
        console.log("in");
        tmp = htmlEncode(v);
        list = tmp.split(/\s+/, 2);
        console.log(list)
        cmd = list[0];
        switch(cmd){
          case "link":
            out.push("<a data-link='" +encodeURIComponent(list[1])+ "'>")
            out.push(list[1]);
            out.push("</a>")
          break;
          case "img":
            out.push("<img src='")
            out.push(list[1].replace("'", ""));
            out.push("' />")
          break;
          default:
            out.push("{{")
            out.push(tmp);
            out.push("}}")
        }
      }
      out.push(v.body);
    });
    return out.join("");
  }

  exports.parse = parse;
  exports.htmlEncode = htmlEncode;
  return exports;
})();
if(typeof module !== "undefined"){
  module.exports = inlineDecorator;
}
