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

if(document.location.pathname.indexOf("/view/") == 0){
  var tmp = document.location.pathname.split("/");
  opts['user'] = tmp[2];
  if(tmp[3]){
    opts['title'] = tmp[3];
  }
}

var loginUser = "";
var mTime = 0;

if(opts["title"] && opts["user"]){
  document.title = decodeURIComponent(opts["title"]);

  // load
  xhrPost('/file/items/' + opts['user'] + '/' + opts["title"], function(o){
    var s = o.body;
    mTime = o.mtime;
    // todo: require editor.js
    setTimeout(function(){
      store.dispatch({type: "SETTITLE", title: decodeURIComponent(opts["title"])});
      store.dispatch({type: "SETUSER", user: decodeURIComponent(opts["user"])});

      var tmpList = loadList(s.split(/[\r\n]/));
      for(var i = 0; i < tmpList.length; i ++){
        store.dispatch({type: "APPEND", text: tmpList[i]});
        preview(store.getState().cursor - 1, tmpList[i]);
      }
      store.dispatch({type: "FOCUS", no: 0});
    },1);
  
  }, function(){
    // error 
    setTimeout(function(){ // todo: login Info wait
      if(loginUser && opts["user"] == loginUser){
        if(confirm("This page seems to be empty, create new page?")){
          //
          store.dispatch({type: "APPEND", text: "not-found"});
          store.dispatch({type: "FOCUS", no: 0});
          store.dispatch({type: "SETTITLE", title: decodeURIComponent(opts["title"])});
          store.dispatch({type: "SETUSER", user: decodeURIComponent(loginUser)});
        }else{
          //
          opts["title"] = "";
          store.dispatch({type: "SETTITLE", title: "NOT FOUND"});
        }
      }else{
        // not found
        store.dispatch({type: "SETTITLE", title: "NOT FOUND"});
      }
    },500);
  });

  xhrPost('/file/items/' + opts['user'] + '/menu', function(o){
    store.dispatch({type: "SETUSER", user: decodeURIComponent(opts["user"])});
    store.dispatch({type: "UPDATE_SIDEBAR", sideData: loadList(o.body.split(/[\r\n]/))})
  });
  

  var preText;
  var firstSync = true;
  setInterval(function(){
    var list = dumpList();
    var text = list.join("\n")
  
    if(text != preText && firstSync == false){
      console.log("text diff!");
      store.dispatch({type: "UPDATE_STATUS", status: "saving.."});
      xhrPut('/file/items/' + loginUser + '/' + opts["title"],function(o){
        if(o['status'] == "ok"){
          mTime = o['mtime'];
          preText= text;
          store.dispatch({type: "UPDATE_STATUS", status: "synced!"});
        }else{
          // todo: prepare alert view
          //alert("conflict" + mTime + " vs " + o['mtime']);
          store.dispatch({type: "UPDATE_STATUS", status: "conflict!"});
        }
      }, {title: decodeURIComponent(opts["title"]), body: text, mtime: mTime});
    }
    if(firstSync){
      firstSync = false;
      preText = text;
    }
  },5000);

  xhrPost('/loginCheck', function(o){
    console.log("loginCheck", o);
    if(o['isLogin'] == true){
      loginUser = o['user'];
      setTimeout(function(){
        store.dispatch({type: "EDITABLE"});
      }, 100);
    }
  });
}else if(opts["user"]){
  xhrPost('/file/list/' + opts['user'] + '', function(o){
    store.dispatch({type: "UPDATE_LIST", list: o.list});

    var tmpList = o.list;
    var tmp;
    setTimeout(function(){
      for(var i = 0; i < tmpList.length; i ++){
        tmp = "- {{link " + decodeURIComponent(tmpList[i]) + "}}";
        store.dispatch({type: "APPEND", text: tmp});
        preview(store.getState().cursor - 1, tmp);
      }
      store.dispatch({type: "FOCUS", no: 0});
      store.dispatch({type: "SETTITLE", title: opts["user"] + " PAGE LIST"});
        store.dispatch({type: "SETUSER", user: decodeURIComponent(opts["user"])});
    },100);
  }, function(){});
}else{
  xhrPost('/file/user_list', function(o){
    var tmpList = o.list;
    var tmp;
    setTimeout(function(){
      for(var i = 0; i < tmpList.length; i ++){
        tmp = "- {{user " + tmpList[i] + "}}";
        store.dispatch({type: "APPEND", text: tmp});
        preview(store.getState().cursor - 1, tmp);
      }
      store.dispatch({type: "FOCUS", no: 0});
      store.dispatch({type: "SETTITLE", title: "USER LIST"});
    },100);
  },function(){});
}

document.addEventListener("keydown", function(e){
  var capture = false;
  switch(e.keyCode){
    case 38: // up
      if(store.getState().dialogList.length != 0){
        capture = true;
        store.dispatch({type: "DIALOG_UP"});
      }
    break;
    case 40: // down
      if(store.getState().dialogList.length != 0){
        capture = true;
        store.dispatch({type: "DIALOG_DOWN"});
      }
    break;
    case 27: // esc
      if(store.getState().dialogList.length != 0){
        capture = true;
        store.dispatch({type: "DIALOG", dialog: false});
        store.dispatch({type: "DIALOG_LIST", dialogList: []});
      }
      break;
    case 13: // enter
      if(store.getState().dialogList.length != 0){
        capture = true;
        dialogEnter();
      }
      break;
  }
  if(capture == true){
    e.preventDefault();
  }
});

});
