/**
 * Created by Shinjini on 12/10/2016.
 */

var express = require('express');
var router = express.Router();
var UserModel = require('../models/User');

var errorHandler = require('../models/ErrorHandler');
var response = require('../models/Response');

var bcrypt = require('bcrypt-nodejs');

// common errors
var notLoggedInError = errorHandler.appError(errorHandler.errNums.notLoggedIn);


/**
 * Signup a new user, and sets them as the logged in user
 * If the user is already present, send the error to be handled in the errorHandler
 */
router.post('/signup', function(req, res, next) {
    var username = req.body.username.toLowerCase();
    var password = req.body.password;
    var email = req.body.email;
    var publicEmail = req.body.publicEmail;
    UserModel.addUser(username, password, email, publicEmail, function(err, user){
        if (err){
            errorHandler.handleError(err, res);
        } else {
            req.session.loggedInUsername = user.username;
            req.session.loggedInUserId = user._id; // speeds certain things up
            response.handleResponse({username: user.username}, res);
        }
    });
});

/**
 * Check if the session has a user signed in
 */
router.get('/signin', function(req, res, next){
    if (req.session.loggedInUsername){
        response.handleResponse({username: req.session.loggedInUsername}, res);
    } else {
        errorHandler.handleError(notLoggedInError, res);
    }
});

/**
 * Logs in a user by setting them as the logged in user
 * If the user is not present in the DB, send the error to be handled in the errorHandler.
 * If the password is incorrect, sends an error to be handled in the errorHandler.
 */
router.post('/signin', function(req, res, next) {
    var username = req.body.username.toLowerCase();
    var password = req.body.password;

    if (!req.session.loggedInUsername){
        UserModel.getUser(username, function(err, user){
            if (err){
                errorHandler.handleError(err, res);
            } else {
                bcrypt.compare(password, user.passwordHash, function(err, matches) {
                    if (err){
                        errorHandler.handleError(err, res);
                    } else {
                        if (matches){ // matches
                            req.session.loggedInUsername = user.username;
                            req.session.loggedInUserId = user._id; // speeds certain things up
                            response.handleResponse({username: user.username}, res);
                        } else {
                            errorHandler.handleError(
                                errorHandler.appError(errorHandler.errNums.passwordIncorrect),
                                res);
                        }
                    }
                });
            }
        });
    } else {
        errorHandler.handleError(
            errorHandler.appError(errorHandler.errNums.alreadyLoggedIn),
            res);
    }

});

/**
 * Signs out the user by deleting the logged in user
 */
router.post('/signout', function(req, res, next) {
    delete req.session.loggedInUsername;
    delete req.session.loggedInUserId;
    response.handleResponse({}, res);
});











module.exports = router;
