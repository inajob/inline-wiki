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

router.get( '/list/', function ( req, res ) {
  fs.readdir(baseDir, function(err, files){
    if(err) throw err;
    var fileList = files.filter(function(file){
      return fs.statSync(path.join(baseDir,file)).isFile() && /.*\.txt$/.test(file);
    });
    fileList = fileList.map(function(a){return a.replace(/\.txt$/,"")});
    res.send({list: fileList});
  });
} );

// GET find :id
router.get( '/items/:title', function ( req, res ) {
  fs.readFile(path.join(baseDir, encodeURIComponent(req.params.title) + '.txt'), 'utf8', function(err, text){
    if(err == null){
      res.send({'status': 'success', 'body': text});
    }else{
      res.status(404).send({'status': 'error'});
    }
  });
} );

// PUT update data
router.put( '/items/:title', authorize, function ( req, res ) {
  authorize(req, res, function(){
    fs.writeFileSync(path.join(baseDir, encodeURIComponent(req.params.title)+ '.txt'), req.body.body);

    res.send({'status': 'ok'});
  });
} );

// DELETE remove data
router.delete( '/items/:title', authorize, function ( req, res ) {
  console.log(req.params.title)
  res.send("not support");
} );

module.exports = router;
