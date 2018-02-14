var fs = require("fs");
var express = require( 'express' );
var path = require('path');
var router = express.Router();

var auth = require('../passport');
var passport = auth.passport;

var baseDir = path.join(__dirname, '..', 'public', 'pages');


function authorize(req,response,next){
  //next();
  if(req.user){
    return next();
  }
  //response.redirect('/login');
  response.status(403).send({'status': 'login required'})
}

// For Cross Origin
router.all( '/*', function ( req, res, next ) {
    res.contentType( 'json' );
    res.header( 'Access-Control-Allow-Origin', '*' );
    next();
} );

router.get( '/user_list', function ( req, res ) {
  fs.readdir(baseDir, function(err, files){
    if(err) throw err;
    var fileList = files.filter(function(file){
      return fs.statSync(path.join(baseDir)).isDirectory();
    });
    res.send({list: fileList});
  });
} );

router.get( '/list/:user', function ( req, res ) {
  try{
    fs.readdir(path.join(baseDir, req.params.user), function(err, files){
      if(err){
        //throw err;
        console.log(err);
        res.send("error");
        return;
      }
      var fileList = files.filter(function(file){
        return fs.statSync(path.join(baseDir, req.params.user, file)).isFile() && /.*\.txt$/.test(file);
      });
      fileList = fileList.map(function(a){return a.replace(/\.txt$/,"")});
      res.send({list: fileList});
    });
  }catch(e){
    console.log(e);
    res.send("error");
  }
} );

// GET find :id
router.get( '/items/:user/:title', function ( req, res ) {
  try{
    var fileName = path.join(baseDir, req.params.user, encodeURIComponent(req.params.title) + '.txt');
    var stat = fs.statSync(fileName);
    fs.readFile(fileName, 'utf8', function(err, text){
      if(err == null){
        res.send({'status': 'success', 'body': text, 'mtime': stat.mtime.getTime()});
      }else{
        res.status(404).send({'status': 'error'});
      }
    });
  }catch(e){
    console.log(e);
    res.send("error");
  }

} );

// PUT update data
router.put( '/items/:user/:title', authorize, function ( req, res ) {
  authorize(req, res, function(){
    var fileName = path.join(baseDir, req.params.user, encodeURIComponent(req.params.title)+ '.txt');
    var stat,mtime;
    var fileNotFound = false;
    try{
    var stat = fs.statSync(fileName);
    var mtime = stat.mtime.getTime();
    }catch(e){
      // file not found?
      fileNotFound = true;
    }
    if(mtime == req.body.mtime || fileNotFound){
      fs.writeFileSync(fileName, req.body.body);

      // re-get stat
      var stat = fs.statSync(fileName);
      var mtime = stat.mtime.getTime();
      res.send({'status': 'ok', 'mtime': mtime});
    }else{
      res.send({'status': 'conflict', 'mtime': mtime});
    }
  });
} );

// DELETE remove data
router.delete( '/:user/items/:title', authorize, function ( req, res ) {
  console.log(req.params.title)
  res.send("not support");
} );

module.exports = router;
