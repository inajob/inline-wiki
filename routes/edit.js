var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/edit', function(req, res, next) {
  res.render('edit', { title: 'Express' });
});

module.exports = router;
