/**
 * Created by Shinjini on 11/23/2016.
 */
var UserModel = require("./User");
var suggestions = require('./SuggestionFinder');
var utils = require('../models/Utility');

var errorHandler = require('./ErrorHandler');
var userAlreadyConnectedError = errorHandler.appError(errorHandler.errNums.userAlreadyConnected);

/**
 * Contains functions for finding, choosing and making connections
 * @returns {ConnectionFinder}
 * @constructor
 */
var ConnectionFinder = function(){
    var that = Object.create(ConnectionFinder);

    // Algorithm Outline:
    //      Take a user and their list of interested users (all pointers)
    //      check if they still match
    //            if yes, check if both users are ready
    //                 if yes, check if both users are interested
    //                     if yes, connect! (potentially)

    /**
     * Chooses one connection from a list of potential connections. Right now it is random.
     * @param potentialConnections
     * @returns {*}
     */
    var getConnectionFromPotentialConnections = function(potentialConnections){
        //random for now
        var numConnections = potentialConnections.length;
        var connection = null;
        if (numConnections>0){
            connection = potentialConnections[utils.getRandomInt(0, numConnections)];
        }
        return connection;
    };

    /**
     * Given a user, check that they are ready to connect
     * @param user
     * @returns {Boolean}
     */
    var checkUserReady = function(user){
        return  JSON.parse(user.settings.connections.readyToConnect) || JSON.parse(user.settings.connections.alwaysReadyToConnect);
    };

    /**
     * Given a user's username, finds a list of potential connection based on the algorithm above.
     * @param givenUsername
     * @param callback
     */
    var findPotentialConnectionGivenUsername = function(givenUsername, callback){
        // only the user's interestUsers needs to be populated
        // actually populated: user's interestUsers and topics, interestUsers' topics

        var potentialConnections = []; // they are structured like that.getConnectionInfo below
        UserModel.getInterestUsers(givenUsername, function(err, user){
            if (err) {
                callback(err);
            } else {
                if (user.currentConnection.connection) {// check that user is not connected
                    callback(userAlreadyConnectedError, null);
                } else {
                    if (checkUserReady(user)) {
                        var givenUserInfo = {};
                        givenUserInfo[givenUsername] = suggestions.getFormattedInfoGivenUser(user).info;
                        user.interestUsers.forEach(function (interestUser) {
                            if (!interestUser.currentConnection.connection) {// check that they are not connected
                                if (checkUserReady(interestUser)){ // check that they are ready to make a connection
                                    var interestedInUserInfo = {};
                                    interestedInUserInfo[interestUser.username] = suggestions.getFormattedInfoGivenUser(interestUser).info;
                                    var match = suggestions.findMatchesGivenTwoUserInfos(givenUserInfo, interestedInUserInfo);
                                    if (match.length > 0) { // still match!
                                        match = match[0]; // chose the match object
                                        var alsoInterested = false;
                                        interestUser.interestUsers.forEach(function (userId) {
                                            if (user._id.equals(userId)) {
                                                alsoInterested = true;
                                            }
                                        });
                                        if (alsoInterested) {
                                            var userInfoForConnection = that.getConnectionInfo(interestUser);
                                            userInfoForConnection.matchingTimes = match.matchingTimes;
                                            potentialConnections.push(userInfoForConnection);
                                        }
                                    }
                                }
                            }
                        });
                        var connectionInfo = getConnectionFromPotentialConnections(potentialConnections);
                        callback(null, connectionInfo);
                    } else { // not ready
                        callback(null, null);
                    }
                }
            }
        });
    };

    /**
     * Given a user's username actually makes a connection if possible. If the user is already connected, returns an error
     * @param givenUsername
     * @param callback
     */
    that.makeNewConnection = function(givenUsername, callback){
        findPotentialConnectionGivenUsername(givenUsername, function(err, connectionInfo){
            if (err){
                callback(err);
            } else {
                if (connectionInfo){
                    UserModel.connectTwoUsers(givenUsername, connectionInfo.username, function(err, users, connection){
                        if (err){
                            callback(err);
                        } else {
                            connectionInfo.connectionId = connection._id;
                            connectionInfo.interested = true;
                            callback(null, connectionInfo);
                        }
                    });
                } else { // no connection found
                    callback();
                }
            }
        });

    };

    /**
     * Convenience function to format the connection info given a user document
     * @param connectUser
     * @param connectionId
     * @returns {{username: *, connectionId: *, publicEmail: (*|String|UserSchema.publicEmail|{type, required}), topics: (*|Array), matchingTimes: Array, aboutMe: (*|UserSchema.aboutMe|{type, default})}}
     */
    that.getConnectionInfo = function(connectUser, connectionId){
        return {username: connectUser.username,
            connectionId: connectionId,
            publicEmail: connectUser.publicEmail,
            topics: connectUser.topics,
            matchingTimes: [],
            aboutMe: connectUser.aboutMe
        };
    };

    Object.freeze(that);
    return that
};

module.exports = ConnectionFinder();