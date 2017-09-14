window.addEventListener('load', function(){

var preValue = "";

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

function save(){
  var value = $('text').value;
  if(value != preValue){
    $('status').innerHTML = "save request..";
    xhrPut('/data/58e077519b21dc02814006d8',function(){
      $('status').innerHTML = "saved";
      preValue = value;
    }, {body:value});
  }else{
    $('status').innerHTML = "not changed";
  }
}

var timerID = null;

$('text').addEventListener('keyup', function(){
  if(timerID != null){
    clearTimeout(timerID);
    timerID = null;
  }
  timerID = setTimeout(save, 1000);
  $('status').innerHTML = "save pending..";
  console.log("keyup", this);
});

$('savebtn').addEventListener('click', function(){
  console.log("save");
  xhrPut('/data/58e077519b21dc02814006d8',function(){console.log("ok")}, {body:$('text').value});
});

xhr('/data/58e077519b21dc02814006d8', function(o){
  console.log(o);
  $('text').value = o.body;
  preValue = o.body;
});


});
