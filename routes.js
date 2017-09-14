'use strict';
var configRoutes;
var fs = require('fs');

configRoutes = function(app, passport) {
    app.get('/secret', function(request, response) {
        // 認証保護
        if(passport.session && passport.session.id){
            //fs.readFile('./secret/secret.html', 'utf8', function (error, html) {
            //    response.send(html);
            //});
            response.send(passport.session.id);
        } else {
            response.redirect('/login');
        }   
    });

    // passport-twitter ----->
    // http://passportjs.org/guide/twitter/
    app.get('/auth/twitter', passport.authenticate('twitter'));
    app.get('/auth/twitter/callback', 
        passport.authenticate('twitter', { successRedirect: '/secret',
                                                failureRedirect: '/login' }));
    // <-----
}

module.exports = {configRoutes: configRoutes};
