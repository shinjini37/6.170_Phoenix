/**
 * Created by Shinjini on 11/21/2016.
 */
var utils = require('./Utility');
var zipcodes = require('zipcodes');

var UserModel = require("./User");




var SuggestionFinder = function(){
    var that = Object.create(SuggestionFinder);

    var WEEK_IN_MILLIS = 604800000;

    // Algorithm outline:
    // If two users are compatible in terms of location and topics
    //      For each time that is after now,
    //          compare each available time
    //          if they match (and are within a week from now)
    //              add them to the suggestions list

    /**
     * Checks that the location of the users overlap based on their respective location radius preferences
     * @param info1 is an object defined as in that.getFormattedInfoGivenUser
     * @param info2 is an object defined as in that.getFormattedInfoGivenUser   is an object defined as in that.getFormattedInfoGivenUser
     * @returns {boolean}
     */
    var checkLocationOverlap = function(info1, info2){
        var username1 = Object.keys(info1)[0];
        var username2 = Object.keys(info2)[0];

        var locationMatch = false;
        var user1Location = info1[username1].location;
        var user2Location = info2[username2].location;

        if ((user1Location && user1Location.length>0) && (user2Location && user2Location.length>0)) { // check locations exist
            // NOTE: a 0 distance can still result in several valid zipcodes!
            var user1validLocations = zipcodes.radius(user1Location, parseInt(info1[username1].preferences.locationRadius));
            var user2validLocations = zipcodes.radius(user2Location, parseInt(info2[username2].preferences.locationRadius));
            if (user1validLocations.indexOf(user2Location)>=0){ // user1 in user2's valid locations
                if (user2validLocations.indexOf(user1Location)>=0) { // user2 in user1's valid locations
                    locationMatch = true;
                }
            }
        }

        return locationMatch;
    };

    /**
     *  Checks that the topics of the users overlap based on their respective topic overlap preferences
     *
     * @param info1 is an object defined as in that.getFormattedInfoGivenUser  
     * @param info2 is an object defined as in that.getFormattedInfoGivenUser  
     * @returns {*}
     */
    var checkTopicOverlap = function(info1, info2){
        var username1 = Object.keys(info1)[0];
        var username2 = Object.keys(info2)[0];

        var overlap1 = info1[username1].preferences.topicOverlap.split(',');
        var overlap2 = info2[username2].preferences.topicOverlap.split(',');
        var topics1 = info1[username1].topics;
        var topics2 = info2[username2].topics;

        var contains = function(elt, array, properties){
            var returnArray = array;
            properties.forEach(function(property){ // filter by the properties in order
                returnArray = returnArray.filter(function(elt2){
                    return elt[property] == elt2[property];
                });
            });
            return (returnArray.length > 0);
        };

        // assumes that the overlap info is checked to be valid beforehand
        var checkCorrectTopicOverlap = function(topics1, topics2, overlapPreference1){
            var topicNameMatch = true;
            if (overlapPreference1[0] == '2') { // all topics match
                topics1.forEach(function(topic1){
                    if (!contains(topic1, topics2, ['name'])){
                        topicNameMatch = false;
                    }
                });
            } else if (overlapPreference1[0] == '1') { // some topics match
                topicNameMatch = false;
                topics1.forEach(function(topic1){
                    if (contains(topic1, topics2, ['name'])){
                        topicNameMatch = true;
                    }
                });
            } else if (overlapPreference1[0] == '-1'){ // no topics match
                topics1.forEach(function(topic1){
                    if (contains(topic1, topics2, ['name'])){
                        topicNameMatch = false;
                    }
                });
            }

            var topicPositionMatch = true;
            if (topicNameMatch){ // matched so far, now check positions
                if (overlapPreference1[0] == '2'){ // all topics match
                    if (overlapPreference1[1] == '2') { // all positions match
                        topics1.forEach(function(topic1){
                            if (!contains(topic1, topics2, ['name', 'position'])){
                                topicPositionMatch = false;
                            }
                        });
                    } else if (overlapPreference1[1] == '-1') { // no topics match
                        topics1.forEach(function(topic1){
                            if (contains(topic1, topics2, ['name', 'position'])){
                                topicPositionMatch = false;
                            }
                        });
                    }
                } else if (overlapPreference1[0] == '1') { // some topics match
                    if (overlapPreference1[1] == '2') { // all positions match (from the previous filtered list)
                        topicPositionMatch = false;
                        topics1.forEach(function(topic1){
                            if (contains(topic1, topics2, ['name', 'position'])){
                                topicPositionMatch = true;
                            }
                        });
                    }
                }

            }

            return topicNameMatch && topicPositionMatch
        };

        return checkCorrectTopicOverlap(topics1, topics2, overlap1) && checkCorrectTopicOverlap(topics2, topics1, overlap2);
    };

    /**
     * Checks that both location and topic overlap
     * @param info1 is an object defined as in that.getFormattedInfoGivenUser  
     * @param info2 is an object defined as in that.getFormattedInfoGivenUser  
     * @returns {boolean}
     */
    var checkLocationAndTopicOverlap = function(info1, info2){
        return checkTopicOverlap(info1, info2) && checkLocationOverlap(info1, info2);
    };

    /**
     * Given two user infos, checks that their topics and locations overlap, and then finds any time overlap
     * Note: DOES take location and topics, etc into account
     * @param info1 is an object defined as in that.getFormattedInfoGivenUser  
     * @param info2 is an object defined as in that.getFormattedInfoGivenUser  
     * @returns {Array} with elements of the form {usernames: [username1, username2], matchingTimes: matchingTimes}
     *                  username1 and username2 correspond to info1 and info2
     */
    that.findMatchesGivenTwoUserInfos = function(info1, info2){
        var suggestions = [];
        var username1 = Object.keys(info1)[0];
        var username2 = Object.keys(info2)[0];

        if (checkLocationAndTopicOverlap(info1, info2)){ // check location match!
            var matchingTimes = that.findMatchingTimes(info1[username1].availability, info2[username2].availability);
            if (matchingTimes.length>0){
                suggestions.push({usernames: [username1, username2], matchingTimes: matchingTimes});
            }
        }
        return suggestions;
    };

    /**
     * Given two arrays of times, returns their intersection. Does not care about location or topics matching!
     * @param a1 {Array} of times (which are millisecond representations of Date objects)
     * @param a2 {Array}
     * @returns {Array}
     */
    that.findMatchingTimes = function(a1, a2){
        var now = utils.getTimeNowInUTC();
        var weekFromNow = now + WEEK_IN_MILLIS;

        var matchingTimes = [];
        a1.forEach(function(time1){
            a2.forEach(function(time2){
                time1 = parseInt(time1);
                time2 = parseInt(time2);
                if ((time1>now && time2>now) && (time1<= weekFromNow && time2 <= weekFromNow) ){
                    if (time1 == time2){
                        matchingTimes.push(String(time1));
                    }
                }
            });
        });
        return matchingTimes;
    };

    /**
     * Given a user's infos, and the infos of a bunch of users, checks that their topics and locations overlap, and then
     * finds any time overlap between the first user and the rest
     * Note: DOES take location and topics, etc into account
     * @param givenUserInfo {Object} of the form {username: {availability: [times], location: zipcode}} (should have one key)
     * @param userInfos {Object} of the form {username: {availability: [times], location: zipcode}}
     * @returns {Array} with elements of the form {usernames: [username1, username2], matchingTimes: matchingTimes}
     */
    that.findSuggestionsGivenUserInfoAndOtherUserInfos = function(givenUserInfo, userInfos) {
        // info = {username: {availability: [times], location: zipcode}}
        var suggestions = [];
        // suggestions = [{usernames: [username1, username2], matchingTimes: []}]
        var givenUsername = Object.keys(givenUserInfo)[0];
        var usernames = Object.keys(userInfos);
        if (usernames.length==0){
            return [];
        }

        usernames.forEach(function(username){
            if(username!=givenUsername){
                var thisUserAvailability = {};
                thisUserAvailability[username] = userInfos[username];
                suggestions = suggestions.concat(that.findMatchesGivenTwoUserInfos(givenUserInfo, thisUserAvailability));
            }
        });

        return suggestions;
    };



    /**
     * Given a user's username and their connection info (may be null), looks through the database and finds
     * suggestions for the user based on the algorithm above. If the user has a previous connection and they
     * still match, updates the corresponding suggestions info to indicate that it is the connect user
     * @param loggedInUsername
     * @param connectionInfo
     * @param callback
     */
    that.findSuggestionsGivenUsernameAndTheirConnection = function(loggedInUsername, connectionInfo, callback){
        var connectUsername;
        if (connectionInfo){
            connectUsername = connectionInfo.username;
        }

        // info about our logged in user
        var loggedInUserMatchingInfo = {};
        var interestUsernames;
        var blockedUsernames;
        var disinterestUsernames;

        // info about other users
        var otherUsersMatchingInfos = {};

        // now find suggestions
        // Note: interest, disinterest and blocked users are populated
        UserModel.getAllUsers(function(err, allUsers){ // Note: topics and interest users are populated
            if (err){
                callback(err);

            } else {
                var auxiliaryInfo = {};
                // find matching users
                allUsers.forEach(function(user){
                    var username = user.username;
                    if (username === loggedInUsername){ // this is our logged in user
                        loggedInUserMatchingInfo[loggedInUsername] = that.getFormattedInfoGivenUser(user).info;
                        interestUsernames = user.interestUsers.map(function(interestUser){
                            return interestUser.username;
                        });
                        blockedUsernames = user.blockedUsers.map(function(blockedUser){
                            return blockedUser.username;
                        });
                        disinterestUsernames = user.disinterestUsers.map(function(disinterestUser){
                            return disinterestUser.username;
                        });

                    } else {
                        var thisUserDisinterest = (user.disinterestUsers.filter(function(disinterestUser){
                            return loggedInUsername == disinterestUser.username;
                        }).length > 0); // checking that the logged in user user is not in the disinterest list

                        var thisUserBlocked = (user.blockedUsers.filter(function(blockedUser){
                            return loggedInUsername == blockedUser.username;
                        }).length > 0); // checking that the logged in user user is not in the block list

                        if (!(thisUserBlocked || thisUserDisinterest)){
                            otherUsersMatchingInfos[username] = that.getFormattedInfoGivenUser(user).info;
                            auxiliaryInfo[username] = {aboutMe:user.aboutMe}
                        }
                    }
                });
                var filteredUsersMatchingInfo = {};
                for (var username in otherUsersMatchingInfos){
                    var blocked = (blockedUsernames.indexOf(username) >= 0);
                    var disinterested = (disinterestUsernames.indexOf(username) >= 0);
                    if (!(blocked || disinterested)){
                        filteredUsersMatchingInfo[username] = otherUsersMatchingInfos[username];
                    }
                }
                var matchingUsersAndTimes = that.findSuggestionsGivenUserInfoAndOtherUserInfos(loggedInUserMatchingInfo, filteredUsersMatchingInfo);
                var matchingUsersInfo = matchingUsersAndTimes.map(function (userAndTime) {
                    // This can't be DRYed up: All the info comes from different places...
                    var usernames = userAndTime.usernames;
                    var username = utils.getOtherUsername(loggedInUsername, usernames).otherUsername;

                    var info = {};
                    if (username === connectUsername){// is this actually our connection
                        info = connectionInfo;
                    }
                    info.username = username;
                    info.matchingTimes = userAndTime.matchingTimes;
                    info.interested = (interestUsernames.indexOf(info.username)>-1);
                    info.aboutMe = auxiliaryInfo[info.username].aboutMe;
                    info.topics = filteredUsersMatchingInfo[username].topics;

                    return info;
                });
                callback(err, matchingUsersInfo);
            }
        });
    };

    /**
     * Convenience function to format the info needed to find suggestions
     * @param user
     * @returns {Object}
     */
    that.getFormattedInfoGivenUser = function(user){
        return {
            username: user.username, info: {
                availability: user.availability,
                location: user.location,
                preferences: user.preferences,
                topics: user.topics,
            }
        }
    };

    Object.freeze(that);
    return that
};

module.exports = SuggestionFinder();