/**
 * Created by Shinjini on 11/27/2016.
 */

var mongoose = require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var objectIdConverter = mongoose.Types.ObjectId;
var errorHandler = require('./ErrorHandler');
var utils = require('./Utility');
var NoteModel = require('./Note');


var ConnectionSchema = mongoose.Schema({
    user1 : {type: ObjectId, ref: "User", required: true},
    user2: {type: ObjectId, ref: "User", required: true},
    openTime : {type: String, required: true},
    open : {type: Boolean, default: true},
    closeTime : {type: String, default: null},
    user1Notes : [{type: ObjectId, ref: "Note"}],
    user2Notes: [{type: ObjectId, ref: "Note"}]
});

// common errors
var userNotInConnectionError = errorHandler.appError(errorHandler.errNums.userNotInConnection);
var invalidNoteLengthError = errorHandler.appError(errorHandler.errNums.invalidNoteLength);
var noteNotInConnectionError = errorHandler.appError(errorHandler.errNums.noteNotInConnection);

/** Helper private functions **/


/**
 * Returns which user (user1 or user2) in the connection the given user is
 * Note: usernumber returned may be null!
 * @param userId
 * @param connection
 * @returns {*}
 */
var findUserNumber = function(userId, connection){
    var userNumber = null;
    if (objectIdConverter(userId).equals(connection.user1)){ // then this is user1
        userNumber = 1;
    } else if (objectIdConverter(userId).equals(connection.user2)){ // then this is user2
        userNumber = 2;
    }
    return userNumber;
};

var checkNoteContentFormat = function(content){
    return ((content.length > 0) && (content.length <= 250 ))
};


/**
 * Creates a connection
 * NOTE: does not care about whether the users are connected or not! It is the UserModels job to do it before
 * calling this function
 * @param user1Id
 * @param user2Id
 * @param callback
 */
ConnectionSchema.statics.createConnection = function(user1Id, user2Id, callback) {
    var data = {user1 : user1Id,
        user2: user2Id,
        openTime : utils.getTimeNowInUTC()
    };
    ConnectionModel.create(data, callback);
};

/**
 * Closes a connection if it exists
 * @param connectionId
 * @param callback
 */
ConnectionSchema.statics.closeConnection = function(connectionId, callback) {
    ConnectionModel.findOneAndUpdate(
        {_id: connectionId},
        {$set:{open: false, closeTime: utils.getTimeNowInUTC()}},
        {new: true},
        callback);
};


/**
 * Gets the notes written by a user for a particular connection. This checks that the user is in the connection,
 * so don't need to check that before. Returns an error if the user is not part of the connection.
 * @param connectionId
 * @param userId
 * @param callback
 */
ConnectionSchema.statics.getNotes = function(connectionId, userId, callback){
    ConnectionModel.findOne({_id: connectionId})
        .populate({path: 'user1Notes user2Notes'})
        .exec(function(err, connection){
            if (err){
                callback(err);
            } else {
                var userNumber = findUserNumber(userId, connection);
                if (!userNumber){
                    callback(userNotInConnectionError);
                } else {
                    callback(null, connection['user'+userNumber+'Notes']);
                }
            }
        });

};

/**
 * Adds a new note to a connection. Returns errors if the user is not part of the connection, or if the note is
 * malformed.
 * @param connectionId
 * @param userId
 * @param content
 * @param callback
 */
ConnectionSchema.statics.addNote = function(connectionId, userId, content, callback){
    if (checkNoteContentFormat(content)){
        ConnectionModel.findOne({_id: connectionId})
            .exec(function(err, connection){
                if (err){
                    callback(err);
                } else {
                    var userNumber = findUserNumber(userId, connection);
                    if (!userNumber){
                        callback(userNotInConnectionError);
                    } else {
                        NoteModel.makeNote(userId, content, function(err, note){
                            if (err){
                                callback(err);
                            } else {
                                var pushUpdate = {$push:{}};
                                // since I can't generate this "user1Notes" or "user2Notes" string
                                // in the update itself like this, I'm doing it here.
                                pushUpdate.$push['user'+userNumber+'Notes'] = note._id;
                                ConnectionModel.findOneAndUpdate(
                                    {_id: connectionId},
                                    pushUpdate,
                                    {new: true},
                                    function(err, connection){
                                        callback(err, connection, note);
                                    });
                            }
                        });
                    }
                }
            });

    } else {
        callback(invalidNoteLengthError);
    }

};

/**
 * Updates note to a connection. Returns errors if the user is not part of the connection, or if the note
 * is not part of the connection or if it is malformed.
 * @param connectionId
 * @param userId
 * @param noteId
 * @param newContent
 * @param callback
 */
ConnectionSchema.statics.updateNote = function(connectionId, userId, noteId, newContent, callback){
    if (checkNoteContentFormat(newContent)) {
        ConnectionModel.findOne({_id: connectionId})
            .exec(function (err, connection) {
                if (err) {
                    callback(err);
                } else {
                    var userNumber = findUserNumber(userId, connection);
                    if (!userNumber) {
                        callback(userNotInConnectionError);
                    } else {
                        var noteInConnection = false;
                        connection['user'+userNumber+'Notes'].forEach(function(connNoteId){
                            if (objectIdConverter(connNoteId).equals(noteId)){
                                noteInConnection = true;
                            }
                        });
                        if (noteInConnection){
                            NoteModel.updateNote(noteId, newContent, function (err, note) {
                                callback(err, connection, note);
                            });
                        } else {
                            callback(noteNotInConnectionError);
                        }
                    }
                }
            });
    } else {
        callback(invalidNoteLengthError);
    }
};

/**
 * Deletes a note in a connection (that, is, marks it as deleted). Returns errors if the user is not
 * part of the connection or if the note is not in the connection.
 * @param connectionId
 * @param userId
 * @param noteId
 * @param callback
 */
ConnectionSchema.statics.deleteNote = function(connectionId, userId, noteId, callback){
    ConnectionModel.findOne({_id: connectionId})
        .exec(function(err, connection){
            if (err){
                callback(err);
            } else {
                var userNumber = findUserNumber(userId, connection);
                if (!userNumber){
                    callback(userNotInConnectionError);
                } else {
                    var noteInConnection = false;
                    connection['user'+userNumber+'Notes'].forEach(function(connNoteId){
                        if (objectIdConverter(connNoteId).equals(noteId)){
                            noteInConnection = true;
                        }
                    });
                    if (noteInConnection){
                        NoteModel.deleteNote(noteId, function(err, note){
                            callback(err, connection, note);
                        });
                    } else {
                        callback(noteNotInConnectionError);
                    }
                }
            }
        });

};


// Validations


var ConnectionModel = mongoose.model("Connection", ConnectionSchema);

module.exports = ConnectionModel;