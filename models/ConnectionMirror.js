var UserModel = require("./User");
var ConnectionModel = require('./Connection');

var ConnectionMirror = function () {
    var that = Object.create(ConnectionMirror);

    // Get the other user in a connection
    // @param callback(err, otherUser)
    that.mirrorConnection = function (connectionId, userId, callback) {
        ConnectionModel.findOne({_id: connectionId}, function (err, connection) {
            // If this user is user1, give us user2
            // Otherwise, give us user1
            var otherUserId = userId.equals(connection.user1) ? connection.user2 : connection.user1;

            UserModel.getUserById(otherUserId, callback);
        });
    };

    Object.freeze(that);
    return that;
};

module.exports = ConnectionMirror();