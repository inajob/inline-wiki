// text/babel

MathJax.Hub.Config({ tex2jax: { inlineMath: [['$','$']] } });
mermaid.initialize({startOnLoad: true, theme: 'forest'});

 /*
[x] enterで行を分割する
[x] backspaceで行を結合する
[ ] 複数行ペースト時
[ ] データのロード
[N/A] ブロックが閉じられていないとき
[x] ブロックが途中で解除されたとき
[ ] ブロックの途中でブロックが閉じられたとき（サポートする？）
[x] tabの押下
[x] shift+tabの押下
[ ] 境界での左右キー
[x] 新規行にフォーカスが当たらない
[x] 空行の高さがない
[x] 最も最後のブロックから抜け出す
[x] 箇条書き対応
  [x] 箇条書きのレンダリング
  [x] 箇条書きの改行時にインデントを維持する
[x] マウスクリックで編集業の移動
[ ] 複数行でシンタックスハイライトなど
[x] タグが入ったときの対応
 */

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

function jsonp(name, src, f){
  window[name] = function(data){
    f(data);
  }
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.async = true;
  script.src = src;
  document.body.appendChild(script);
}

function blockToHTML(blockType, body, no, previewAction){
  switch(blockType){
    case "code":
      return '<pre class="hljs">' + hljs.fixMarkup(hljs.highlightAuto(body).value) + '</pre>';
    case "image":
        return '<img class="paste" alt="' + body + '" src="' + body + '" />';
    case "oembed":
      // "http://api.embed.ly/1/oembed?key="+inajob.key.embedly+"&url="+encodeURIComponent(tmp[0])+'&callback=?'
      // https://api.twitter.com/1/statuses/oembed.json?url=&callback=?

      var name = "callback_" + Math.random().toString(36).slice(-8);
      console.log(body);
      var url;
      url = "https://noembed.com/embed";
      if(body.indexOf("https://twitter.com") != -1){
        url = "https://api.twitter.com/1/statuses/oembed.json";
      }

      url += "?url="+encodeURIComponent(body.replace(/[\r\n]/g,""))+'&callback=' + name;

      if(url){
        jsonp(name, url, function(data){
          //
          console.log(data);
          var body = '<span class="block-type">&gt;&gt; oembed</span><br/>' + data.html + '<br/><span class="block-type">&lt;&lt; by noembed.com</span>';
          store.dispatch({type: previewAction, no: no, preview: body});
          twttr.widgets.load()
        });
      }
      return "oembed... " + body;
    case "list":
      var list = store.getState().list;
      var conditions = body.split(/[\r\n]/).slice(1);
      var convert = function(s){
        var ret = null;
        conditions.forEach(function(c){
          if(c.length == 0){
            return;
          }
          if(c == "*"){
            ret = {trimmed: decodeURIComponent(s), raw: s};
            return;
          }
          if(decodeURIComponent(s).indexOf(c) == 0){
            ret = {trimmed: decodeURIComponent(s).slice(c.length), raw: s};
            return;
          }
        });
        return ret;
      };
      var filter = function(e){return e != null;}
      var itemize = function(e){
        return '<li><a href="/view/' + encodeURIComponent(store.getState().user) + '/' + e.raw + '">' + e.trimmed + '</a></li>';
      };
      var makeBody = function(contents){
        return '<span class="block-type">&gt;&gt; list</span><div class="file-list">' + contents + '</div><span class="block-type">&lt;&lt;</span>';
      };
      if(list.length == 0){
        xhr('/file/list/' + store.getState().user, function(o){
          var list = o.list.map(convert).filter(filter).map(itemize).join("\n");
          store.dispatch({type: previewAction, no: no, preview: makeBody(list)});
        }, function(){});
      }else{
        setTimeout(function(){
          list = list.map(convert).filter(filter).map(itemize).join("\n");
          store.dispatch({type: previewAction, no: no, preview: makeBody(list)});
        },10);
      }
      return "loading...";
    case "mermaid":
      var elm = document.createElement("div");
      elm.innerHTML = body;
      document.body.appendChild(elm);
      try{
        mermaid.parse(body);
        var render = "";
        mermaid.init(undefined, elm, function(){
          render = elm.innerHTML;
        });
        document.body.removeChild(elm);
        return render;
      }catch(e){
        console.log(e);
        return e.str;
      }
      return "error";
    case "tex":
        var elm = document.createElement("div");
        elm.innerHTML = body;
        // mathjs doesn't render if don't insert the element.
        document.getElementById("math").appendChild(elm);
        console.log(body);
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, elm], function(){
          console.log("preview",elm);
          var body = '<span class="block-type">&gt;&gt; tex</span><br/>' + elm.innerHTML + '<br/><span class="block-type">&lt;&lt;</span>';

          store.dispatch({type: previewAction, no: no, preview: body});
          // mathjs doesn't render if don't insert the element.
          document.getElementById("math").removeChild(elm);
        });
        return "rendering..";
    case "table":
      var ret = "";
      ret += "<table>";
      body.split(/[\r\n]+/).slice(1).forEach(function(i){
        ret += "<tr>";
        i.split(",").forEach(function(j){
          ret += "<td>";
          ret += escapeHTML(j);
          ret += "</td>";
        });
        ret += "</tr>";
      });
      ret += "</table>";
      return ret;
      break;
    default:
        return body;
  }
}

function escapeHTML(s){
  return inlineDecorator.htmlEncode(inlineDecorator.parse(s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")));
  //return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// convert 1 line string to html decorate string
function inline(s, no, previewAction){
  var m;
  if(s.indexOf("###") == 0){
    return '<div>' + '<span class="small">###</span>' + escapeHTML(s.substring(3)) + "</div>";
  }else if(s.indexOf("##")==0){
    return '<div>' + '<span class="small">##</span>' + escapeHTML(s.substring(2)) + "</div>";
  }else if(s.indexOf("#")==0){
    return '<div>' + '<span class="small">#</span>' + escapeHTML(s.substring(1)) + "</div>";
  }else if(s.indexOf(">>") == 0){
    var blockType = getBlockType(s);
    var body = s.substring(s.search(/[\r\n]/));
    if(body == undefined){
      body = "";
    }
    var html = blockToHTML(blockType, body, no, previewAction);

    return '<span class="block-type">&gt;&gt; ' + escapeHTML(blockType) + "</span><div>" + html + '</div><span class="block-type">&lt;&lt;</span>';
  }else if(m = s.match(/^(\s*)(-+)/)){
    var spaces = m[0].length;
    var minuses = m[1].length;
    var nest = spaces + minuses;
    var ret = '';
    ret += '<span class="list-pre">' + s.substring(0, nest - 1) + '</span>';
    ret += '<span class="list">' + s.substring(nest - 1, nest) + '</span>';
    ret += escapeHTML(s.substring(nest)) + "";
    return ret;
  }else if(s.length == 0){
    return "--- blank ---";
  }else{
    return escapeHTML(s);
  }
}
function calcClass(s){
  var ret = "";
  if(s.indexOf("###") == 0){
    ret = "h3";
  }else if(s.indexOf("##")==0){
    ret = "h2";
  }else if(s.indexOf("#")==0){
    ret = "h1";
  }else if(s.indexOf(">>") == 0){
    ret = "block-type";
  }else if(s.match(/^(\s*)(-+)/)){
    ret = "normal";
  }else if(s.length == 0){
    ret = "blank";
  }else{
    ret = "normal";
  }
  return ret;
}

// is this not block?
function isInline(s){
  return s.indexOf(">>") != 0;
}
function isBlock(s){
  return !isInline(s);
}
// is this list?
function isList(s){
  return s.indexOf("-") == 0;
}
// get list nest level
function getListNest(s){
  var ret = -1;
  if(isList(s)){
    ret = s.match(/^-*/)[0].length;
  }
  return ret;
}
// get list nest '-' literature
function getListNestString(s){
  var ret = "";
  for(var i = 0; i < getListNest(s); i ++){
    ret += "-";
  }
  return ret + " ";
}

// get block type
function getBlockType(s){
  var head = s.split(/[\r\n]/,2)[0];
  if(head == undefined){return "unknown";}
  return head.replace(/>>\s+/, '');
}
// for style
function display(s){
  if(s){return "block"}else{return "none"}
}
// sのindex番目がx,yで何番目か調べる
function getPos(index, s){
  var list = s.split(/[\r\n]/);
  var ret = 0;
  var pos = 0;
  var i;
  for(i = 0; i < list.length; i ++){
    pos += list[i].length + 1;
    if(pos > index){
      return [index - (pos - list[i].length - 1), i]
    }
  }
  console.log("error getPos")
}
// get number of lines
function numLines(s){
  return s.split(/[\r\n]/).length
}

function findLink(elm){
  while(true){
    if(elm.dataset.link){
      return elm.dataset.link;
    }
    elm = elm.parentNode;
    if(elm.className == "full"){
      break;
    }
  }
  return null;
}

var Dialog = React.createClass({
  getInitialState(){ return {}; },
  componentDidMount: function(){
    this.focus();
  },
  componentDidUpdate: function(){
    var target = this.refs["item" + this.props.dialogCursor];
    if(target){
      var pos = target.getBoundingClientRect().top;
      scrollTo(scrollX, pos + scrollY);
    }
  },
  dialogKeyHandler: function(e){
    if(e.keyCode == 13){ // enter
      // todo: temporary
      switch(this.refs.service.value){
        case "amz":
          jsonp("amazon", "http://inajob.dip.jp/twlogin/amz.php?callback=amazon&q=" + encodeURIComponent(this.refs.query.value), function(data){
          var list = [];
          data.forEach(function(e){
            list.push({
              url: e.link?e.link[0]:"",
              title: e.title?e.title[0]:"",
              img: e.mimage?e.mimage[0]:""
            });
          });
          store.dispatch({type:"DIALOG_LIST", dialogList: list});
        });
        break;
        case "ali":
          jsonp("aliexpress", "http://web.inajob.tk/ali-search/api.php?callback=aliexpress&q=" + encodeURIComponent(this.refs.query.value), function(data){
          var list = [];
          data.items.forEach(function(e){
            list.push({
              url: e.promotionUrl,
              title: e.productTitle.replace(/<[^>]*>/g,""),
              img: e.imageUrl + "_220x220.jpg"
            });
          });
          store.dispatch({type:"DIALOG_LIST", dialogList: list});
        });
        break;
      }
    }else if(e.keyCode == 27){ // esc -> cancel
      store.dispatch({type:"DIALOG", dialog: false});
      store.dispatch({type: "DIALOG_LIST", dialogList: []});
    }
  },
  render() {
    return (
      <div className="dialog">
        dialog{this.props.dialogCursor}
        {(()=>{
        if(this.props.items.length == 0){
          return <div>
            <select ref="service" size="5">
              <option value="amz" selected>amazon</option>
              <option value="ali">aliexpress</option>
            </select>
            <input type="text" ref="query" onKeyDown={this.dialogKeyHandler} />
          </div>
        }
        })()}
        <div>
        {(()=>{
          return this.props.items.map((data,i) => <li key={i} ref={"item"+i} style={{border: (i == this.props.dialogCursor?"solid":"none")}}>{data.title} <img src={data.img} /></li>)
        })()}
        </div>
      </div>
    );
  },
  focus: function(){ this.refs.query.focus(); }
});

var Line = React.createClass({
  getInitialState(){ return {height: "1em"}; },
  componentWillReceiveProps(nextProps){ this.setState({height: numLines(nextProps.raw) + "em"}) },
  componentDidMount: function(){
    if(this.props.isRaw){ this.focus(); }
  },
  componentDidUpdate: function(){
    if(this.props.isRaw){ this.focus(); }
  },
  clickHandler:function(e){
    var link = findLink(e.target);
    if(link){
      document.location.href = "/view/"+ encodeURIComponent(this.props.user) +"/" + link;
    }else{
      store.dispatch({type:"FOCUS", no: this.props.lineNo});
    }
  },
  marge: function(a,b){
    for(var x in b){ a[x] = b[x]; }
    return a;
  },
  getEditElm: function(){
    if(isInline(this.props.raw)){
      return <div>
        <textarea className={calcClass(this.props.raw)} style={{height: this.state.height}} ref="rawInput" value={this.props.raw} onChange={this.props.changeText} onKeyDown={this.props.keyHandler} />
      </div>
    }else{ // not inline
      switch(getBlockType(this.props.raw)){
        case "image":
          return <div className="twin cf">
            <div className="half">
              <textarea className={calcClass(this.props.raw)} style={{height: this.state.height}} ref="rawInput" value={">> image\n[binary-image-data]"} onChange={this.props.changeText} onKeyDown={this.props.keyHandler} />
            </div>
            <div className="half" dangerouslySetInnerHTML={{__html: this.props.preview}}>
            </div>
          </div>

        default:
          return <div className="twin cf">
            <div className="half">
              <textarea className={calcClass(this.props.raw)} style={{height: this.state.height}} ref="rawInput" value={this.props.raw} onChange={this.props.changeText} onKeyDown={this.props.keyHandler} />
            </div>
            <div className="half" dangerouslySetInnerHTML={{__html: this.props.preview}}>
            </div>
          </div>
      }

    }
  },
  render() {
    return (
      <div className="full" ref="wrap">
        <div className={`render ${calcClass(this.props.raw)}`} style={{display: display(!this.props.isRaw)}} dangerouslySetInnerHTML={{__html:this.props.preview}} onClick={this.clickHandler} />
        <div className="raw" style={{display: display(this.props.isRaw)}}>
          {this.getEditElm()}
        </div>
      </div>
    );
  },
  focus: function(){ this.refs.rawInput.focus(); }
});

function preview(no, raw){
  var line = inline(raw, no, "PREVIEW");
  store.dispatch({type: "PREVIEW", no: no, preview: line});
}

var Lines = React.createClass({
  actionCreate: function(action, offset){
    offset = offset || 0; // if you change multiple lines in one function call, set offset to preview correct lines
    var cursor = this.props.cursor + offset;
    store.dispatch(action);
    var line;
    // preview
    switch(action.type){
      case "CHANGETEXT":
      case "LIST":
      case "UNLIST":
        line = store.getState().data[cursor].raw;
        preview(cursor, line)
        break;
      case "SPLIT":
        line = store.getState().data[cursor].raw;
        preview(cursor, line)
        line = store.getState().data[cursor + 1].raw;
        preview(cursor + 1, line)
        break;
      case "JOIN":
        line = store.getState().data[cursor - 1].raw;
        preview(cursor - 1, line)
        break;
    }
  },
  changeText:function(e) {
    var text = e.target.value;

    if(isInline(text) && numLines(text) > 1){
      console.log(text, isInline(text), numLines(text) > 1)
      var list = text.split(/[\r\n]/);
      var tmpList = loadList(list);

      for(var i = 0; i < tmpList.length - 1; i ++){
        // todo: type INSRET
        this.actionCreate({type: "SPLIT",
          first: tmpList[i],
          second: tmpList[i + 1],
        }, i);
      }
    }else{
      this.actionCreate({type: "CHANGETEXT", text: text});
    }
  },
  keyHandler:function(e) {
    var cursor = this.props.cursor;
    var ret = true;
    var cursorPos = getPos(e.target.selectionStart, e.target.value);
    var text = this.props.data[this.props.cursor].raw;
    var num = numLines(text);
    //console.log("keyCode",e.keyCode,e.shiftKey);
    switch(e.keyCode){
      case 9: // tab
        if(isInline(text)){
          ret = false;
          if(e.shiftKey){
            this.actionCreate({type: "UNLIST"});
          }else{
            this.actionCreate({type: "LIST"});
          }
        }
        break;
      case 8: // bs
        // image binary delete
        if(!isInline(text) && getBlockType(text) == "image"){
          ret = false;
          this.actionCreate({type:"CHANGETEXT", text: ""});
        }else if(cursorPos[0] == 0 && cursorPos[1] == 0){
          if(e.target.selectionStart != e.target.selectionEnd){
            ret = true;
          }else{
            ret = false;
            this.actionCreate({type:"JOIN"});
          }
        }
        break;
      case 37: //left
        if(e.target.selectionStart == 0){
          console.log("most left & push left");
          this.actionCreate({type: "UP"});
          ret = false;
        }
        break;
      case 39: //right
        if(e.target.selectionStart == text.length){
          console.log("most right & push right");
          this.actionCreate({type: "DOWN"});
          ret = false;
        }
        break;
      case 38: // up
        if(isInline(text) && num == 1 || num >= 1 && cursorPos[1] == 0){
          ret = false;
          this.actionCreate({type: "UP"});
        }
        break;
      case 40: // down
        if(isInline(text) && num == 1 || num >= 1 && cursorPos[1] == num - 1){
          ret = false;
          this.actionCreate({type: "DOWN"});
        }
        break;
      case 13: // enter
        // enterをキャンセルする
        if(isInline(text)){
          ret = false
          if(e.shiftKey){ // Shift + Enter
            var query = text.substr(e.target.selectionStart, e.target.selectionEnd);
            this.actionCreate({type: "DIALOG",dialog: true});
          }else{
            if(isList(text)){
              this.actionCreate({type: "SPLIT", first: text.substr(0,e.target.selectionStart), second: getListNestString(text) + text.substr(e.target.selectionStart)});
            }else{
              this.actionCreate({type: "SPLIT", first: text.substr(0,e.target.selectionStart), second: text.substr(e.target.selectionStart)});
            }
          }
        }else{ // not inline
          if(e.shiftKey){ // shift + enter
            ret = false;
            this.actionCreate({type: "SPLIT", first: text, second: ""});
          }
        }
    }
    if(ret == false){
      e.preventDefault();
      return false;
    }
  },
  nil(){
    // pass
  },
  back(){
    history.back();
  },
  junk(){
    var d = new Date();
    var title = "/diary/"+d.getFullYear() + '-' + ("0" + (d.getMonth() + 1)).slice(-2) + '-' +
      ("0" + d.getDate()).slice(-2) + '-' +
      ("0" + d.getHours()).slice(-2) +
      ("0" + d.getMinutes()).slice(-2) +
      ("0" + d.getSeconds()).slice(-2);
    document.location.href = "/view/" + encodeURIComponent(this.props.user) + '/' + encodeURIComponent(title);
  },
  newPage(){
    var title = prompt("input page name");
    if(title){
      document.location.href = "/view/" + encodeURIComponent(this.props.user) + "/" + encodeURIComponent(title);
    }
  },
  render() {
    var listNumber = this.props.data.map((data,i) => <Line key={i} lineNo={i} user={this.props.user} raw={data.raw} preview={data.preview} isRaw={!this.props.readOnly && i == this.props.cursor} changeText={this.changeText} keyHandler={this.keyHandler} ref={"line" + i} />);
    var fileList = this.props.list.map((file, i) => <li key={i}><a href={"/view/" + encodeURIComponent(this.props.user) + "/"+ file}>{decodeURIComponent(file)}</a></li>);
    var sideBar = this.props.sideData.map((data,i) => <Line key={i} lineNo={i} user={this.props.user} raw={data.raw} preview={data.preview} isRaw={false} changeText={this.nil} keyHandler={this.nil} ref={"line" + i} />);

    var helloReact = <div className="text">
      <div className="status-bar">
        <span><a href="?">inline-wiki</a></span>
        <span>{this.props.status}</span>
        <span className="button" onClick={this.back}>back</span>
        <span className="button" onClick={this.junk}>junk</span>
        <span className="button" onClick={this.newPage}>new</span>
        {(() => {
          if(this.props.readOnly){
            return <span><a href={"/auth/twitter?redirect_title=" + encodeURIComponent(this.props.title) + "&redirect_user=" + encodeURIComponent(this.props.user)}>login</a></span>
          }else{
            // todo: logout
          }
        })()}

      </div>
      <div className="wiki-body">
        <h1 className="wiki-title">{this.props.title}</h1>
        {listNumber}

        {(() => {
        if(this.props.dialog){
          return <Dialog dialogCursor={this.props.dialogCursor} items={this.props.dialogList} />
        }
        })()}
      </div>
      <div className="debug-console">
        <div>title: {this.props.title}</div>
        <div>readOnly: {this.props.readOnly?"true":"false"}</div>
      </div>
      
      <div className="side-bar">
        <div style={{fontSize:"0.8em"}}>
        {sideBar}
        </div>
        <ul>
          {fileList}
        </ul>
      </div>

    </div>;

    return helloReact;
  }
});

var initialWiki = {
  title: "",
  user: "",
  readOnly: true,
  cursor: 0,
  status: "test",
  list: [],
  dialog: false,
  dialogCursor: 0,
  dialogList: [],
  sideData: [],
  data:[
  ]
}

var wiki = function(state, action) {
  if(!state){
    state = initialWiki;
    return state;
  }
  //console.log(action.type);
  switch(action.type){
    case "PREVIEW":
      var data = [];
      state.data.map((e,i) => {data[i] = e;});
      data[action.no] = {raw: state.data[action.no].raw, preview: action.preview};
      return {
        title: state.title,
        user: state.user,
        readOnly: state.readOnly,
        cursor: state.cursor,
        status: state.status,
        list: state.list,
        dialog: state.dialog,
        dialogCursor: state.dialogCursor,
        dialogList: state.dialogList,
        sideData: state.sideData,
        data: data
      };
    case "SIDE_PREVIEW":
      var data = [];
      state.sideData.map((e,i) => {data[i] = e;});
      data[action.no] = {raw: state.sideData[action.no].raw, preview: action.preview};
      return {
        title: state.title,
        user: state.user,
        readOnly: state.readOnly,
        cursor: state.cursor,
        status: state.status,
        list: state.list,
        dialog: state.dialog,
        dialogCursor: state.dialogCursor,
        dialogList: state.dialogList,
        sideData: data,
        data: state.data
      };
    case "SETTITLE":
      return {
        title: action.title,
        user: state.user,
        readOnly: state.readOnly,
        cursor: state.cursor,
        status: state.status,
        list: state.list,
        dialog: state.dialog,
        dialogCursor: state.dialogCursor,
        dialogList: state.dialogList,
        sideData: state.sideData,
        data: state.data
      };
    case "SETUSER":
      return {
        title: state.title,
        user: action.user,
        readOnly: state.readOnly,
        cursor: state.cursor,
        status: state.status,
        list: state.list,
        dialog: state.dialog,
        dialogCursor: state.dialogCursor,
        dialogList: state.dialogList,
        sideData: state.sideData,
        data: state.data
      };
 
    case "UPDATE_LIST":
      return {
        title: state.title,
        user: state.user,
        readOnly: state.readOnly,
        cursor: state.cursor,
        status: state.status,
        list: action.list,
        dialog: state.dialog,
        dialogCursor: state.dialogCursor,
        dialogList: state.dialogList,
        sideData: state.sideData,
        data: state.data
      };
    case "UPDATE_SIDEBAR":
      var data = [];
      action.sideData.map((e,i) => {data[i] = {raw: e, preview: inline(e, i, "SIDE_PREVIEW")};});

      return {
        title: state.title,
        user: state.user,
        readOnly: state.readOnly,
        cursor: state.cursor,
        status: state.status,
        list: state.list,
        dialog: state.dialog,
        dialogCursor: state.dialogCursor,
        dialogList: state.dialogList,
        sideData: data,
        data: state.data
      };
    case "UPDATE_STATUS":
      return {
        title: state.title,
        user: state.user,
        readOnly: state.readOnly,
        cursor: state.cursor,
        status: action.status,
        list: state.list,
        dialog: state.dialog,
        dialogCursor: state.dialogCursor,
        dialogList: state.dialogList,
        sideData: state.sideData,
        data: state.data
      };
    case "FOCUS":
      return {
        title: state.title,
        user: state.user,
        readOnly: state.readOnly,
        cursor: action.no,
        status: state.status,
        list: state.list,
        dialog: state.dialog,
        dialogCursor: state.dialogCursor,
        dialogList: state.dialogList,
        sideData: state.sideData,
        data: state.data
      };
    case "UP":
      if(state.cursor > 0){
        return {
          title: state.title,
          user: state.user,
          readOnly: state.readOnly,
          cursor: state.cursor - 1,
          status: state.status,
          list: state.list,
          dialog: state.dialog,
          dialogCursor: state.dialogCursor,
          dialogList: state.dialogList,
          sideData: state.sideData,
          data: state.data
        }
      }else{
        return state;
      }
      break;
    case "DOWN":
      if(state.cursor + 1 < state.data.length){
        return {
          title: state.title,
          user: state.user,
          readOnly: state.readOnly,
          cursor: state.cursor + 1,
          status: state.status,
          list: state.list,
          dialog: state.dialog,
          dialogCursor: state.dialogCursor,
          dialogList: state.dialogList,
          sideData: state.sideData,
          data: state.data
        }
      }else{
        return state;
      }
      break;
    case "CHANGETEXT":
      var data = [];
      state.data.map((e,i) => {data[i] = e;});
      if(data[state.cursor] == undefined){
        data[state.cursor] = {preview: ""};
      }
      data[state.cursor] = {raw: action.text, preview: data[state.cursor].preview};
      return {
          title: state.title,
          user: state.user,
          readOnly: state.readOnly,
          cursor: state.cursor,
          status: state.status,
          list: state.list,
          dialog: state.dialog,
          dialogCursor: state.dialogCursor,
          dialogList: state.dialogList,
          sideData: state.sideData,
          data: data
      }
    case "APPEND":
      var data = [];
      state.data.map((e,i) => {data[i] = e;});
      data.push({
        raw: action.text,
        preview: ""
      });
      return {
        title: state.title,
        user: state.user,
        readOnly: state.readOnly,
        cursor: state.cursor + 1,
        status: state.status,
        list: state.list,
        dialog: state.dialog,
        dialogCursor: state.dialogCursor,
        dialogList: state.dialogList,
        sideData: state.sideData,
        data: data
      }
    case "SPLIT":
      var data = [];
      state.data.map((e,i) => {data[i] = e;});
      data[state.cursor] = {raw: action.second, preview: ""};
      data.splice(state.cursor, 0, {raw: action.first, preview: ""});
      return {
        title: state.title,
        user: state.user,
        readOnly: state.readOnly,
        cursor: state.cursor + 1,
        status: state.status,
        list: state.list,
        dialog: state.dialog,
        dialogCursor: state.dialogCursor,
        dialogList: state.dialogList,
        sideData: state.sideData,
        data: data
      }
    case "JOIN":
      var data = [];
      state.data.map((e,i) => {data[i] = e;});
      data[state.cursor - 1] = {raw: data[state.cursor - 1].raw + data[state.cursor].raw , preview: ""};
      data.splice(state.cursor, 1);
      return {
        title: state.title,
        user: state.user,
        readOnly: state.readOnly,
        cursor: state.cursor - 1,
        status: state.status,
        list: state.list,
        dialog: state.dialog,
        dialogCursor: state.dialogCursor,
        dialogList: state.dialogList,
        sideData: state.sideData,
        data: data
      }
    case "LIST":
      var data = [];
      state.data.map((e,i) => {data[i] = e;});
      var tmp = data[state.cursor].raw;
      if(tmp.indexOf("-") == 0){
        tmp = data[state.cursor].raw.replace(/(-*)([^\-].*)/,"-$1$2");
      }else{
        tmp = "- " + tmp;
      }

      data[state.cursor] = {raw: tmp, preview: ""};
      return {
        title: state.title,
        user: state.user,
        readOnly: state.readOnly,
        cursor: state.cursor,
        status: state.status,
        list: state.list,
        dialog: state.dialog,
        dialogCursor: state.dialogCursor,
        dialogList: state.dialogList,
        sideData: state.sideData,
        data:data
      }
    case "UNLIST":
      var data = [];
      var tmp = state.data[state.cursor].raw;
      state.data.map((e,i) => {data[i] = e;});
      if(tmp.indexOf("-") == 0){
        var tmp = tmp.substring(1);
        if(tmp.indexOf(" ") == 0){ // delete indent space
          tmp = tmp.substring(1);
        }
        data[state.cursor] = {raw: tmp, preview: ""};
      }
      return {
        title: state.title,
        user: state.user,
        readOnly: state.readOnly,
        cursor: state.cursor,
        status: state.status,
        list: state.list,
        dialog: state.dialog,
        dialogCursor: state.dialogCursor,
        dialogList: state.dialogList,
        sideData: state.sideData,
        data:data
      }
    case "DIALOG":
      return {
        title: state.title,
        user: state.user,
        readOnly: action.dialog, // read only
        cursor: state.cursor,
        status: state.status,
        list: state.list,
        dialog: action.dialog,
        dialogCursor: state.dialogCursor,
        dialogList: state.dialogList,
        sideData: state.sideData,
        data: state.data
      };
    case "DIALOG_LIST":
      return {
        title: state.title,
        user: state.user,
        readOnly: state.readOnly,
        cursor: state.cursor,
        status: state.status,
        list: state.list,
        dialog: state.dialog,
        dialogCursor: state.dialogCursor,
        dialogList: action.dialogList,
        sideData: state.sideData,
        data: state.data
      };
    case "DIALOG_UP":
      return {
        title: state.title,
        user: state.user,
        readOnly: state.readOnly,
        cursor: state.cursor,
        status: state.status,
        list: state.list,
        dialog: state.dialog,
        dialogCursor: state.dialogCursor - 1,
        dialogList: state.dialogList,
        sideData: state.sideData,
        data: state.data
      };
    case "DIALOG_DOWN":
      return {
        title: state.title,
        user: state.user,
        readOnly: state.readOnly,
        cursor: state.cursor,
        status: state.status,
        list: state.list,
        dialog: state.dialog,
        dialogCursor: state.dialogCursor + 1,
        dialogList: state.dialogList,
        sideData: state.sideData,
        data: state.data
      };
    case "READONLY":
      return {
        title: state.title,
        user: state.user,
        readOnly: true,
        cursor: state.cursor,
        status: state.status,
        list: state.list,
        dialog: state.dialog,
        dialogCursor: state.dialogCursor,
        dialogList: state.dialogList,
        sideData: state.sideData,
        data: state.data
      };
    case "EDITABLE":
      return {
        title: state.title,
        user: state.user,
        readOnly: false,
        cursor: state.cursor,
        status: state.status,
        list: state.list,
        dialog: state.dialog,
        dialogCursor: state.dialogCursor,
        dialogList: state.dialogList,
        sideData: state.sideData,
        data: state.data
      };
    default:
      return state;
  }
}
var store = Redux.createStore(wiki);

var mapStateToProps = function(state){
  return {
    title: state.title,
    user: state.user,
    readOnly: state.readOnly,
    cursor: state.cursor,
    status: state.status,
    list: state.list,
    dialog: state.dialog,
    dialogCursor: state.dialogCursor,
    dialogList: state.dialogList,
    sideData: state.sideData,
    data: state.data,
  }
}
var connect = ReactRedux.connect;
var WikiContainer = connect(mapStateToProps)(Lines);

var Provider = ReactRedux.Provider;

var content = document.getElementById("content");
ReactDOM.render(<Provider store={store}><WikiContainer /></Provider>, content);

var loadTest = [
  "#headline1",
  "hoge",
  "#headline2",
  "aaa",
  "bbb",
  "ccc",
  "- item1",
  "- item2",
  "- item3",
  ">> code",
  "function hoge(){",
  "}",
  "<<",
  "end line",
];

function dialogEnter(){
  var item = store.getState().dialogList[store.getState().dialogCursor];
  store.dispatch({type: "DIALOG", dialog: false});
  var text = [">> table",
    item.title,
    "{{link " + item.url + " {{img " + item.img + "}}}}",
    ].join("\n");
  store.dispatch({type: "CHANGETEXT", text: text});
  store.dispatch({type: "DIALOG_LIST", dialogList: []});
  preview(store.getState().cursor, text);
}

function loadList(list){
  var M_NORMAL = 0;
  var M_BLOCK = 1;
  var mode = M_NORMAL;
  var ret = [];
  var block = [];
  list.forEach(function(v){
    switch(mode){
      case M_NORMAL:
        if(isBlock(v)){
          mode = M_BLOCK;
          block = [v];
          return;
        }
        ret.push(v);
      break;
      case M_BLOCK:
        if(v == "<<"){
          mode = M_NORMAL;
          ret.push(block.join("\n"));
          return;
        }
        block.push(v);
      break;
    }
  });
  if(mode == M_BLOCK){
    console.log("read error");
    ret.push(block.join("\n"));
  }
  return ret;
}
function dumpList(){
  var ret = [];
  var d = store.getState().data
  d.forEach(function(v){
    ret.push(v.raw);
    if(v.raw.indexOf(">>") != -1){
      ret.push("<<");
    }
  });
  return ret;
}

//setTimeout(function(){
//  var tmpList = loadList(loadTest);
//  for(var i = 0; i < tmpList.length; i ++){
//    store.dispatch({type: "APPEND", text: tmpList[i]});
//    preview(store.getState().cursor - 1, tmpList[i]);
//  }
//  store.dispatch({type: "FOCUS", no: 0});
//},100);


function setupPaste(){
  // --- only supports chrome/edge ---
  document.addEventListener("paste", function(event){
    console.log("paste");
    var items = (event.clipboardData || event.originalEvent.clipboardData).items;
    console.log(items.length);
    for(var i = 0; i < items.length; i ++){
      console.log(items[i]);
      if(items[i].type.indexOf("image") != -1){
        // find image
        console.log("capture image");
        var blob = items[i].getAsFile();
        console.log(blob)
        var reader = new FileReader();
        reader.onload = function(event){
          console.log("loaded");
          //console.log(event.target.result);
          var url = event.target.result;
          console.log("onload" + url.length + url.substring(0,10));
          var img = document.createElement("img");
          img.src = url;
          // todo: insert next line
          store.dispatch({type: "CHANGETEXT", text: ">> image\n"+ url});
          preview(store.getState().cursor, ">> image\n"+ url);
          console.log(img);
        }
        console.log("pre-loaded");
        reader.readAsDataURL(blob);
        return false;
      }
    }
    //event.preventDefault();
    return true;
  });
}
setupPaste();

