/**
 * Created by Shinjini on 12/10/2016.
 */

var express = require('express');
var router = express.Router();
var UserModel = require('../models/User');
var ConnectionModel = require('../models/Connection');

var errorHandler = require('../models/ErrorHandler');
var response = require('../models/Response');
var connectionMirror = require('../models/ConnectionMirror');

var suggestions = require('../models/SuggestionFinder');
var connectionFinder = require('../models/ConnectionFinder');

var utils = require('../models/Utility');

// common errors
var notAuthorizedError = errorHandler.appError(errorHandler.errNums.notAuthorized);

/**
 * Gets the suggestions for a user. If the user has a connection already, or is capable of having a connection
 * right now, makes the connection and returns the information.
 */
router.get('/:username/dashboard', function(req, res, next) {
    // Note: these functions handle the errors themselves and only pass the result into the callback
    var getConnectUser = function(loggedInUsername, callback){
        UserModel.getConnectUser(loggedInUsername, function(err, user){ // note topics is populated
            if (err){
                errorHandler.handleError(err, res);
            } else {
                // info about our connect user
                var connectionId;
                var connectionSettings = user.settings.connections;

                if (user.currentConnection.connection) {
                    var connectUser = user.currentConnection.connectUser;
                    connectionId = user.currentConnection.connection._id;
                    var connectionInfo = connectionFinder.getConnectionInfo(connectUser, connectionId);

                    callback(connectionInfo, connectionSettings);
                } else {
                    callback(null, connectionSettings);
                }
            }
        });
    };

    // now to actually do the things
    var username = req.params.username;
    var loggedInUsername = req.session.loggedInUsername;
    if (username === loggedInUsername){ // only the logged in user can see their calendar
        // get the connection user name and user info at the same time
        getConnectUser(loggedInUsername, function(connectionInfo, connectionSettings){
            suggestions.findSuggestionsGivenUsernameAndTheirConnection(loggedInUsername, connectionInfo, function(err, matchingUsersInfo){
                if (err){
                    errorHandler.handleError(err, res);
                } else {
                    var responseData = {matchingUsersInfo: matchingUsersInfo, connectionSettings: connectionSettings};
                    responseData.username = loggedInUsername;
                    if (!connectionInfo){ // not connected, find a connection
                        if (JSON.parse(connectionSettings.readyToConnect) || JSON.parse(connectionSettings.alwaysReadyToConnect)){
                            connectionFinder.makeNewConnection(loggedInUsername, function(err, connectionInfo) {
                                if (err){
                                    errorHandler.handleError(err, res);
                                } else {
                                    if (connectionInfo){
                                        // Note: because it is a new connection, the user must be
                                        // interested in this other user, so they were inserted into
                                        // the response document.
                                        var connectionInfoIdx;
                                        matchingUsersInfo.forEach(function(matchingUserInfo, idx){
                                            if (matchingUserInfo.username === connectionInfo.username){
                                                connectionInfoIdx = idx;
                                            }
                                        });
                                        matchingUsersInfo[connectionInfoIdx] = connectionInfo;
                                    }
                                    response.handleResponse(responseData, res);
                                }
                            });
                        } else {
                            response.handleResponse(responseData, res);
                        }
                    } else { // already connected
                        var connectUsername = connectionInfo.username;
                        var connectionInfoInMatches = matchingUsersInfo.filter(function(matchingUserInfo){
                            return (matchingUserInfo.username === connectUsername)
                        });
                        if (connectionInfoInMatches.length === 0){ // they don't match anymore
                            matchingUsersInfo.push(connectionInfo);
                        }
                        response.handleResponse(responseData, res);
                    }
                }
            });
        });
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});


/**
 * Gets all availabilities for a given user, if they are currently logged in
 */
router.get('/:username/calendar', function(req, res, next){
    var username = req.params.username;
    if (username === req.session.loggedInUsername){ // only the logged in user can see their calendar
        UserModel.getUser(username, function(err, user){
            if (err){
                errorHandler.handleError(err, res);
            } else {
                UserModel.removeOutdatedAvailability(username, function(err, user){
                    if (err){
                        errorHandler.handleError(err, res);
                    } else {
                        response.handleResponse({availability: user.availability, calendarRange: user.settings.calendarRange}, res);
                    }
                });
            }
        })
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});



/**
 * Sets the availabilities for a given user, if they are currently logged in. Note: it erases any previous
 * entires in the database!
 */
router.put('/:username/calendar', function(req, res, next){
    var username = req.params.username;
    var availability = JSON.parse(req.body['availability']); // parse a string representation of array
    if (username === req.session.loggedInUsername){ // only the logged in user can update their calendar
        UserModel.updateAvailability(username, availability, function(err, user){
            if (err){
                errorHandler.handleError(err, res);
            } else {
                response.handleResponse({availability: user.availability, calendarRange: user.settings.calendarRange}, res);
            }
        });
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});

/**
 * Gets the user's settings
 */
router.get('/:username/settings', function(req, res, next){
    var username = req.params.username;

    if (username === req.session.loggedInUsername){
        UserModel.getUser(username, function(err, user){
            if (err){
                errorHandler.handleError(err, res);
            } else {
                response.handleResponse({settings: user.settings}, res);
            }
        });
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});

/**
 * Sets the calendar range for a given user, if they are currently logged in.
 */
router.put('/:username/settings/calendar/range', function(req, res, next){
    var username = req.params.username;
    var start = req.body.start;
    var end = req.body.end;

    if (username === req.session.loggedInUsername){ // only the logged in user can update their calendar
        UserModel.updateCalendarRange(username, start, end, function(err, user){
            if (err){
                errorHandler.handleError(err, res);
            } else {
                response.handleResponse({calendarRange: user.settings.calendarRange}, res);
            }
        });
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});

/**
 * For a given user, if they are currently logged in, sets their readiness to get connected again
 */
router.put('/:username/settings/connections/ready', function(req, res, next){
    var username = req.params.username;
    var now = req.body.now;
    var always = req.body.always;

    if (username === req.session.loggedInUsername){ // only the logged in user can update their calendar
        UserModel.updateConnectionSettings(username, now, always, function(err, user){
            if (err){
                errorHandler.handleError(err, res);
            } else {
                response.handleResponse({connectionSettings: user.settings.connections}, res);
            }
        });
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});

/**
 * Adds a user to the given user's interest list
 */
router.post('/:username/interests/users', function(req, res, next){
    var username = req.params.username;
    var interestUsername = req.body.interestUsername;
    if (username === req.session.loggedInUsername){ // only the logged in user can update their interest users
        UserModel.addInterestUser(username, interestUsername, function(err, user){
            if (err){
                errorHandler.handleError(err, res);
            } else {
                response.handleResponse({}, res);
            }
        });
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});

/**
 * Removes a user from the given user's interest list
 */
router.delete('/:username/interests/users/:interestUsername', function(req, res, next){
    var username = req.params.username;
    var interestUsername = req.params.interestUsername;

    if (username === req.session.loggedInUsername){ // only the logged in user can update interest users
        UserModel.removeInterestUser(username, interestUsername, function(err, user){
            if (err){
                errorHandler.handleError(err, res);
            } else {
                response.handleResponse({}, res);
            }
        });
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});

/**
 * Adds a user to a given user's disinterest list, and simultaneously removes them from their interest list
 */
router.post('/:username/disinterests/users/', function(req, res, next){
    var username = req.params.username;
    var disinterestUsername = req.body.disinterestUsername;
    if (username === req.session.loggedInUsername){ // only the logged in user can update their interest users
        UserModel.addDisinterestUser(username, disinterestUsername, function(err, user){
            if (err){
                errorHandler.handleError(err, res);
            } else {
                response.handleResponse({}, res);
            }
        });
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});


/**
 * Removes a user from a given user's disinterest list, and simultaneously adds them to their interest list
 */
router.delete('/:username/disinterests/users/:disinterestUsername', function(req, res, next){
    var username = req.params.username;
    var disinterestUsername = req.params.disinterestUsername;

    if (username === req.session.loggedInUsername){ // only the logged in user can update interest users

        UserModel.removeDisinterestUser(username, disinterestUsername, function(err, user){
            if (err){
                errorHandler.handleError(err, res);
            } else {
                response.handleResponse({}, res);
            }
        });
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});

/**
 * Gets all the notes in a connection by the given user
 */
router.get('/:username/connections/:connectionId/notes', function(req, res, next){
    var username = req.params.username;
    var connectionId = req.params.connectionId;

    if (username === req.session.loggedInUsername){ // only the logged in user can close their connection
        var userId = req.session.loggedInUserId;
        ConnectionModel.getNotes(connectionId, userId, function(err, notes){
            if (err) {
                errorHandler.handleError(err, res);
            } else {
                response.handleResponse({connectionNotes:notes}, res);
            }
        });
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});

/**
 * Adds a new note to the connection by the given user
 */
router.post('/:username/connections/:connectionId/notes', function(req, res, next){
    var username = req.params.username;
    var connectionId = req.params.connectionId;
    var content = req.body.content;

    if (username === req.session.loggedInUsername){ // only the logged in user can update a note in a connection
        var userId = req.session.loggedInUserId;
        ConnectionModel.addNote(connectionId, userId, content, function(err, connection, note){
            if (err) {
                errorHandler.handleError(err, res);
            } else {
                response.handleResponse({newNote: note}, res);
            }
        });
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});

/**
 * Updates a note in the connection by the given user
 */
router.put('/:username/connections/:connectionId/notes/:noteId', function(req, res, next){
    var username = req.params.username;
    var connectionId = req.params.connectionId;
    var noteId = req.params.noteId;
    var newContent = req.body.newContent;

    if (username === req.session.loggedInUsername){ // only the logged in user can add a note to a connection
        var userId = req.session.loggedInUserId;
        ConnectionModel.updateNote(connectionId, userId, noteId, newContent, function(err, connection, note){
            if (err) {
                errorHandler.handleError(err, res);
            } else {
                response.handleResponse({updatedNote: note}, res);
            }
        });
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});

/**
 * Deletes a note in the connection by the given user
 */
router.delete('/:username/connections/:connectionId/notes/:noteId', function(req, res, next){
    var username = req.params.username;
    var connectionId = req.params.connectionId;
    var noteId = req.params.noteId;

    if (username === req.session.loggedInUsername){ // only the logged in user can add a note to a connection
        var userId = req.session.loggedInUserId;
        ConnectionModel.deleteNote(connectionId, userId, noteId, function(err, connection, note){
            if (err) {
                errorHandler.handleError(err, res);
            } else {
                response.handleResponse({deletedNote: note}, res);
            }
        });
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});

/**
 * Gets all the past connections of a user
 */
router.get('/:username/connections', function(req, res, next) {
    var username = req.params.username;
    if (username === req.session.loggedInUsername) {
        UserModel.getPreviousConnections(username, function(err, prevConnections, user) {
            if (err) {
                errorHandler.handleError(err, res);
            }
            else {
                var usernameConnections = [];
                prevConnections.forEach(function(connection) {
                    var username1 = connection.user1.username;
                    var username2 = connection.user2.username;

                    var otherUsernameAndIndex =  utils.getOtherUsername(username, [username1, username2]);
                    var otherUsername = otherUsernameAndIndex.otherUsername;
                    var otherUserNumber = otherUsernameAndIndex.index + 1;
                    var thisUserNumber = 2 - otherUsernameAndIndex.index;

                    var publicEmail = connection['user'+otherUserNumber].publicEmail;
                    var stillInterested = (user.disinterestUsers.filter(function(userId){
                        return connection['user'+otherUserNumber]._id.equals(userId)
                    }).length == 0); // checking that the user is not in the disinterest list

                    usernameConnections.push({
                        connectUsername : otherUsername,
                        openTime : connection.openTime,
                        open : connection.open,
                        closeTime : connection.closeTime,
                        _id: connection._id,
                        connectionId: connection._id,
                        stillInterested: stillInterested,
                        publicEmail: publicEmail,
                        notes: connection['user'+thisUserNumber+'Notes']
                    });
                });
                response.handleResponse({connections : usernameConnections, connectionSettings: user.settings.connections}, res);
            }
        })
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});

/**
 * Closes a connection. NOTE: a request from one side is enough to break the connection
 */
router.delete('/:username/connections/:connectionId', function(req, res, next){
    var username = req.params.username;
    var connectionId = req.params.connectionId;
    var connectUsername = req.body.connectUsername;

    if (username === req.session.loggedInUsername){ // only the logged in user can close their connection
        UserModel.endConnection(username, connectUsername, connectionId, function(err, connection){
            if (err){
                errorHandler.handleError(err, res);
            } else {
                response.handleResponse({}, res);
            }
        });
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});

/**
 * Sends an email from one user in a connection to the other
 */
router.post('/:username/connections/:connectionId/mail', function (req, res, next) {
    var senderName = req.params.username;
    var connectionId = req.params.connectionId;
    var content = [{ type: "text/plain", value: req.body.message }];
    var from_email = utils.getSendGridEmail();

    var sendConnectionEmail = function (from_email, subject, to_email, content, reply_to, res) {
        // Make an email and send it via SendGrid
        // Send a response to the user reporting that their email was sent
        var personalization = {
            "to": [ to_email ],
            "subject": subject,
        };

        var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);

        var request = sg.emptyRequest();
        request.body.from = from_email;
        request.body.reply_to = reply_to;
        request.body.content = content;
        request.body.personalizations = [personalization];
        request.method = 'POST';
        request.path = '/v3/mail/send';

        sg.API(request, function(sgErr, sgRes) {
            if (sgErr) {
                sgErr.response.body.errors.forEach(function (err) {
                });
                errorHandler.handleError({ sgErr: sgErr }, res);
            } else {
                response.handleResponse({ sgRes: sgRes }, res);
            }
        });
    };

    if (senderName == req.session.loggedInUsername) {
        // Get the email of the sender
        UserModel.getUser(senderName, function (err, sender) {
            if (err) {
                console.log(1, err);
                errorHandler.handleError(err, res);
            } else {
                var senderEmail = sender.publicEmail;

                // Get the username and email of the recipient
                connectionMirror.mirrorConnection(connectionId, sender._id, function (err, recipient) {
                    if (err) {
                        console.log(2, err);
                        errorHandler.handleError(err, res);
                    } else {
                        // Make sure the sender is not on the recipient's blocklist
                        // If they are, fail silently and don't send the message
                        UserModel.isBlocked(recipient.username, sender.username, function (err, senderIsBlocked) {
                            if (err) {
                                errorHandler.handleError(err, res);
                            } else {
                                if (!senderIsBlocked) {
                                    var recipientName = recipient.username;
                                    var recipientEmail = recipient.publicEmail;

                                    var subject = utils.makeConnectionEmailSubject(senderName);
                                    var to_email = {
                                        "email": recipientEmail,
                                        "name": recipientName
                                    };
                                    var reply_to = {
                                        "email": senderEmail,
                                        "name": senderName
                                    };

                                    sendConnectionEmail(from_email, subject, to_email, content, reply_to, res);
                                } else {
                                    response.handleResponse({}, res);
                                }
                            }
                        });
                    }
                });
            }
        });
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }

});

/**
 * Gets the location of a given user, if they are currently logged in
 */
router.get('/:username/location', function(req, res, next){
    var username = req.params.username;
    if (username === req.session.loggedInUsername){ // only the logged in user can see their calendar
        UserModel.getUser(username, function(err, user){
            if (err){
                errorHandler.handleError(err, res);
            } else {
                response.handleResponse({location: user.location}, res);
            }
        })
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});

/**
 * Updates the location of a given user, if they are currently logged in
 */
router.put('/:username/location', function (req, res, next) {
    var username = req.params.username;
    var location = req.body.location;
    if (username === req.session.loggedInUsername) {
        UserModel.updateLocation(username, location, function (err, user) {
            if (err){
                errorHandler.handleError(err, res);
            } else {
                response.handleResponse({}, res);
            }
        });
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});

/**
 * Gets the given user's preferences
 */
router.get('/:username/preferences', function(req, res, next){
    var username = req.params.username;
    if (username === req.session.loggedInUsername) {
        UserModel.getUser(username, function(err, user){
            if (err){
                errorHandler.handleError(err, res);
            } else {
                response.handleResponse({topicOverlap: user.preferences.topicOverlap, locationRadius: user.preferences.locationRadius}, res);
            }
        });
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});

/**
 * Gets the user's topic overlap preference
 */
router.get('/:username/preferences/topic/overlap', function(req, res, next){ // FIXME not sure if the route is RESTFUL
    var username = req.params.username;
    if (username === req.session.loggedInUsername) {
        UserModel.getUser(username, function(err, user){
            if (err){
                errorHandler.handleError(err, res);
            } else {
                response.handleResponse({topicOverlap: user.preferences.topicOverlap}, res);
            }
        });
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});

/**
 * Gets the user's location radius preference
 */
router.get('/:username/preferences/location/radius', function(req, res, next){ // FIXME not sure if the route is RESTFUL
    var username = req.params.username;
    if (username === req.session.loggedInUsername) {
        UserModel.getUser(username, function(err, user){
            if (err){
                errorHandler.handleError(err, res);
            } else {
                response.handleResponse({locationRadius: user.preferences.locationRadius}, res);
            }
        });
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});

/**
 * Updates the topic overlap of a given user
 */
router.put('/:username/preferences/topic/overlap', function(req, res, next){ // FIXME not sure if the route is RESTFUL
    var username = req.params.username;
    var topicOverlap = req.body.topicOverlap;
    if (username === req.session.loggedInUsername) {
        UserModel.updatePreferenceTopicOverlap(username, topicOverlap, function (err, user) {
            if (err){
                errorHandler.handleError(err, res);
            } else {
                response.handleResponse({}, res);
            }
        });
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});

/**
 * Updates a user's location radius
 */
router.put('/:username/preferences/location/radius', function(req, res, next){ // FIXME not sure if the route is RESTFUL
    var username = req.params.username;
    var locationRadius = req.body.locationRadius;
    if (username === req.session.loggedInUsername) {
        UserModel.updatePreferenceLocationRadius(username, locationRadius, function (err, user) {
            if (err){
                errorHandler.handleError(err, res);
            } else {
                response.handleResponse({}, res);
            }
        });
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});

/**
 * Gets a user's about me
 */
router.get('/:username/about', function(req, res, next){
    var username = req.params.username;
    if (username === req.session.loggedInUsername) {
        UserModel.getUser(username, function(err, user){
            if (err){
                errorHandler.handleError(err, res);
            } else {
                response.handleResponse({aboutMe: user.aboutMe}, res);
            }
        });
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});

/**
 * Updates a user's about me
 */
router.put('/:username/about', function(req, res, next){
    var username = req.params.username;
    var aboutMe = req.body.aboutMe;
    if (username === req.session.loggedInUsername) {
        UserModel.updateAboutMe(username, aboutMe, function(err, user){
            if (err){
                errorHandler.handleError(err, res);
            } else {
                response.handleResponse({aboutMe: user.aboutMe}, res);
            }
        });
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});



/**
 * Gets the user's current list of topics
 */
router.get('/:username/interests/topics', function (req, res, next) {
    var username = req.params.username;
    if (username === req.session.loggedInUsername) {
        UserModel.getTopics(username, function (err, topics) {
            if (err){
                errorHandler.handleError(err, res);
            } else {
                response.handleResponse({topics: topics}, res);
            }
        });
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});


/**
 * Adds a topic to a user's list of topics
 */
router.post('/:username/interests/topics', function (req, res, next) {
    var username = req.params.username;
    var topicId = req.body.topicId;
    if (username === req.session.loggedInUsername) {
        UserModel.addTopic(username, topicId, function (err, user) {
            if (err){
                errorHandler.handleError(err, res);
            } else {
                response.handleResponse({}, res);
            }
        });
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});


/**
 * Removes a topic to from user's list of topics
 */
router.delete('/:username/interests/topics/:topicId', function (req, res, next) {
    var username = req.params.username;
    var topicId = req.params.topicId;
    if (username === req.session.loggedInUsername) {
        UserModel.removeTopic(username, topicId, function (err, user) {
            if (err){
                errorHandler.handleError(err, res);
            } else {
                response.handleResponse({}, res);
            }
        });
    } else {
        errorHandler.handleError(notAuthorizedError, res);
    }
});


module.exports = router;
