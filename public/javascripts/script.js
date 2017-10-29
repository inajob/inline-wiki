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

function $(n){
  return document.getElementById(n);
}

xhr('/data/58e077519b21dc02814006d8', function(o){
  console.log(o);
  $('contents').innerText = o.body;
});


});
