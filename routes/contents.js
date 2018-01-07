// find by title

var express = require( 'express' );
var router = express.Router();
var ObjectID = require('mongodb').ObjectID;
// MongoDB用ファイルを指定
var collection = require( '../mongo' );
var COL = 'page';
var auth = require('../passport');
var passport = auth.passport;


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

// GET find
router.get( '/', function ( req, res ) {
  collection(COL).find().toArray(function(err, docs){
    res.send(docs);
  })
} );

// GET find :id
router.get( '/:title', function ( req, res ) {
  console.log("title: "+ req.params.title);
  collection(COL).findOne( { title: req.params.title }, {}, function(err, r){
    console.log(r);
    res.send( r );
  } );
} );


// POST insert data
//router.post( '/', authorize, function ( req, res ) {
//  collection(COL).insertOne( req.body ).then(function(r) {
//    res.send( r );
//  });
//} );

// PUT update data
router.put( '/:title', authorize, function ( req, res ) {
  console.log(req.params.title)
  console.log(req.body)
  collection(COL).findOneAndUpdate( { title: req.params.title }, req.body, {upsert: true}, function(err, r){
    res.send( r );
  } );
} );

// DELETE remove data
router.delete( '/:title', authorize, function ( req, res ) {
  collection(COL).findOneAndDelete( { title: req.params.title }, {}, function(err, r){
    res.send( r );
  } );
} );

module.exports = router;
