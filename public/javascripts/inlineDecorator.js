var inlineDecorator = (function(){
  var exports = {};
  /*
  {{link url}}
  {{img img}}
  */

  function newPiece(kind, s){
    return {kind: kind, body: s};
  }

  function capture(body, targets, offset){
    var minPos = -1;
    var minTarget = "";
    targets.forEach(function(target){
      var index = body.indexOf(target, offset);
      if(index != -1){
        if(minPos == -1 || minPos > index){
          minPos = index;
          minTarget = target;
        }
      }
    });
    return {pos: minPos, target: minTarget}
  }

  function parse(body){
    var pos = 0;
    var fMap = [
      {target: '{{', action: function(){

      }},
      {target: '}}', action: function(){

      }},
    ];
    function inner(level){
      var out = [];
      while(true){
        var cap;
        if(level == 0){
          cap = capture(body, ["{{","}}", "http://", "https://"], pos);
        }else{
          cap = capture(body, ["{{","}}"], pos);
        }
        if(cap.target == "{{"){
          out.push(newPiece("text", body.slice(pos, cap.pos)));
          pos = cap.pos + "{{".length;
          out.push(inner(level + 1));
        }else if(cap.target == "}}"){
          out.push(newPiece("text", body.slice(pos, cap.pos)));
          pos = cap.pos + "}}".length;
          if(level > 0){
            break;
          }
        }else if((cap.target=="https://" || cap.target == "http://")){
          if(pos != cap.pos){
            out.push(newPiece("text", body.slice(pos, cap.pos)));
          }
          var endPos = capture(body, [" ","\r", "\n"], pos + cap.target.length);
          if(endPos.pos != -1){
            out.push(newPiece("url", body.slice(cap.pos, endPos.pos)));
            pos = endPos.pos;
          }else{
            out.push(newPiece("url", body.slice(cap.pos, body.length)));
            pos = body.length;
            break;
          }
        }else{
          out.push(newPiece("text", body.slice(pos, body.length)));
          pos = body.length;
          break;
        }
      }
      return out;
    };
    return inner(0);
  }

  function htmlEncode(body, user){
    var out = [];
    var tmp;
    var list;
    var cmd,remain;
    body.forEach(function(v){
      if(Array.isArray(v)){
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

        switch(cmd){
          case "user":
            list = tmp.split(/(\s+)/);
            out.push("<span class='tiny'>{{user </span>");
            out.push("<a href='/view/" + encodeURIComponent(list[2]) + "'>");
            if(list.length == 3){ // {{link target}}
              out.push(list[2]);
            }else if(list.length > 4){ // {link target body}}
              remain = tmp.slice((list[0] + list[1] + list[2] + list[3]).length);
              out.push(remain);
            }
            out.push("</a>")
            out.push("<span class='tiny'>}}</span>");
          break;
          case "link":
            list = tmp.split(/(\s+)/);
            out.push("<span class='tiny'>{{link </span>");
            if(/^http(|s):\/\//.test(list[2])){
              // todo: escape html string
              out.push("<a href='" +(list[2])+ "'>");
            }else{
              out.push("<a data-link='" + encodeURIComponent(list[2]) + "'>");
            }
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
      }else{
        switch(v.kind){
          case "text":
            out.push(v.body);
            break;
          case "url":
            // todo: escape
            out.push("<a href='" +  v.body + "'>" + v.body + "</a>");
            break;
        }
      }
    });
    return out.join("");
  }

  exports.capture = capture;
  exports.parse = parse;
  exports.htmlEncode = htmlEncode;
  return exports;
})();
if(typeof module !== "undefined"){
  module.exports = inlineDecorator;
}
