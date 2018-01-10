var fs = require("fs");
var express = require( 'express' );
var path = require('path');
var router = express.Router();

var auth = require('../passport');
var passport = auth.passport;

var baseDir = path.join(__dirname, '..', 'public', 'pages');


function authorize(req,response,next){
  next();
  /*
  if(passport.session && passport.session.id){
    return next();
  }
  response.redirect('/login');
  */
}

/*
// For Cross Origin
router.all( '/*', function ( req, res, next ) {
    res.contentType( 'json' );
    res.header( 'Access-Control-Allow-Origin', '*' );
    next();
} );
*/

// GET find all(not support?)
router.get( '/', function ( req, res ) {
  res.send("not support");
} );

// GET find :id
router.get( '/:title', function ( req, res ) {
  fs.readFile(path.join(baseDir, encodeURIComponent(req.params.title) + '.txt'), 'utf8', function(err, text){
    if(err == null){
      res.send({'status': 'success', 'body': text});
    }else{
      res.status(404).send({'status': 'error'});
    }
  });
} );

// PUT update data
router.put( '/:title', authorize, function ( req, res ) {
  fs.writeFileSync(path.join(baseDir, encodeURIComponent(req.params.title)+ '.txt'), req.body.body);

  res.send({'status': 'ok'});
} );

// DELETE remove data
router.delete( '/:title', authorize, function ( req, res ) {
  console.log(req.params.title)
  res.send("not support");
} );

module.exports = router;
