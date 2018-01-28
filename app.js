var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// passport-twitter用
var session = require('express-session')
var auth = require('./passport');
var passport = auth.passport;

var users = require('./routes/users');
var data = require( './routes/data' );
var contents = require( './routes/contents' );
var file = require( './routes/file' );

var app = express();

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.disable('etag'); // disable 304
app.use(bodyParser.urlencoded({ limit:'50mb',extended: true })); // include image page may be big

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// passport-twitter用
app.use(session({secret: 'test-salt'}));
app.use(passport.initialize()); 
app.use(passport.session()); 

//app.use('/', index);
app.use('/data', data)
app.use('/contents', contents)
app.use('/file', file)

var routes = require('./routes');

// ルーティングを設定
routes.configRoutes(app, passport);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
console.log(err);
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
