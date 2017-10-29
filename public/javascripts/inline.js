window.addEventListener('load', function(){

// GET request
function xhr(url, f){
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", url);
  xmlhttp.onreadystatechange = function(){
    if(xmlhttp.readyState == 4){
      if(xmlhttp.status == 200){
        var obj = JSON.parse(xmlhttp.responseText);
        if(f){f(obj)}
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

xhr('/data/58e077519b21dc02814006d8', function(o){
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
  },100);

});

var preText;
setInterval(function(){
  var list = dumpList();
  var text = list.join("\n")

  if(text != preText){
    console.log("text diff!");
    xhrPut('/data/58e077519b21dc02814006d8',function(){
      preText= text;
    }, {body: text});
  }

},1000);


});
