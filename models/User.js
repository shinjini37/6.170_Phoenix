/**
 * Created by Shinjini on 11/17/2016.
 */

var mongoose = require("mongoose");
var bcrypt = require('bcrypt-nodejs');
var ObjectId = mongoose.Schema.Types.ObjectId;
var errorHandler = require('./ErrorHandler');
var utils = require('./Utility');
var ConnectionModel = require('./Connection');
var TopicModel = require('./Topic');

// NOTES about zipcodes: it uses zipcodes as STRINGs
var zipcodes = require('zipcodes');


var UserSchema = mongoose.Schema({
    username: {type: String, lowercase: true, required: true, index: true},
    passwordHash: {type: String, required: true},
    email: {type: String, required: true},
    publicEmail: {type: String, required: true},

    aboutMe: {type: String, default: ''},

    availability: [{type: String}],
    location: {type: String, default: ''}, // allow location to be empty
    topics: [{type: ObjectId, ref: "Topic"}],

    interestUsers: [{type: ObjectId, ref: "User"}], // must be a set!
    disinterestUsers: [{type: ObjectId, ref: "User"}], // must be a set!
    blockedUsers: [{type: ObjectId, ref: "User"}], // must be a set!

    currentConnection: {
        connectUser:{type: ObjectId, ref: "User", default: null},
        connection: {type: ObjectId, ref: "Connection", default: null}
    },
    previousConnections: [{type: ObjectId, ref: "Connection"}], //

    preferences: {
        topicOverlap: {type: String, default: '0,0'},
        locationRadius: {type: Number, default:0}
    }, // radius in miles because 'Merica!
    settings: {
        connections:{
            readyToConnect: {type: Boolean, default: false},
            alwaysReadyToConnect: {type: Boolean, default: false}
        },
        calendarRange: {
            start:{type: Number, default: 0},
            end:{type: Number, default: 24}
        }
    }

});

// Common errors
var userNotRegisteredError = errorHandler.appError(errorHandler.errNums.userNotInDB);
var userAlreadyRegisteredError = errorHandler.appError(errorHandler.errNums.userAlreadyInDB);
var passwordWrongLengthError = errorHandler.appError(errorHandler.errNums.passwordWrongLength);
var passwordWrongCharectersError = errorHandler.appError(errorHandler.errNums.passwordWrongCharacters);
var invalidZipcodeError = errorHandler.appError(errorHandler.errNums.invalidZipcode);
var formatError = errorHandler.appError(errorHandler.errNums.availabilityWrongFormat);
var invalidConnectionId = errorHandler.appError(errorHandler.errNums.invalidConnectionId);
var userAlreadyConnectedError = errorHandler.appError(errorHandler.errNums.userAlreadyConnected);
var invalidTopicOverlap = errorHandler.appError(errorHandler.errNums.invalidTopicOverlap);
var invalidLocationRadius = errorHandler.appError(errorHandler.errNums.invalidLocationRadius);
var invalidCalendarRange =  errorHandler.appError(errorHandler.errNums.invalidCalendarRange);
var invalidAboutMeLengthError = errorHandler.appError(errorHandler.errNums.invalidNoteLength);
var invalidConnectionSettingsError = errorHandler.appError(errorHandler.errNums.invalidConnectionSettings);
var invalidTopicError = errorHandler.appError(errorHandler.errNums.invalidTopic);
var cannotConnectInterestDisinterestBlockSelfError = errorHandler.appError(errorHandler.errNums.cannotConnectInterestDisinterestBlockSelf);


/** Helper private functions **/

/**
 * Decode meaning of preference[topicOverlap] values
 */
var topicOverlapNums = {
    matchAllTopicsAllPositions: '2,2',
    matchAllTopicsAnyPositions: '2,0',
    matchAllTopicsNoPositions: '2,-1',
    matchSomeTopicsAllPositions: '1,2',
    matchSomeTopicsAnyPositions: '1,0',
    matchNoTopics: '-1,0',
    indifferent: '0,0'
};

/**
 * This is topicOverlapNums with the keys and values flipped, needed for checking the format
 * @type {{}}
 */
var topicOverlapNumsDecode = {};
for (var explanation in topicOverlapNums){
    topicOverlapNumsDecode[topicOverlapNums[explanation]] = explanation;
}

/**
 * Check format of availability document
 * @param availability
 * @returns {*}
 */
var checkAvailabilityFormat = function(availability){
    var now = utils.getTimeNowInUTC();
    // Format: number in millisecond, set at the start of the hour
    var relevantAvailability = [];
    if (Object.prototype.toString.call(availability) === "[object Array]" ){ // it is an array
        availability.forEach(function(time){
            time = parseInt(time);
            var date = new Date(time); // for too high numbers and NaNs
            if (date != 'Invalid Date'){
                if (time> now){
                    relevantAvailability.push(String(time)); // keep this as a string
                }
            } else {
                return {ok: false, error: formatError};
            }
        });
        return {ok: true, error: null, availability: relevantAvailability}
    }
    return {ok: false, error: formatError};
};

/**
 * Checks the format for the calendar range. They should be numbers and start should be < end
 * @param start
 * @param end
 * @returns {boolean}
 */
var checkCalendarRangeFormat = function(start, end){
    start = parseInt(start);
    end = parseInt(end);

    var checkInput = function(val){
        if (!isNaN(val)){
            if ((val<=24) && (val>=0)){
                return true;
            }
        }
        return false;
    };

    if (checkInput(start) && checkInput(end)){
        if (start < end) {
            return true
        }
    }
    return false
};

/**
 * Checks the input of readyToConnect. The input should be a string representation of a boolean.
 * @param booleanString
 * @returns {boolean}
 */
var checkBooleanString = function (booleanString){
    var boolean = JSON.parse(booleanString);
    return (typeof boolean) === 'boolean'
};

/**
 * Checks that the about me is less than 250 chars long
 * @param aboutMe
 * @returns {boolean}
 */
var checkAboutMeFormat = function(aboutMe){
    return aboutMe.length <= 250
};


/**
 * Checks that the password follows the following requirements so as to reduce the possibility of injection attacks.
 * If password is not okay, sends an error using the callback
 * @param password {string} has to have only alphanumeric characters and the symbols -_. and 5 <= length <= 25
 */
var checkPassword = function(password){
    var correctLength = ((password.length>=5) && (password.length<=25));
    // allowed are letters, numbers, -, _, . no space
    // This uses a Regular Expression to check this.
    var correctCharacters = /^[a-zA-Z0-9._-]+$/.test(password);
    if (!correctLength){
        return {ok: false,
            error: passwordWrongLengthError};
    } else if (!correctCharacters){
        return {ok: false,
            error: passwordWrongCharectersError};
    } else {
        return {ok: true, error: null};
    }
};

var checkLocation = function(locationString){
    // check that the location is correctly formatted or just emply
    var correctFormat = (/^\d{5}$/.test(locationString) || locationString.length===0);
    var validZipcode = false;
    if (correctFormat){
        var location = zipcodes.lookup(locationString);
        if (location){ // it is undefined if it's non-existent
            validZipcode = true;
        }
    }
    return validZipcode
};

var checkLocationRadius = function(locationRadiusString){
    var locationRadiusInt = parseInt(locationRadiusString);
    return ((! isNaN(locationRadiusInt)) && (locationRadiusString.length<5));
};

var checkTopicOverlap = function(topicOverlap){
    return (topicOverlap in topicOverlapNumsDecode);
};

/**
 * Checks if the user is not in the database.
 * @param username {String} the username of the user to search
 * @param callback {Function} Function to execute given the result. Usage: callback(error, isNotInDB{Boolean})
 */
UserSchema.statics.userNotInDB = function(username, callback){
    username = username.toLowerCase();
    UserModel.find({username: username})
        .count(function(err, count){
            if (err){
                callback(err, null);
            } else {
                callback(null, count == 0);
            }
        });
};


/**
 * Creates a user in the database with the given username and password.
 * @param username {string} has to have only alphanumeric characters and the symbols -_. and 3 <= length <= 20
 * @param password {string} has to have only alphanumeric characters and the symbols -_. and 5 <= length <= 25
 * @param email {String}
 * @param publicEmail {String}
 * @param callback {Function} Function to execute given the result. Usage: callback(error, userJustCreated)
 */
UserSchema.statics.addUser = function(username, password, email, publicEmail, callback) {
    var passwordOk = checkPassword(password);
    if (!passwordOk.ok){
        callback(passwordOk.error);
    } else {
        UserModel.userNotInDB(username, function(err, notInDB){
            if (err){
                callback(err, null);
            } else {
                if (notInDB){
                    bcrypt.hash(password, null, null, function(err, hash) {
                        if (err){
                            callback(err, null);
                        } else {
                            var data = {
                                username: username,
                                passwordHash: hash,
                                email: email,
                                publicEmail: publicEmail
                            };
                            UserModel.create(data, callback);
                        }
                    });
                } else {
                    callback(userAlreadyRegisteredError);
                }
            }
        });
    }
};

/**
 * If the given user is in the database, updates their availability using the given availability.
 * While updating, only uses entires that are still relevant at the tine of update. If the user is not
 * present or if the format of the availability is wrong, returns errors.
 * @param username
 * @param availability {Array} of times (which are millisecond representations of Date objects)
 * @param callback
 */
UserSchema.statics.updateAvailability = function(username, availability, callback){
    var availabilityFormatOk = checkAvailabilityFormat(availability);
    if (availabilityFormatOk.ok){
        UserModel.findOneAndUpdate(
            {username: username},
            {$set:{availability: availabilityFormatOk.availability}},
            {new: true},
            function(err, user){
                if (err){
                    callback(err);
                } else if (!user){ // user is either an object or null, so this check is ok
                    callback(userNotRegisteredError);
                } else {
                    callback(null, user);
                }
            });
    } else {
        callback(availabilityFormatOk.error);
    }
};

/**
 * Updates a user's 'about me'.
 * @param username
 * @param aboutMe
 * @param callback
 */
UserSchema.statics.updateAboutMe = function(username, aboutMe, callback){
    if (checkAboutMeFormat(aboutMe)){
        UserModel.findOneAndUpdate(
            {username: username},
            {$set:{aboutMe: aboutMe}},
            {new: true},
            function(err, user){
                if (err){
                    callback(err);
                } else if (!user){ // user is either an object or null, so this check is ok
                    callback(userNotRegisteredError);
                } else {
                    callback(null, user);
                }
            });
    } else {
        callback(invalidAboutMeLengthError);
    }
};

/**
 * Update's a user's settings of calendar start and end times.
 * @param username
 * @param start
 * @param end
 * @param callback
 */
UserSchema.statics.updateCalendarRange = function(username, start, end, callback){
    var formatOk = checkCalendarRangeFormat(start, end);
    if (formatOk){
        UserModel.findOneAndUpdate(
            {username: username},
            {$set:{'settings.calendarRange': {start: start, end:end}}},
            {new: true},
            function(err, user){
                if (err){
                    callback(err);
                } else if (!user){ // user is either an object or null, so this check is ok
                    callback(userNotRegisteredError);
                } else {
                    callback(null, user);
                }
            });
    } else {
        callback(invalidCalendarRange);
    }
};

/**
 * Updates if the user is readyToConnect and alwaysReadyToConnect
 * @param username
 * @param now
 * @param always
 * @param callback
 */
UserSchema.statics.updateConnectionSettings = function(username, now, always, callback){
    var nowOk = true;
    var alwaysOk = true;
    if (now){
        nowOk = checkBooleanString(now);
    }
    if (always){
        alwaysOk = checkBooleanString(always);
    }

    if (nowOk && alwaysOk){
        var update = {};
        if (now){ // it exists
            now = JSON.parse(now);
            update['settings.connections.readyToConnect'] = now;
        }
        if (always){ // it exists
            always = JSON.parse(always);
            update['settings.connections.alwaysReadyToConnect'] = always;
        }

        UserModel.findOneAndUpdate(
            {username: username},
            {$set: update},
            {new: true},
            function(err, user){
                if (err){
                    callback(err);
                } else if (!user){ // user is either an object or null, so this check is ok
                    callback(userNotRegisteredError);
                } else {
                    callback(null, user);
                }
            });
    } else {
        callback(invalidConnectionSettingsError);
    }
};

/**
 * When this function is called, for the given user, it removes all availabilities that are for a time before the
 * time of calling the function.
 * @param username
 * @param callback
 */
UserSchema.statics.removeOutdatedAvailability = function(username, callback){
    UserModel.findOne({username: username}, function(err, user){
        if (err){
            callback(err);
        } else if (!user){ // user is either an object or null, so this check is ok
            callback(userNotRegisteredError);
        } else {
            // clean up the availability
            var now = utils.getTimeNowInUTC();
            var availability = user.availability.filter(function(time){
                return (parseInt(time)>now);
            });
            UserModel.findOneAndUpdate(
                {username: username},
                {$set:{availability: availability}},
                {new: true},
                function(err, user){
                    if (err){
                        callback(err);
                    } else {
                        callback(null, user);
                    }
                });
        }

    });
};

/**
 * Gets all the topics a user is interested in out of the database
 * @param username the username of the person whose topics we want
 * @param callback signature: function (err, topics)
 */
UserSchema.statics.getTopics = function(username, callback) {
    UserModel.findOne({username: username})
        .populate({
            path: 'topics'
        })
        .exec(function(err, user) {
        if (err) {
            callback(err);
        } else if (!user){
            callback(userNotRegisteredError);
        } else {
            callback(null, user.topics)
        }
    });
};


/**
 * Adds a topicId to a user's list of topics of interest
 * @param username the username of the person to add a topicId to
 * @param topicId the topicId to add
 */
UserSchema.statics.addTopic = function(username, topicId, callback) {
    TopicModel.findOne({_id: topicId}, function(err, topic){
        if (err){
            callback(err);
        } else if (!topic){
            callback(invalidTopicError);
        } else {
            UserModel.findOne({username: username}, function (err, user) {
                if (err) {
                    callback(err);
                } else if (!user) {
                    callback(userNotRegisteredError);
                } else {
                    UserModel.findOneAndUpdate(
                        {username: username},
                        {$addToSet: {topics: topic._id}},
                        {new: true},
                        callback);
                }
            });
        }
    });
};

/**
 * Removes a topic from a user's list of topics of interest
 * @param username
 * @param topicId
 */
UserSchema.statics.removeTopic = function(username, topicId, callback) {
    UserModel.findOne({username: username}, function (err, user) {
        if (err) {
            callback(err);
        } else if (!user) {
            callback(userNotRegisteredError);
        } else {
            UserModel.findOneAndUpdate(
                {username: username},
                {$pull: {topics: topicId}},
                {new: true},
                callback);
        }
    });
};

/**
 * Gets a user from the database given their username.
 * @param username {String} username to search
 * @param callback {Function} Function to execute given the result. Usage: callback(error, user)
 */
UserSchema.statics.getUser = function(username, callback){
    username = username.toLowerCase();
    UserModel.findOne({username: username})
        .exec(function(err, user){
            if (err){
                callback(err);
            } else if (!user){ // user is either an object or null, so this check is ok
                // TODO
                callback(userNotRegisteredError);
            } else {
                callback(null, user);
            }
        });
};

/**
 * Gets a user from the database given their id.
 * @param userId {String} id to search
 * @param callback {Function} Function to execute given the result. Usage: callback(error, user)
 */
UserSchema.statics.getUserById = function(userId, callback){
    UserModel.findOne({_id: userId}, function (err, user) {
        if (err){
            callback(err);
        } else if (!user){ // user is either an object or null, so this check is ok
            // TODO
            callback(userNotRegisteredError);
        } else {
            callback(null, user);
        }
    });
};

/**
 * Adds a user the given user is interested in. Users cannot be interested in themselves.
 * @param username
 * @param interestUsername
 * @param callback
 */
UserSchema.statics.addInterestUser = function(username, interestUsername, callback){
    if (username == interestUsername){
        callback(cannotConnectInterestDisinterestBlockSelfError);
    } else {
        UserModel.findOne({username: interestUsername})
            .exec(function(err, interestUser){
                if (err) {
                    callback(err);
                } else if (!interestUser){
                    callback(userNotRegisteredError);
                } else {
                    UserModel.findOneAndUpdate({username: username},
                        {$addToSet:{interestUsers: interestUser._id}},
                        {new: true},
                        callback);
                }
            });
    }
};

/**
 * Removes a user from a given user's interest list.
 * @param username
 * @param interestUsername
 * @param callback
 */
UserSchema.statics.removeInterestUser = function(username, interestUsername, callback){
    UserModel.findOne({username: interestUsername})
        .exec(function(err, interestUser){
            if (err){
                callback(err);
            } else if (!interestUser){
                callback(userNotRegisteredError);
            } else {
                UserModel.findOneAndUpdate({username: username},
                    {$pull:{interestUsers: interestUser._id}},
                    {new: true},
                    callback);
            }
        });
};

/**
 * Adds a user to the given user's Disinterest (to be suggested or to be connected with again) list. Also
 * removes the user from the user's Interest list.
 * @param username
 * @param disinterestUsername
 * @param callback
 */
UserSchema.statics.addDisinterestUser = function(username, disinterestUsername, callback){
    if (username == disinterestUsername){
        callback(cannotConnectInterestDisinterestBlockSelfError);
    } else {
        UserModel.findOne({username: disinterestUsername})
            .exec(function(err, disinterestUser){
                if (err) {
                    callback(err);
                } else if (!disinterestUser){
                    callback(userNotRegisteredError);
                } else {
                    UserModel.findOneAndUpdate({username: username},
                        {$pull:{interestUsers: disinterestUser._id},
                            $addToSet:{disinterestUsers: disinterestUser._id}},
                        {new: true},
                        callback);
                }
            });
    }
};

/**
 * Removes a user from the given user's Disinterest (to be suggested or to be connected with again) list. Also
 * adds the user back to the user's Interest list.
 * @param username
 * @param disinterestUsername
 * @param callback
 */
UserSchema.statics.removeDisinterestUser = function(username, disinterestUsername, callback){
    UserModel.findOne({username: disinterestUsername})
        .exec(function(err, disinterestUser){
            if (err){
                callback(err);
            } else if (!disinterestUser){
                callback(userNotRegisteredError);
            } else {
                UserModel.findOneAndUpdate({username: username},
                    {$pull:{disinterestUsers: disinterestUser._id},
                        $addToSet:{interestUsers: disinterestUser._id}},
                    {new: true},
                    callback);
            }
        });
};

/**
 * Checks if the given user is connected
 * @param username
 * @param callback
 */
var isUserConnected = function(username, callback){
    UserModel.findOne({username: username})
        .exec(function(err, user){
            if (err){
                callback(err);
            } else if (!user){
                callback(userNotRegisteredError);
            } else {
                if (user.currentConnection.connection){
                    callback(null, {isConnected: true, connectUserId: user.currentConnection.connectUser, connectionId: user.currentConnection.connection, userId: user._id});
                } else {
                    callback(null, {isConnected: false, connectUserId: null, connectionId: null, userId: user._id});
                }
            }
        });
};

/**
 * Returns the user with their connect user and their connection populated
 * @param username
 * @param callback
 */
UserSchema.statics.getConnectUser = function(username, callback){
    UserModel.findOne({username: username})
        .populate('currentConnection.connection')
        .populate({path: 'currentConnection.connectUser',
            populate: {path:'topics'}})
        .exec(function(err, user){
            if (err){
                callback(err);
            } else if (!user){
                callback(userNotRegisteredError);
            } else {
                callback(err, user);
            }
        });
};

/**
 * Given two usernames, if both users are not currently connected, connects them: that is, creates a new connection
 * and sets this as their current connection and adds it to their list of previous connections.
 * @param username1
 * @param username2
 * @param callback
 */
UserSchema.statics.connectTwoUsers = function(username1, username2, callback){
    if (username1 == username2){
        callback(cannotConnectInterestDisinterestBlockSelfError);
    } else {
        isUserConnected(username1, function(err, isConnected1){
            if (err){
                callback(err);
            } else if (!isConnected1.isConnected) {
                isUserConnected(username2, function(err, isConnected2){
                    if (err){
                        callback(err);
                    } else if (!isConnected2.isConnected) { // no one's connected
                        ConnectionModel.createConnection(isConnected1.userId, isConnected2.userId, function(err, connection){
                            if (err){
                                callback(err);
                            } else {
                                UserModel.findOneAndUpdate({username: username1},
                                    {$set: {currentConnection:{connectUser:  isConnected2.userId, connection: connection._id}},
                                        $push: {previousConnections: connection._id}},
                                    {new: true},
                                    function (err, user2) {
                                        if (err) {
                                            callback(err);
                                        } else {
                                            UserModel.findOneAndUpdate({username: username2},
                                                {$set: {currentConnection:{connectUser:  isConnected1.userId, connection: connection._id}},
                                                    $push: {previousConnections: connection._id}},
                                                {new: true},
                                                function (err, user1) {
                                                    if (err) {
                                                        callback(err);
                                                    } else {
                                                        callback(null, [user1, user2], connection);
                                                    }
                                                });
                                        }
                                    });
                            }
                        });
                    } else {
                        callback(userAlreadyConnectedError);
                    }
                });
            } else {
                callback(userAlreadyConnectedError);
            }
        });

    }
};

/**
 * If the given connection id is an actual connection between the given usernames, closes it.
 * @param username1
 * @param username2
 * @param connectionId
 * @param callback
 */
UserSchema.statics.endConnection = function(username1, username2, connectionId, callback){
    ConnectionModel.findOne({_id: connectionId})
        .populate({path: 'user1 user2'})
        .exec(function(err, connection){
            if (err){
                callback(err);
            } else if (!connection){
                callback(invalidConnectionId);
            } else {
                // check that we have the correct people
                if (((username1 == connection.user1.username) && (username2 == connection.user2.username)) ||
                    ((username2 == connection.user1.username) && (username1 == connection.user2.username))){
                    // check that the connection is actually open
                    if (!connection.endTime){
                        ConnectionModel.closeConnection(connectionId, function(err, connection){
                            if (err){
                                callback(err);
                            } else {
                                UserModel.update({username: {$in:[username1, username2]}},
                                    {$set:{currentConnection:{connectUser:  null, connection: null},
                                            'settings.connections.readyToConnect': false}},
                                    {multi: true},
                                    function(err, status){
                                        callback(err, connection);
                                    });
                            }
                        });
                    }
                }
            }
        });
};

/**
 * Returns the populated previous connections of a user, and also the user themself.
 * Populates the connections and their user1 and user2, so their usernames should be visible
 * @param username
 * @param callback
 */
UserSchema.statics.getPreviousConnections = function(username, callback){
    this.findOne({"username" : username})
        .populate({
            path:  'previousConnections',
            populate: { path: 'user1 user2 user1Notes user2Notes'}
        })
        .exec(function(err, user) {
        if (err) {
            callback(err);
        } else if (!user){
            callback(userNotRegisteredError);
        } else {
            callback(null, user.previousConnections, user);
        }
    });
};


/**
 * Returns the user with it's interest users populated
 * @param username
 * @param callback
 */
UserSchema.statics.getInterestUsers = function(username, callback){
    UserModel.findOne({username: username})
        .populate('topics')
        .populate({
            path:'interestUsers',
            populate: {path:'topics'}})
        .exec(callback);
};

/**
 * Passes all the users, sorted in descending order, in the database into the callback.
 * The interestUsers, disinterestUsers and blockedUsers are populated
 * @param callback {Function} Function to execute given the result. Usage: callback(error, arrayOfAllUsers)
 */
UserSchema.statics.getAllUsers = function(callback) {
    UserModel.find({})
        .sort({username: 1})
        .populate({ path: 'interestUsers disinterestUsers blockedUsers topics'})
        .exec(callback);
};

/**
 * Checks whether a user is on another user's blocklist by username
 * @param username the username of the user with a blocklist
 * @param possibleBlockName the username of the other user that might be on the first user's blocklist
 * @param callback {Function} Function to execute given the result. Usage: callback(error, otherUserWasBlocked)
 */
UserSchema.statics.isBlocked = function (username, possibleBlockName, callback) {
    UserModel.findOne({username: username})
    .exec(function(err, user) {
        if (err) {
            callback(err);
        } else if (!user) {
            callback(userNotRegisteredError);
        } else {
            UserModel.findOne({username: possibleBlockName}, function (err, possibleBlock) {
                if (err) {
                    callback(err)
                } else if (!possibleBlock) {
                    callback(userNotRegisteredError);
                } else {
                    var otherUserWasBlocked = (user.blockedUsers.filter(function (blockedUserId) {
                        return possibleBlock._id.equals(blockedUserId) }
                    ).length>0);
                    callback(null, otherUserWasBlocked);
                }
            });
        }
        
    });
}

/**
 * Updates the location of a user
 * @param username
 * @param location
 * @param callback
 */
UserSchema.statics.updateLocation = function (username, location, callback) {
    if (checkLocation(location)){
        UserModel.findOneAndUpdate(
            {username: username},
            {$set: {location: location}},
            {new: true},
            function (err, user) {
                if (err) {
                    callback(err);
                } else if (!user) {
                    callback(userNotRegisteredError);
                } else {
                    callback(null, user);
                }
            });
    } else {
        callback(invalidZipcodeError);
    }

};

/**
 * Updates the preference overlap for a user
 * @param username
 * @param topicOverlap
 * @param callback
 */
UserSchema.statics.updatePreferenceTopicOverlap = function (username, topicOverlap, callback) {
    if (checkTopicOverlap(topicOverlap)){
        UserModel.findOneAndUpdate(
            {username: username},
            {$set: {'preferences.topicOverlap': topicOverlap}},
            {new: true},
            function (err, user) {
                if (err) {
                    callback(err);
                } else if (!user) {
                    callback(userNotRegisteredError);
                } else {
                    callback(null, user);
                }
            });
    } else {
        callback(invalidTopicOverlap);
    }
};

/**
 * Updates the location radius preference for a user
 * @param username
 * @param locationRadius
 * @param callback
 */
UserSchema.statics.updatePreferenceLocationRadius = function (username, locationRadius, callback) {
    if (checkLocationRadius(locationRadius)){
        UserModel.findOneAndUpdate(
            {username: username},
            {$set: {'preferences.locationRadius': parseInt(locationRadius)}},
            {new: true},
            function (err, user) {
                if (err) {
                    callback(err);
                } else if (!user) {
                    callback(userNotRegisteredError);
                } else {
                    callback(null, user);
                }
            });
    } else {
        callback(invalidLocationRadius);
    }
};

// Validations
UserSchema.path("username").validate(function(value) {
    // only lower case letters are allowed.
    return value.toLowerCase() === value;
}, "Username can only have lower case letters");

UserSchema.path("username").validate(function(value) {
    // allowed are letters, numbers, -, _, . no space
    // This uses a Regular Expression to check this.
    return /^[a-zA-Z0-9._-]+$/.test(value);
}, "Invalid characters in the Username");

UserSchema.path("username").validate(function(value) {
    // allowed length is between 3 and 20
    // This uses a Regular Expression to check this.
    return ((value.length>=3) && (value.length<=20));
}, "Invalid length for the Username");

UserSchema.path("email").validate(function(value) {
    // This uses a Regular Expression to check if this is a valid email.
    return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(value);
}, "Invalid Email Address");

UserSchema.path("publicEmail").validate(function(value) {
    // This uses a Regular Expression to check if this is a valid email.
    return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(value);
}, "Invalid Email Address");

var UserModel = mongoose.model("User", UserSchema);

module.exports = UserModel;