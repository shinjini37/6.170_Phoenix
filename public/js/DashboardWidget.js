/**
 * Created by Shinjini on 11/23/2016.
 */

/**
 * NOTE: One dashboard widget per dashboard!
 * @returns {JournalWidget}
 * @constructor
 */

var DashboardWidget = function(closeConnectionFn, interestedCheckFn, interestedUncheckFn, sendEmailFn) {
    var that = Object.create(DashboardWidget);

    Handlebars.partials = Handlebars.templates;

    var dashboardElt;
    var readyToConnectFn;

    that.setSignalReadyForNextFn = function (fn) {
        readyToConnectFn = fn;
    };

    that.getDashboardElt = function(){
        return dashboardElt;
    };

    /**
     * Clears up the container and then adds the users
     */
    that.updateDisplay = function(username, matchUserInfoList, readyToConnect){
        // refresh the dashboard
        dashboardElt = createDashboardElt();

        if (readyToConnect) {
            dashboardElt.find('#prompt-text').hide();
            $('#signal-ready-for-next').addClass('hidden');
            $('#cancel-ready-for-next').removeClass('hidden');
        } else {
            dashboardElt.find('#prompt-text').show();
            $('#cancel-ready-for-next').addClass('hidden');
            $('#signal-ready-for-next').removeClass('hidden');
        }
        $('#connection-ready').removeClass('hidden'); // it will be hidden again if there is a connection

        $('#dashboard-container').html(dashboardElt);

        addUsers(username, matchUserInfoList);
        $('#dashboard-container').removeClass('hidden');
    };

    /**
     * Adds a connection to the dashboard
     */
    var addConnection = function(username, userInfo){
        var connectionCardInput = JSON.parse(JSON.stringify(userInfo));
        connectionCardInput.myUsername = username;
        if (userInfo.matchingTimes.length>0){
            var firstMatchingTime = Number(userInfo.matchingTimes[0]);
            var matchingTime = moment(firstMatchingTime).format("dddd, MMMM D")
                + " at "
                +  moment(firstMatchingTime).format("h:mm a");
            connectionCardInput.firstMatchingTime = matchingTime;
        }
        var connectionElt = Handlebars.templates.connectionCard(connectionCardInput);
        $('#connection-ready').addClass('hidden');

        dashboardElt.find('#connection-container').append(connectionElt);
        dashboardElt.find('#close-connection-btn').click(function(){
            closeConnectionFn(userInfo.username, userInfo.connectionId, that);
        });
        dashboardElt.find('#send-email-button').click(function() {
            sendEmailFn(userInfo.connectionId, $('#message-input').val());
        });

    };

    var addSuggestion = function(userInfo){
        var suggestionElt = Handlebars.templates.suggestionCard(userInfo);
        dashboardElt.find('#suggestions-container').append(suggestionElt);

        var username = userInfo.username;
        dashboardElt.find('#suggestion-card_'+username+' .interested-checkbox').click(function(){
            if (this.checked){
                interestedCheckFn(username, that);
            } else { // deleting
                interestedUncheckFn(username, that);

            }
        });
    };


    var addUsers = function(username, matchUserInfoList){
        var emptySuggestion = $('#empty-suggestion');
        var emptyConnection = $('#empty-connection');
        dashboardElt.find('#suggestions-container').html('');
        dashboardElt.find('#connection-container').html('');
        matchUserInfoList.forEach(function(userInfo){
            if (userInfo.connectionId){
                addConnection(username, userInfo);
            } else {
                addSuggestion(userInfo);
            }
        });
        if ($('.suggestion-card').length==0){
            dashboardElt.find('#suggestions-container').append(emptySuggestion);
        }
        if ($('.connection-card').length==0){
            dashboardElt.find('#connection-container').append(emptyConnection);
            $('#prompt-signal-ready-for-next').click(readyToConnectFn);
        }
    };

    /**
     * Adds users on top of existing users
     */
    that.addUsers = function(userInfoList){
        addUsers(userInfoList);
    };



    var createDashboardElt = function(){
        return $(Handlebars.templates.dashboardListing());
    };


    dashboardElt = createDashboardElt();


    Object.freeze(that);
    return that;

};




