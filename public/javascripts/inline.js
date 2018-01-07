window.addEventListener('load', function(){

// GET request
function xhr(url, f, errf){
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", url);
  xmlhttp.onreadystatechange = function(){
    if(xmlhttp.readyState == 4){
      if(xmlhttp.status == 200){
        try{
          var obj = JSON.parse(xmlhttp.responseText);
          if(f){f(obj)}
        }catch(e){
          errf();
        }
      }
    }
  };
  xmlhttp.send();
}
// PUT request
function xhrPut(url, f, obj){
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("PUT", url);
  xmlhttp.onreadystatechange = function(){
    if(xmlhttp.readyState == 4){
      if(xmlhttp.status == 200){
        var obj = JSON.parse(xmlhttp.responseText);
        if(f){f(obj)}
      }
    }
  };
  var bodyList = [];
  for(var x in obj){
    bodyList.push(encodeURIComponent(x) + '=' + encodeURIComponent(obj[x]));
  }
  xmlhttp.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
  xmlhttp.send(bodyList.join("&").replace(/%20/g, '+'));
}


function $(n){
  return document.getElementById(n);
}


var search = document.location.search;
var opts = {};
if(search){
  search = search.replace(/^\?/, "");
  search.split("&").forEach(function(v){
    var tmp = v.split("=");
    opts[tmp[0]] = tmp[1];
  });
  console.log("options",opts);
}

if(opts["mode"] && opts["mode"] == "edit"){
  // todo: require editor.js
  setTimeout(function(){
    store.dispatch({type: "EDITABLE"});
  }, 1000);
}

if(opts["title"]){
  // load

  xhr('/contents/' + opts["title"], function(o){
    console.log(o);
    var s = o.body;
    //$('contents').innerText = o.body;
 
    // todo: require editor.js
    setTimeout(function(){
      var tmpList = loadList(s.split(/[\r\n]/));
      for(var i = 0; i < tmpList.length; i ++){
        store.dispatch({type: "APPEND", text: tmpList[i]});
        preview(store.getState().cursor - 1, tmpList[i]);
      }
      store.dispatch({type: "FOCUS", no: 0});
      store.dispatch({type: "SETTITLE", title: opts["title"]});
    },100);
  
  }, function(){
    if(confirm("This page seems to be empty, create new page?")){
      //
      store.dispatch({type: "APPEND", text: "not-found"});
      store.dispatch({type: "FOCUS", no: 0});
      store.dispatch({type: "SETTITLE", title: opts["title"]});
    }else{
      //
      opts["title"] = "";
    }
  });

  var preText;
  setInterval(function(){
    var list = dumpList();
    var text = list.join("\n")
  
    if(text != preText){
      console.log("text diff!");
      xhrPut('/contents/' + opts["title"],function(){
        preText= text;
      }, {title: decodeURIComponent(opts["title"]), body: text});
    }
  
  },1000);
}


});
