/**
 * Created by Shinjini on 12/3/2016.
 */

var mongoose = require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var errorHandler = require('./ErrorHandler');
var utils = require('./Utility');

var NoteSchema = mongoose.Schema({
    author : {type: ObjectId, ref: "User", required: true},
    versions : [{content:{type: String, required: true},  writeTime : {type: String, required: true}}], // required should make it have atleast one element
    deleted: {type: Boolean, required: true, default: false}
});

// common error
var noteDoesNotExistError = errorHandler.appError(errorHandler.errNums.noteDoesNotExistError);
var noteTooLongError = errorHandler.appError(errorHandler.errNums.invalidNoteLength);

// NOTE: the note db doesn't care about users and connections being correct: those checks should be done BEFORE using these!

/**
 * Helpers
 */

/**
 * Checks that the content is between 1 and 250 chars long.
 * @param content
 * @returns {boolean}
 */
var validateNoteContent = function(content){
    return (content.length<500) && (content.length>0);
};

/**
 * Adds a note dated at the time this function is called. Returns an error if the content is malformed.
 * This does not care about users and connections being correct: those checks should be done BEFORE using this.
 * @param userId
 * @param content
 * @param callback
 */
NoteSchema.statics.makeNote = function(userId, content, callback){
    if (validateNoteContent(content)){
        var data = {author : userId,
            versions : [{content: content, writeTime: utils.getTimeNowInUTC()}]
        };
        NoteModel.create(data, callback);
    } else {
        callback(noteTooLongError);
    }
};

/**
 * Gets a note from the db. Versions should already be in chronological order.
 * This does not care about users and connections being correct: those checks should be done BEFORE using this.
 * @param noteId
 * @param callback
 */
NoteSchema.statics.getNote = function(noteId, callback){
    NoteModel.findOne(
        {_id: noteId},
        function (err, note) {
            if (err) {
                callback(err);
            } else if (!note) { // note is either an object or null, so this check is ok
                callback(noteDoesNotExistError);
            } else {
                callback(null, note);
            }
        });
};

/**
 * Updates a given note with new content. If the content is malformed, returns an error.
 * This does not care about users and connections being correct: those checks should be done BEFORE using this.
 * @param noteId
 * @param newContent
 * @param callback
 */
NoteSchema.statics.updateNote = function(noteId, newContent, callback){
    if (validateNoteContent(newContent)) {
        var newNote = {content: newContent, writeTime: utils.getTimeNowInUTC()};
        NoteModel.findOneAndUpdate(
            {_id: noteId},
            {$push: {versions: newNote}},
            {new: true},
            function (err, note) {
                if (err) {
                    callback(err);
                } else if (!note) { // note is either an object or null, so this check is ok
                    callback(noteDoesNotExistError);
                } else {
                    callback(null, note);
                }
            });
    } else {
        callback(noteTooLongError);
    }
};

/**
 * Marks a note as deleted.
 * This does not care about users and connections being correct: those checks should be done BEFORE using this.
 * @param noteId
 * @param callback
 */
NoteSchema.statics.deleteNote = function(noteId, callback){
        NoteModel.findOneAndUpdate({_id: noteId},
            {$set:{deleted: true}})
            .exec(callback);
};

var NoteModel = mongoose.model("Note", NoteSchema);

module.exports = NoteModel;