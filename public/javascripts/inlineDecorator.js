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
    var cmd,remain;
    body.forEach(function(v){
      if(Array.isArray(v)){
        console.log("in");
        tmp = htmlEncode(v);
        list = tmp.split(/\s+/, 2);
        //console.log(list,tmp)
        //cmd = list[0];
        //remain = tmp;

        var m = tmp.match(/\s+/);
        if(m){
          var delimiter = m[0];
          cmd = tmp.slice(0, m.index);
        }else{
          cmd = "";
        }
        console.log(m,cmd,remain);

        switch(cmd){
          case "link":
            list = tmp.split(/(\s+)/);
            out.push("<span class='tiny'>{{link </span>");
            out.push("<a data-link='" +encodeURIComponent(list[2])+ "'>");
            if(list.length == 3){ // {{link target}}
              out.push(list[2]);
            }else if(list.length > 4){ // {link target body}}
              remain = tmp.slice((list[0] + list[1] + list[2] + list[3]).length);
              out.push(remain);
            }
            out.push("</a>")
            out.push("<span class='tiny'>}}</span>");
          break;
          case "img":
            remain = tmp.slice(m.index + delimiter.length);
            out.push("<img src='")
            out.push(remain.replace("'", ""));
            out.push("' />")
            out.push("<span class='tiny'>{{img " + remain + "}}</span>");
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
