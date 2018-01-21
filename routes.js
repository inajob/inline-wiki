'use strict';
var configRoutes;
var fs = require('fs');

configRoutes = function(app, passport) {
    app.post('/loginCheck', function(request, response) {
        // 認証保護
        if(request.user){
            response.send({isLogin: true, user: request.user});
        } else {
            response.send({isLogin: false});
        }   
    });

    app.get('/secret', function(request, response) {
        // 認証保護
        if(passport.session && passport.session.id){
            //fs.readFile('./secret/secret.html', 'utf8', function (error, html) {
            //    response.send(html);
            //});
            response.send(passport.session.id + ", " +  request.user);
        } else {
            response.redirect('/login');
        }   
    });

    // passport-twitter ----->
    // http://passportjs.org/guide/twitter/
    app.get('/auth/twitter', function(req, res){
      req.session.redirect_title = req.query.redirect_title;
      req.session.redirect_user = req.query.redirect_user;
      passport.authenticate('twitter')(req,res);
    });
    app.get('/auth/twitter/callback', function(req, res){
        passport.authenticate('twitter', { successRedirect: '/inline.html?title='+req.session.redirect_title + '&user=' + req.session.redirect_user,
                                                failureRedirect: '/login' })(req, res);
      }
    );
    // <-----
}

module.exports = {configRoutes: configRoutes};
