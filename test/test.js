var assert = require("assert");
var mongoose = require("mongoose");
var UserModel = require('../models/User');

var suggestions = require("../models/SuggestionFinder");
var connectionFinder = require('../models/ConnectionFinder');
var utils = require('../models/Utility');

var bcrypt = require('bcrypt-nodejs');

var makeAvailabilityArray = function(startHoursFromNow, endHoursFromNow){
    var array = [];
    for (var i = startHoursFromNow; i<endHoursFromNow; i++){
        var now = new Date();
        var thisHour = now.getHours();
        var thisDate = now.getDate();
        var thisMonth = now.getMonth();
        var thisYear = now.getFullYear();
        var time = (new Date(thisYear, thisMonth, thisDate, thisHour+i)).getTime();
        var UTCTime = time + now.getTimezoneOffset()* 60000;
        array.push(String(UTCTime));
    }
    return array
};

describe("App", function() {
    // The mongoose connection object.
    var con;

    // Before running any test, connect to the database.
    before(function(done) {
        con = mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/phoenixtestdb", function() {
            done();
        });
    });

    // Delete the database before each test.
    // That is, before each 'it'
    beforeEach(function(done) {
        con.connection.db.dropDatabase(function() { done(); });
    });

    var addUser = function(username, info, callback){
        info.username = username;
        info.email = 'user@email.com';
        info.publicEmail = info.email;
        if (!info.password){
            info.password = 'password';
        }
        // location, topics and preferences will be tested later
        info.location = '02142';
        info.preferences = {locationRadius: 0, topicOverlap:'0,0'};
        info.settings = {connections:{
                readyToConnect: true,
                alwaysReadyToConnect: false
            }};

        info.currentConnection = {
            connectUser: null,
            connection: null
        };
        bcrypt.hash(info.password, null, null, function(err, hash) {
            info.passwordHash = hash;
            UserModel.create(info, callback);
        });
    };

    describe('UserModel', function() {
        // UserModel
        //
        // addUser
        // getUser
        // userNotInDB
        //
        // TODO update availability
        // TODO remove outdated availability
        // TODO add interest users
        // TODO remove interest users
        // TODO many other things. We need to prioritize here.


        describe('addUser and isUserNotInDB', function () {
            var addUserUsingUsermodel = function(username, password, callback){
                if (!password){
                    password = 'password';
                }
                UserModel.addUser(username, password, 'user@email.com', 'user@email.com', callback);
            };

            it('should throw an error for bad usernames', function (done) {
                addUserUsingUsermodel('user1_*^', null, function(err, user){
                    assert.ok(err);
                    done();
                });
            });

            it('should throw an error for bad passwords', function (done) {
                addUserUsingUsermodel('user1', 'aaasdashjsadfg"*6786aaa', function(err, user){
                    assert.ok(err);
                    done();
                });
            });

            it('should find the newly added user in DB', function (done) {
                addUserUsingUsermodel('user1', null, function(err, user){
                    UserModel.userNotInDB('user1', function(err, isNotInDB){
                        assert.ok(!isNotInDB);
                        done();
                    });
                });
            });

            it('should not find users not in the database', function (done) {
                UserModel.userNotInDB('userNot1', function(err, isNotInDB){
                    assert.ok(isNotInDB);
                    done();
                });
            });

            it('should not add an already existing user', function (done) {
                addUserUsingUsermodel('user1', null, function(err, user){
                    addUserUsingUsermodel('user1', null, function(err, user){
                        assert.ok(err);
                        done();
                    });
                });
            });
        });


        describe('getUser', function () {
            it('should get a user in the db', function (done) {
                addUser('user1', {password:'ababa'}, function (err, user1) {
                    addUser('user2', {password:'aaaaa'}, function (err, user2) {
                        addUser('user3', {password:'aaaaa'}, function (err, user3) {
                            UserModel.getUser('user1', function (err, user1) {
                                assert.equal(user1.username, 'user1');
                                bcrypt.compare('ababa', user1.passwordHash, function(err, res) {
                                    assert.ok(res);
                                    done();
                                });
                            });
                        });
                    });
                });
            });

            it('should not get a user not in the db', function (done) {
                addUser('user1', {}, function (err, user) {
                    addUser('user2', {}, function (err, user) {
                        addUser('user3', {}, function (err, user) {
                            UserModel.getUser('user5', function (err, user) {
                                assert.ok(err);
                                done();
                            });
                        });
                    });
                });
            });
        });

        describe('addInterestUser', function(){
            it ('should not add yourself and throw an error', function(done){
                this.timeout(10000); // 10 seconds
                var a = makeAvailabilityArray(1, 3);
                addUser('user1', {availability: a}, function (err, user1) {
                    if (err) console.log(err);
                    UserModel.addInterestUser(user1.username, user1.username, function(err){
                        assert(err);
                        done();
                    });
                });
            });
        });

        describe('addDisinterestUser', function(){
            it ('should not add yourself and throw an error', function(done){
                this.timeout(10000); // 10 seconds
                var a = makeAvailabilityArray(1, 3);
                addUser('user1', {availability: a}, function (err, user1) {
                    if (err) console.log(err);
                    UserModel.addDisinterestUser(user1.username, user1.username, function(err){
                        assert(err);
                        done();
                    });
                });
            });

            it ('should not delete an existing connection', function(done){
                this.timeout(10000); // 10 seconds
                var a = makeAvailabilityArray(1, 3);
                addUser('user1', {availability: a}, function (err, user1) {
                    if (err) console.log(err);
                    addUser('user2', {availability: a}, function (err, user2) {
                        if (err) console.log(err);
                        UserModel.addInterestUser(user1.username, user2.username, function(err){
                            if (err) console.log(err);
                            UserModel.addInterestUser(user2.username, user1.username, function(err){
                                if (err) console.log(err);
                                connectionFinder.makeNewConnection(user1.username, function(err, connectionInfo) {
                                    if (err) console.log(err);
                                    UserModel.addDisinterestUser(user1.username, user2.username, function(){
                                        UserModel.getConnectUser(user1.username, function(err, user1){
                                            assert(user1.currentConnection.connectUser.username == user2.username);
                                            done();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });

            });
        });

        describe('connectTwoUsers', function(){
            it ('should not connect yourself, should throw an error', function(done){
                this.timeout(10000); // 10 seconds
                var a = makeAvailabilityArray(1, 3);
                addUser('user1', {availability: a}, function (err, user1) {
                    if (err) console.log(err);
                    UserModel.connectTwoUsers(user1.username, user1.username, function(err){
                        assert(err);
                        done();
                    })
                });
            });
        });
    });

    describe('SuggestionFinder', function() {
        describe('find Suggestions Given Username And Their Connection', function(){
            it ('does not match if the other user is in this users disinterest list', function(done){
                this.timeout(10000); // 10 seconds
                var a = makeAvailabilityArray(1, 3);

                addUser('user1', {availability: a}, function (err, user1) {
                    if (err) console.log(err);
                    addUser('user2', {availability: a}, function (err, user2) {
                        if (err) console.log(err);
                        UserModel.addDisinterestUser(user1.username, user2.username, function(){
                            suggestions.findSuggestionsGivenUsernameAndTheirConnection(user1.username, null, function(err, matchingUsersInfo) {
                                assert(matchingUsersInfo.length == 0);
                                done();
                            });
                        });
                    });
                });
            });
            it ('does not match if this user is in the other users disinterest list', function(done){
                this.timeout(10000); // 10 seconds
                var a = makeAvailabilityArray(1, 3);

                addUser('user1', {availability: a}, function (err, user1) {
                    if (err) console.log(err);
                    addUser('user2', {availability: a}, function (err, user2) {
                        if (err) console.log(err);
                        UserModel.addDisinterestUser(user2.username, user1.username, function(){
                            suggestions.findSuggestionsGivenUsernameAndTheirConnection(user1.username, null, function(err, matchingUsersInfo) {
                                assert(matchingUsersInfo.length == 0);
                                done();
                            });
                        });
                    });
                });

            });
            it ('matches even if you have a connection', function(done){
                this.timeout(10000); // 10 seconds
                var a = makeAvailabilityArray(1, 3);

                addUser('user1', {availability: a}, function (err, user1) {
                    if (err) console.log(err);
                    addUser('user2', {availability: a}, function (err, user2) {
                        if (err) console.log(err);
                        UserModel.addInterestUser(user1.username, user2.username, function(err){
                            if (err) console.log(err);
                            UserModel.addInterestUser(user2.username, user1.username, function(err){
                                if (err) console.log(err);
                                connectionFinder.makeNewConnection(user1.username, function(err, connectionInfo) {
                                    if (err) console.log(err);
                                    addUser('user3', {availability: a}, function (err, user3) {
                                        suggestions.findSuggestionsGivenUsernameAndTheirConnection(user1.username, null, function(err, matchingUsersInfo) {
                                            if (err) console.log(err);
                                            assert(matchingUsersInfo.length == 2);
                                            done();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
            it ('matches even if they have a connection', function(done){
                this.timeout(10000); // 10 seconds
                var a = makeAvailabilityArray(1, 3);

                addUser('user1', {availability: a}, function (err, user1) {
                    if (err) console.log(err);
                    addUser('user2', {availability: a}, function (err, user2) {
                        if (err) console.log(err);
                        UserModel.addInterestUser(user1.username, user2.username, function(err){
                            if (err) console.log(err);
                            UserModel.addInterestUser(user2.username, user1.username, function(err){
                                if (err) console.log(err);
                                connectionFinder.makeNewConnection(user1.username, function(err, connectionInfo) {
                                    if (err) console.log(err);
                                    addUser('user3', {availability: a}, function (err, user3) {
                                        suggestions.findSuggestionsGivenUsernameAndTheirConnection(user3.username, null, function(err, matchingUsersInfo) {
                                            if (err) console.log(err);
                                            assert(matchingUsersInfo.length == 2);
                                            done();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });

            it ('otherwise there is a match', function(done){
                this.timeout(10000); // 10 seconds
                var a1 = makeAvailabilityArray(1, 3);
                var a2 = makeAvailabilityArray(1, 3);

                addUser('user1', {availability: a1}, function (err, user1) {
                    if (err) console.log(err);
                    addUser('user2', {availability: a2}, function (err, user2) {
                        if (err) console.log(err);
                        suggestions.findSuggestionsGivenUsernameAndTheirConnection(user1.username, null, function(err, matchingUsersInfo) {
                            if (err) console.log(err);
                            assert(matchingUsersInfo.length == 1);
                            assert(utils.checkArraysEqualUnordered(a1, matchingUsersInfo[0].matchingTimes));
                            done();
                        });
                    });
                });
            });
        });
    });


    describe('ConnectionFinder', function() {
        describe('make new connection', function(){
            it ('does not make a connection if the user is not ready', function(done){
                this.timeout(10000); // 10 seconds
                var a = makeAvailabilityArray(1, 3);

                addUser('user1', {availability: a}, function (err, user1) {
                    if (err) console.log(err);
                    addUser('user2', {availability: a}, function (err, user2) {
                        if (err) console.log(err);
                        UserModel.addInterestUser(user1.username, user2.username, function(err){
                            if (err) console.log(err);
                            UserModel.addInterestUser(user2.username, user1.username, function(err){
                                if (err) console.log(err);
                                UserModel.updateConnectionSettings(user1.username, 'false', 'false', function(err){
                                    if (err) console.log(err);
                                    connectionFinder.makeNewConnection(user1.username, function(err, connectionInfo) {
                                        if (err) console.log(err);
                                        assert(!connectionInfo);
                                        done();
                                    });
                                });
                            });
                        });
                    });
                });
            });
            it ('does not make a connection if the other user is not ready', function(done){
                this.timeout(10000); // 10 seconds
                var a = makeAvailabilityArray(1, 3);

                addUser('user1', {availability: a}, function (err, user1) {
                    if (err) console.log(err);
                    addUser('user2', {availability: a}, function (err, user2) {
                        if (err) console.log(err);
                        UserModel.addInterestUser(user1.username, user2.username, function(err){
                            if (err) console.log(err);
                            UserModel.addInterestUser(user2.username, user1.username, function(err){
                                if (err) console.log(err);
                                UserModel.updateConnectionSettings(user2.username, 'false', 'false', function(){
                                    connectionFinder.makeNewConnection(user1.username, function(err, connectionInfo) {
                                        if (err) console.log(err);
                                        assert(!connectionInfo);
                                        done();
                                    });
                                });
                            });
                        });
                    });
                });

            });
            it ('does not make a connection if the user is not interested', function(done){
                this.timeout(10000); // 10 seconds
                var a = makeAvailabilityArray(1, 3);

                addUser('user1', {availability: a}, function (err, user1) {
                    if (err) console.log(err);
                    addUser('user2', {availability: a}, function (err, user2) {
                        if (err) console.log(err);
                        UserModel.addInterestUser(user2.username, user1.username, function(err){
                            if (err) console.log(err);
                            connectionFinder.makeNewConnection(user1.username, function(err, connectionInfo) {
                                if (err) console.log(err);
                                assert(!connectionInfo);
                                done();
                            });
                        });
                    });
                });

            });
            it ('does not make a connection if the other user is not interested', function(done){
                this.timeout(10000); // 10 seconds
                var a = makeAvailabilityArray(1, 3);

                addUser('user1', {availability: a}, function (err, user1) {
                    if (err) console.log(err);
                    addUser('user2', {availability: a}, function (err, user2) {
                        if (err) console.log(err);
                        UserModel.addInterestUser(user1.username, user2.username, function(err){
                            if (err) console.log(err);
                            connectionFinder.makeNewConnection(user1.username, function(err, connectionInfo) {
                                if (err) console.log(err);
                                assert(!connectionInfo);
                                done();
                            });
                        });
                    });
                });

            });

            it ('does not make a connection if the user is interested and also disinterested', function(done){
                this.timeout(10000); // 10 seconds
                var a = makeAvailabilityArray(1, 3);

                addUser('user1', {availability: a}, function (err, user1) {
                    if (err) console.log(err);
                    addUser('user2', {availability: a}, function (err, user2) {
                        if (err) console.log(err);
                        UserModel.addInterestUser(user1.username, user2.username, function(err){
                            if (err) console.log(err);
                            UserModel.addInterestUser(user2.username, user1.username, function(err){
                                if (err) console.log(err);
                                UserModel.addDisinterestUser(user1.username, user2.username, function(){
                                    connectionFinder.makeNewConnection(user1.username, function(err, connectionInfo) {
                                        if (err) console.log(err);
                                        assert(!connectionInfo);
                                        done();
                                    });
                                });
                            });
                        });
                    });
                });
            });
            it ('does not make a connection if the other user is interested and also disinterested', function(done){
                this.timeout(10000); // 10 seconds
                var a = makeAvailabilityArray(1, 3);

                addUser('user1', {availability: a}, function (err, user1) {
                    if (err) console.log(err);
                    addUser('user2', {availability: a}, function (err, user2) {
                        if (err) console.log(err);
                        UserModel.addInterestUser(user1.username, user2.username, function(err){
                            if (err) console.log(err);
                            UserModel.addInterestUser(user2.username, user1.username, function(err){
                                if (err) console.log(err);
                                UserModel.addDisinterestUser(user2.username, user1.username, function(){
                                    connectionFinder.makeNewConnection(user1.username, function(err, connectionInfo) {
                                        if (err) console.log(err);
                                        assert(!connectionInfo);
                                        done();
                                    });
                                });
                            });
                        });
                    });
                });
            });

            it ('does not make a connection if the user is already connected and throws an error', function(done){
                this.timeout(10000); // 10 seconds
                var a = makeAvailabilityArray(1, 3);

                addUser('user1', {availability: a}, function (err, user1) {
                    if (err) console.log(err);
                    addUser('user2', {availability: a}, function (err, user2) {
                        if (err) console.log(err);
                        UserModel.addInterestUser(user1.username, user2.username, function(err){
                            if (err) console.log(err);
                            UserModel.addInterestUser(user2.username, user1.username, function(err){
                                if (err) console.log(err);
                                connectionFinder.makeNewConnection(user1.username, function(err, connectionInfo) {
                                    if (err) console.log(err);
                                    addUser('user3', {availability: a}, function (err, user3) {
                                        connectionFinder.makeNewConnection(user1.username, function(err, connectionInfo) {
                                            assert(err);
                                            assert(!connectionInfo);
                                            done();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
            it ('does not make a connection if the other user is already connected', function(done){
                this.timeout(10000); // 10 seconds
                var a = makeAvailabilityArray(1, 3);

                addUser('user1', {availability: a}, function (err, user1) {
                    if (err) console.log(err);
                    addUser('user2', {availability: a}, function (err, user2) {
                        if (err) console.log(err);
                        UserModel.addInterestUser(user1.username, user2.username, function(err){
                            if (err) console.log(err);
                            UserModel.addInterestUser(user2.username, user1.username, function(err){
                                if (err) console.log(err);
                                connectionFinder.makeNewConnection(user1.username, function(err, connectionInfo) {
                                    if (err) console.log(err);
                                    addUser('user3', {availability: a}, function (err, user3) {
                                        connectionFinder.makeNewConnection(user3.username, function(err, connectionInfo) {
                                            if (err) console.log(err);
                                            assert(!connectionInfo);
                                            done();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });

            });

            it ('otherwise there is a connection', function(done){
                this.timeout(10000); // 10 seconds
                var a1 = makeAvailabilityArray(1, 3);
                var a2 = makeAvailabilityArray(1, 3);

                addUser('user1', {availability: a1}, function (err, user1) {
                    if (err) console.log(err);
                    addUser('user2', {availability: a2}, function (err, user2) {
                        if (err) console.log(err);
                        UserModel.addInterestUser(user1.username, user2.username, function(err){
                            if (err) console.log(err);
                            UserModel.addInterestUser(user2.username, user1.username, function(err){
                                if (err) console.log(err);
                                connectionFinder.makeNewConnection(user1.username, function(err, connectionInfo) {
                                    if (err) console.log(err);
                                    assert(connectionInfo.username == user2.username);
                                    done();
                                });
                            });
                        });
                    });
                });
            });

        });
    });


}); // End describe App.

describe('No db required', function(){


    describe('SuggestionFinder', function() {

        var makeUserInfo = function(availability, location, preferences, topics){
            if (!availability){
                availability = [];
            }
            if (!location){
                location = '02142'
            }
            if (!preferences){
                preferences = {}
            }
            if (!preferences.locationRadius){
                preferences.locationRadius = 0
            }
            if (!preferences.topicOverlap){
                preferences.topicOverlap = '0,0'
            }
            if (!topics){
                topics = []
            }

            return {
                availability: availability,
                location: location,
                preferences: preferences,
                topics: topics
            }
        };


        describe('findMatchingTimes', function(){
            it('should find matching times', function(){
                var a1 = makeAvailabilityArray(0, 3);
                var a2 = makeAvailabilityArray(1, 10);

                var matchTimes = suggestions.findMatchingTimes(a1, a2);
                assert(utils.checkArraysEqualUnordered(a1.slice(1, 3), matchTimes));
            });

            it ('should not find non-overlapping times', function(){
                var a1 = makeAvailabilityArray(0, 3);
                var a2 = makeAvailabilityArray(5, 10);

                var matchTimes = suggestions.findMatchingTimes(a1, a2);
                assert(matchTimes.length == 0);
            });
        });

        describe('findMatchesGivenTwoUserInfos', function() {
            it('should find matching users and their times for this users', function () {
                var a1 = makeAvailabilityArray(0, 3);
                var a2 = makeAvailabilityArray(1, 10);

                var userInfos = [{user1: makeUserInfo(a1)}, {user2: makeUserInfo(a2)}];

                var matchingUsers = suggestions.findMatchesGivenTwoUserInfos(userInfos[0], userInfos[1]);
                assert(matchingUsers.length == 1);
                assert(utils.checkArraysEqualUnordered(a1.slice(1, 3), matchingUsers[0].matchingTimes));
            });

            it('should not matching users for non-overlapping times', function () {
                var a1 = makeAvailabilityArray(0, 3);
                var a2 = makeAvailabilityArray(5, 10);

                var userInfos = [{user1: makeUserInfo(a1)}, {user2: makeUserInfo(a2)}];

                var matchingUsers = suggestions.findMatchesGivenTwoUserInfos(userInfos[0], userInfos[1]);
                assert(matchingUsers.length == 0);
            });
        });


        describe('findMatchesGivenTwoUserInfos location and locationOverlap', function(){
            it ('should work for distance radius small', function(){
                var a1 = makeAvailabilityArray(0, 3);
                var a2 = makeAvailabilityArray(1, 10);

                var userInfos = [{user1: makeUserInfo(a1, '02142')}, {user2: makeUserInfo(a2, '02139')}];

                var matchingUsers = suggestions.findMatchesGivenTwoUserInfos(userInfos[0], userInfos[1]);
                assert(matchingUsers.length == 1);
                assert(utils.checkArraysEqualUnordered(a1.slice(1, 3), matchingUsers[0].matchingTimes));

            });

            it ('should work for distance radius large', function(){
                var a1 = makeAvailabilityArray(0, 3);
                var a2 = makeAvailabilityArray(1, 10);

                var userInfos = [
                    {user1: makeUserInfo(a1, '02142', {locationRadius: 3500})},
                    {user2: makeUserInfo(a2, '94102', {locationRadius: 3500})}
                    ];

                var matchingUsers = suggestions.findMatchesGivenTwoUserInfos(userInfos[0], userInfos[1]);
                assert(matchingUsers.length == 1);
                assert(utils.checkArraysEqualUnordered(a1.slice(1, 3), matchingUsers[0].matchingTimes));

            });

            it ('should not work for non overlapping locations, distance radius small', function(){
                var a1 = makeAvailabilityArray(0, 3);
                var a2 = makeAvailabilityArray(1, 10);

                var userInfos = [
                    {user1: makeUserInfo(a1, '02142')},
                    {user2: makeUserInfo(a2, '94102')}
                ];

                var matchingUsers = suggestions.findMatchesGivenTwoUserInfos(userInfos[0], userInfos[1]);
                assert(matchingUsers.length == 0);

            });

            it ('should work not work for non overlapping locations, distance radius large', function(){
                var a1 = makeAvailabilityArray(0, 3);
                var a2 = makeAvailabilityArray(1, 10);

                var userInfos = [
                    {user1: makeUserInfo(a1, '02142', {locationRadius: 2500})},
                    {user2: makeUserInfo(a2, '94102', {locationRadius: 2500})}
                ];
                var matchingUsers = suggestions.findMatchesGivenTwoUserInfos(userInfos[0], userInfos[1]);
                assert(matchingUsers.length == 0);
            });

        });

        describe('findMatchesGivenTwoUserInfos topic and topicOverlap', function(){
            var allTopics = [
                {name: 'a1', position: 'b11'},
                {name: 'a1', position: 'b12'},
                {name: 'a1', position: 'b13'},
                {name: 'a1', position: 'b14'},
                {name: 'a1', position: 'b15'},

                {name: 'a2', position: 'b21'},
                {name: 'a2', position: 'b22'},
                {name: 'a2', position: 'b23'},
                {name: 'a2', position: 'b24'},
                {name: 'a2', position: 'b25'},

                {name: 'a3', position: 'b31'},
                {name: 'a3', position: 'b32'},
                {name: 'a3', position: 'b33'},
                {name: 'a3', position: 'b34'},
                {name: 'a3', position: 'b35'},

                {name: 'a4', position: 'b41'},
                {name: 'a4', position: 'b42'},
                {name: 'a4', position: 'b43'},
                {name: 'a4', position: 'b44'},
                {name: 'a4', position: 'b45'},

                {name: 'a5', position: 'b51'},
                {name: 'a5', position: 'b52'},
                {name: 'a5', position: 'b53'},
                {name: 'a5', position: 'b54'},
                {name: 'a5', position: 'b55'},
            ];

            // NOTE: the first person is the person whose preferences we are checking
            // In certain cases, checking the other person's perferences is also important

            // 2,2
            var yes22 = [
                [allTopics[0], allTopics[5], allTopics[10], allTopics[15]],
                [allTopics[0], allTopics[5], allTopics[6], allTopics[10], allTopics[15], allTopics[22]]
            ];

            var no22 = [
                [allTopics[0], allTopics[5], allTopics[10], allTopics[15]],
                [allTopics[1], allTopics[12], allTopics[18], allTopics[21], allTopics[22]]
            ];

            // 2,0
            var yes20 = [
                [allTopics[0], allTopics[5], allTopics[10], allTopics[15], allTopics[11] , allTopics[2], allTopics[11]],
                [allTopics[1], allTopics[5],  allTopics[12], allTopics[18], allTopics[21], allTopics[22]]
            ];

            var yes2020 = [
                [allTopics[0], allTopics[5], allTopics[10], allTopics[15]],
                [allTopics[1], allTopics[5],  allTopics[12], allTopics[18]]
            ];

            var no20 = [
                [allTopics[0], allTopics[5], allTopics[10], allTopics[15]],
                [allTopics[1], allTopics[5], allTopics[18], allTopics[21], allTopics[22], allTopics[23]]
            ];

            // 2,-1
            var yes2minus1 = [
                [allTopics[0], allTopics[5], allTopics[10], allTopics[15]],
                [allTopics[1], allTopics[6], allTopics[12], allTopics[18], allTopics[21], allTopics[22]]
            ];
            var no2minus1 = [
                [allTopics[0], allTopics[5], allTopics[10], allTopics[15]],
                [allTopics[1], allTopics[5], allTopics[12], allTopics[18], allTopics[21], allTopics[22]]
            ];

            var yes2minus12minus1 = [
                [allTopics[0], allTopics[4], allTopics[5], allTopics[10], allTopics[15], allTopics[19], allTopics[20]],
                [allTopics[1], allTopics[6], allTopics[12], allTopics[18], allTopics[21], allTopics[22]]
            ];

            var no2minus12minus1 = [
                [allTopics[0], allTopics[4], allTopics[5], allTopics[10], allTopics[15], allTopics[19]],
                [allTopics[1], allTopics[6], allTopics[12], allTopics[18], allTopics[21], allTopics[22]]
            ];

            // 1,2
            var yes12 = [
                [allTopics[0], allTopics[5], allTopics[10], allTopics[15]],
                [allTopics[5], allTopics[6], allTopics[10], allTopics[15], allTopics[23], allTopics[22]]
            ];
            var no12 = [
                [allTopics[0], allTopics[5], allTopics[10], allTopics[15], allTopics[11] , allTopics[2], allTopics[11]],
                [allTopics[1], allTopics[6],  allTopics[12], allTopics[18], allTopics[21], allTopics[22]]
            ];
            var no12_2 = [
                [allTopics[0], allTopics[5], allTopics[10], allTopics[15]],
                [allTopics[18], allTopics[21], allTopics[22]]
            ];

            // 1,0
            var yes10 = [
                [allTopics[0], allTopics[5], allTopics[10], allTopics[15], allTopics[11] , allTopics[2], allTopics[11]],
                [allTopics[1], allTopics[6],  allTopics[12], allTopics[18], allTopics[21], allTopics[22]]
            ];

            var no10 = [
                [allTopics[0], allTopics[5], allTopics[10]],
                [allTopics[18], allTopics[21], allTopics[22]]
            ];

            // 0,0
            var yes00 = [
                [allTopics[3], allTopics[5], allTopics[20], allTopics[16], allTopics[23]],
                [allTopics[0], allTopics[3],  allTopics[7], allTopics[9], allTopics[21], allTopics[22]]
            ];

            // -1,0
            var yesminus10 = [
                [allTopics[0], allTopics[5], allTopics[10], allTopics[14]],
                [allTopics[15], allTopics[16], allTopics[17], allTopics[24], allTopics[22]]
            ];

            var nominus10 = [
                [allTopics[0], allTopics[5], allTopics[10], allTopics[14]],
                [allTopics[1], allTopics[15], allTopics[16], allTopics[17], allTopics[24], allTopics[22]]
            ];


            var test = function(pass, overlap, topicArrays){
                var a1 = makeAvailabilityArray(0, 3);
                var a2 = makeAvailabilityArray(1, 10);

                var userInfos = [
                    {user1: makeUserInfo(a1, null, {topicOverlap: overlap[0]}, topicArrays[0])},
                    {user2: makeUserInfo(a2, null, {topicOverlap: overlap[1]}, topicArrays[1])}
                ];

                var matchingUsers = suggestions.findMatchesGivenTwoUserInfos(userInfos[0], userInfos[1]);
                if (pass){
                    assert(matchingUsers.length == 1);
                    assert(utils.checkArraysEqualUnordered(a1.slice(1, 3), matchingUsers[0].matchingTimes));
                } else {
                    assert(matchingUsers.length == 0);
                }
            };

            describe('2,2', function(){
                it ('2,2; 0,0 yes', function(){
                    test(true, ['2,2', '0,0'], yes22);
                });

                it ('2,2; 0,0, no', function(){
                    test(false, ['2,2', '0,0'], no22);
                });

                it ('2,2; 1,2 yes', function(){
                    test(true, ['2,2', '1,2'], yes22);
                });

                it ('2,2; 2,2 yes', function(){
                    test(true, ['2,2', '2,2'], [yes22[0], yes22[0]]);
                });

                it ('2,2 ; 2,2, no', function(){
                    test(false, ['2,2', '2,2'], no22);
                });
            });

            describe('2,0', function(){
                it ('2,0; 0,0 yes', function(){
                    test(true, ['2,0', '0,0'], yes20);
                });

                it ('2,0; 0,0, no', function(){
                    test(false, ['2,0', '0,0'], no20);
                });

                it ('2,0; 2,2 no', function(){
                    test(false, ['2,0', '2,2'], yes22);
                });

                it ('2,0 ; 2,0, yes', function(){
                    test(true, ['2,0', '2,0'], yes2020);
                });
            });

            describe('2,-1', function(){
                it ('2,-1; 0,0 yes', function(){
                    test(true, ['2,-1', '0,0'], yes2minus1);
                });

                it ('2,-1; 0,0, no', function(){
                    test(false, ['2,-1', '0,0'], no2minus1);
                });

                it ('2,-1; 2,-1 yes', function(){
                    test(true, ['2,-1', '2,-1'], yes2minus12minus1);
                });

                it ('2,-1 ; 2,-1, no', function(){
                    test(false, ['2,-1', '2,-1'], no2minus12minus1);
                });
            });

            describe('1,2', function(){
                it ('1,2; 0,0 yes', function(){
                    test(true, ['1,2', '0,0'], yes12);
                });

                it ('1,2; 0,0, no', function(){
                    test(false, ['1,2', '0,0'], no12);
                });

                it ('1,2 ; 0,0, no 2', function(){
                    test(false, ['1,2', '0,0'], no12_2);
                });

                it ('1,2 ; 1,2, yes', function(){
                    test(true, ['1,2', '1,2'], yes12);
                });


            });

            describe('1,0', function(){
                it ('1,0; 0,0 yes', function(){
                    test(true, ['1,0', '0,0'], yes10);
                });

                it ('1,0; 0,0, no', function(){
                    test(false, ['1,0', '0,0'], no10);
                });

                it ('1,0 ; 1,0, yes', function(){
                    test(true, ['1,0', '1,0'], yes12);
                });
            });
            
            describe('0,0', function(){
                it ('0,0; 0,0 yes', function(){
                    test(true, ['0,0', '0,0'], yes00);
                });

                it ('0,0; 2,2, no', function(){
                    test(false, ['0,0', '2,2'], yes00);
                });
            });

            describe('-1,0', function(){
                it ('-1,0; 0,0 yes', function(){
                    test(true, ['-1,0', '0,0'], yesminus10);
                });

                it ('-1,0; 0,0, no', function(){
                    test(false, ['-1,0', '0,0'], nominus10);
                });

                it ('-1,0; -1,0 yes', function(){
                    test(true, ['-1,0', '-1,0'], yesminus10);
                });

                it ('-1,0 ; 2,2, no', function(){
                    test(false, ['-1,0', '2,2'], yes22);
                });
            });

        });


        describe('findSuggestionsGivenUserInfoAndOtherUserInfos', function(){
            it('should find matching users and their times for this users', function(){
                var a1 = makeAvailabilityArray(0, 3);
                var a2 = makeAvailabilityArray(1, 10);
                var a3 = makeAvailabilityArray(2, 6);

                var userAvailabilities = {user1: makeUserInfo(a1), user2: makeUserInfo(a2), user3: makeUserInfo(a3)};

                var matchingUsers = suggestions.findSuggestionsGivenUserInfoAndOtherUserInfos({user2: makeUserInfo(a2)}, userAvailabilities);
                assert(matchingUsers.length == 2);
                matchingUsers.forEach(function(match){
                    if (utils.checkArraysEqualUnordered(match.usernames, ['user1', 'user2'])){
                        assert(utils.checkArraysEqualUnordered(a1.slice(1, 3), match.matchingTimes));
                    } else if (utils.checkArraysEqualUnordered(match.usernames, ['user3', 'user2'])){
                        assert(utils.checkArraysEqualUnordered(a3, match.matchingTimes));
                    } else {
                        assert(false);
                    }
                });
            });

        });
    });
});













