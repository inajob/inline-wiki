// text/babel

MathJax.Hub.Config({ tex2jax: { inlineMath: [['$','$']] } });

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

function blockToHTML(blockType, body, no){
  switch(blockType){
    case "code":
      return '<pre>' + hljs.fixMarkup(hljs.highlightAuto(body).value) + '</pre>';
    case "image":
        return '<img class="paste" alt="' + body + '" src="' + body + '" />';
    case "tex":
        var elm = document.createElement("div");
        elm.innerHTML = body;
        MathJax.Hub.Queue(function(){console.log("pre render")},["Typeset", MathJax.Hub, elm], function(){
          store.dispatch({type: "PREVIEW", no: no, preview: elm.innerHTML});
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
function inline(s, no){
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
    var html = blockToHTML(blockType, body, no);

    return '<span class="block-type">&gt;&gt; ' + escapeHTML(blockType) + "</span><br/>" + html + '<br/><span class="block-type">&lt;&lt;</span>';
  }else if(m = s.match(/^(\s*)(-+)/)){
    var spaces = m[0].length;
    var minuses = m[1].length;
    var nest = spaces + minuses;
    var ret = '<span class="list">' + s.substring(0, nest) + '</span>'  + escapeHTML(s.substring(nest)) + "";
    return ret;
  }else if(s.length == 0){
    return "--- blank ---";
  }else{
    return escapeHTML(s);
  }
}
// return style of textarea and render
function calcStyle(s){
  var style = {
    //"fontFamily": "monospace",
    "padding": "3px",
    "fontSize": "1em",
    "lineHeight": "1.2em",
  };
  if(s.indexOf("###") == 0){
    style['fontWeight'] = "bold";
    style['fontSize'] = "1em";
    style['border'] = "solid";
    style['borderWidth'] = "0px 0px 1px 0px";

  }else if(s.indexOf("##")==0){
    style['fontWeight'] = "bold";
    style['fontSize'] = "1.5em";
    style['backgroundColor'] = "#ddf";
    style['marginTop'] = "0.5em";
    style['marginBottom'] = "0.5em";

  }else if(s.indexOf("#")==0){
    style['border'] = "solid #aaf";
    style['borderWidth'] = "3px 3px 3px 20px";
    style['marginLeft'] = "-20px";
    style['fontSize'] = "2em";
    style['fontWeight'] = "bold";
    style['backgroundColor'] = "#ddf";
  }else if(s.indexOf(">>") == 0){
    style['backgroundColor'] = "#ffd";
    style['border'] = "dashed 3px black";
    style['lineHeight'] = "1em";
    style['marginTop'] = "1em";
    style['marginBottom'] = "1em";
  }else if(s.match(/^(\s*)(-+)/)){
    //style['padding'] = "0px";
  }else if(s.length == 0){
    style['color'] = "#aaa";
  }else{
    style['lineHeight'] = "1.2em";
    style['fontSize'] = "1em";
  }
  return style;
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
      // todo jump page
      console.log("link", link);
      //store.dispatch({type:"JUMP", page: e.target.dataset.link});
      document.location.href = "?mode=" + (store.getState().readOnly?"":"edit") + "&title=" + link;
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
        <textarea style={this.marge({height: this.state.height}, calcStyle(this.props.raw))} ref="rawInput" value={this.props.raw} onChange={this.props.changeText} onKeyDown={this.props.keyHandler} />
      </div>
    }else{ // not inline
      switch(getBlockType(this.props.raw)){
        case "image":
          return <div className="twin cf">
            <div className="half">
              <textarea style={this.marge({height: this.state.height}, calcStyle(this.props.raw))} ref="rawInput" value={">> image\n[binary-image-data]"} onChange={this.props.changeText} onKeyDown={this.props.keyHandler} />
            </div>
            <div className="half" dangerouslySetInnerHTML={{__html: this.props.preview}}>
            </div>
          </div>

        default:
          return <div className="twin cf">
            <div className="half">
              <textarea style={this.marge({height: this.state.height}, calcStyle(this.props.raw))} ref="rawInput" value={this.props.raw} onChange={this.props.changeText} onKeyDown={this.props.keyHandler} />
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
        <div className="render" style={this.marge({display: display(!this.props.isRaw)}, calcStyle(this.props.raw))} dangerouslySetInnerHTML={{__html:this.props.preview}} onClick={this.clickHandler} />
        <div className="raw" style={{display: display(this.props.isRaw)}}>
          {this.getEditElm()}
        </div>
      </div>
    );
  },
  focus: function(){ this.refs.rawInput.focus(); }
});

function preview(no, raw){
  var line = inline(raw, no);
  store.dispatch({type: "PREVIEW", no: no, preview: line});
}

var Lines = React.createClass({
  actionCreate: function(action){
    var cursor = this.props.cursor;
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
        text = text.replace(/[\r\n]/g, " ");
    }
    this.actionCreate({type: "CHANGETEXT", text: text});
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
          ret = false;
          this.actionCreate({type:"JOIN"});
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
            if(isList(text)){
              this.actionCreate({type: "SPLIT", first: text, second: getListNestString(text)});
            }else{
              this.actionCreate({type: "SPLIT", first: text.substr(0,e.target.selectionStart), second: text.substr(e.target.selectionStart)});
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
  render() {
    var listNumber = this.props.data.map((data,i) => <Line key={i} lineNo={i} raw={data.raw} preview={data.preview} isRaw={!this.props.readOnly && i == this.props.cursor} changeText={this.changeText} keyHandler={this.keyHandler} ref={"line" + i} />);
    var helloReact = <div className="text">
      <div className="status-bar">
        <span>inline-wiki</span>
        <span>status</span>
        <span>new</span>
      </div>
      <div className="wiki-body">
      {listNumber}
      </div>
      <div className="side-bar">
        side bar
        <ul>
          <li>test</li>
          <li>test</li>
          <li>test</li>
          <li>test</li>
          <li>test</li>
          <li>test</li>
          <li>test</li>
        </ul>
      </div>
    </div>;

    return helloReact;
  }
});

var initialWiki = {
  readOnly: true,
  cursor: 0,
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
        readOnly: state.readOnly,
        cursor: state.cursor,
        data: data
      };
    case "FOCUS":
      return {
        readOnly: state.readOnly,
        cursor: action.no,
        data: state.data
      };
    case "UP":
      if(state.cursor > 0){
        return {
          readOnly: state.readOnly,
          cursor: state.cursor - 1,
          data: state.data
        }
      }else{
        return state;
      }
      break;
    case "DOWN":
      if(state.cursor + 1 < state.data.length){
        return {
          readOnly: state.readOnly,
          cursor: state.cursor + 1,
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
          readOnly: state.readOnly,
          cursor: state.cursor,
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
        readOnly: state.readOnly,
        cursor: state.cursor + 1,
        data: data
      }
    case "SPLIT":
      var data = [];
      state.data.map((e,i) => {data[i] = e;});
      data[state.cursor] = {raw: action.second, preview: ""};
      data.splice(state.cursor, 0, {raw: action.first, preview: ""});
      return {
        readOnly: state.readOnly,
        cursor: state.cursor + 1,
        data: data
      }
    case "JOIN":
      var data = [];
      state.data.map((e,i) => {data[i] = e;});
      data[state.cursor - 1] = {raw: data[state.cursor - 1].raw + data[state.cursor].raw , preview: ""};
      data.splice(state.cursor, 1);
      return {
        readOnly: state.readOnly,
        cursor: state.cursor - 1,
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
        readOnly: state.readOnly,
        cursor: state.cursor,
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
        readOnly: state.readOnly,
        cursor: state.cursor,
        data:data
      }
    case "READONLY":
      return {
        readOnly: true,
        cursor: state.cursor,
        data:data
      };
    case "EDITABLE":
      return {
        readOnly: false,
        cursor: state.cursor,
        data: state.data
      };
    default:
      return state;
  }
}
var store = Redux.createStore(wiki);

var mapStateToProps = function(state){
  return {
    readOnly: state.readOnly,
    cursor: state.cursor,
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

