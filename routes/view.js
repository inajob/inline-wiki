var express = require( 'express' );
var router = express.Router();
var fs = require("fs");

router.get( '/', function ( req, res ) {
  var content = fs.readFileSync("view/inline.html", "utf8");
  res.send(content);
});

router.get( '/:user', function ( req, res ) {
  var content = fs.readFileSync("view/inline.html", "utf8");
  res.send(content);
});

router.get( '/:user/:title', function ( req, res ) {
  var content = fs.readFileSync("view/inline.html", "utf8");
  res.send(content);
});

module.exports = router;
