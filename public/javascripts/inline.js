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
      }else{
        errf();
      }
    }
  };
  xmlhttp.send();
}
// POST request
function xhrPost(url, f, errf){
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("POST", url);
  xmlhttp.onreadystatechange = function(){
    if(xmlhttp.readyState == 4){
      if(xmlhttp.status == 200){
        try{
          var obj = JSON.parse(xmlhttp.responseText);
          if(f){f(obj)}
        }catch(e){
          errf();
        }
      }else{
        errf();
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
      }else if(xmlhttp.status == 403){
        // Todo: login required!
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

//if(opts["mode"] && opts["mode"] == "edit"){
//  // todo: require editor.js
//  setTimeout(function(){
//    store.dispatch({type: "EDITABLE"});
//  }, 1000);
//}

if(opts["title"]){
  // load

  xhr('/file/items/' + opts["title"], function(o){
    var s = o.body;
 
    // todo: require editor.js
    setTimeout(function(){
      var tmpList = loadList(s.split(/[\r\n]/));
      for(var i = 0; i < tmpList.length; i ++){
        store.dispatch({type: "APPEND", text: tmpList[i]});
        preview(store.getState().cursor - 1, tmpList[i]);
      }
      store.dispatch({type: "FOCUS", no: 0});
      store.dispatch({type: "SETTITLE", title: decodeURIComponent(opts["title"])});

      xhr('/file/list', function(o){
        store.dispatch({type: "UPDATE_LIST", list: o.list});
      }, function(){});

    },100);
  
  }, function(){
    if(confirm("This page seems to be empty, create new page?")){
      //
      store.dispatch({type: "APPEND", text: "not-found"});
      store.dispatch({type: "FOCUS", no: 0});
      store.dispatch({type: "SETTITLE", title: decodeURIComponent(opts["title"])});
    }else{
      //
      opts["title"] = "";
    }
  });

  var preText;
  var firstSync = true;
  setInterval(function(){
    var list = dumpList();
    var text = list.join("\n")
  
    if(text != preText && firstSync == false){
      console.log("text diff!");
      xhrPut('/file/items/' + opts["title"],function(){
        preText= text;
      }, {title: decodeURIComponent(opts["title"]), body: text});
    }

    if(firstSync){
      firstSync = false;
      preText = text;
    }
  
  },1000);

  xhrPost('/loginCheck', function(o){
    console.log("loginCheck", o);
    if(o['isLogin'] == true){
      setTimeout(function(){
        store.dispatch({type: "EDITABLE"});
      }, 1000);
    }
  });
}


});
