$(document).ready(function() {
    // All things Handlebars
    // Allow using Handlebars templates as partials as well.
    Handlebars.partials = Handlebars.templates;

    var makeSignalReadyForNextFn = function (loggedInUsername, dashboard, btn) {
        var signalReadyForNext = function(){
            $.ajax({
                url: '/users/' + loggedInUsername +'/settings/connections/ready',
                data: {now: true},
                type: 'PUT',
                success: function (res) {
                    $('#signal-ready-for-next').attr('disabled', false);
                    $('#loader-container').hide();
                    if (JSON.parse(res.success)) {
                        getDashboardInfoFromDB(loggedInUsername, dashboard);
                    } else {
                        alert('something went wrong with updating connection settings ready'); // FIXME
                    }
                }
            });
        }
        return signalReadyForNext;
    }

    var makeCancelReadyForNextFn = function (loggedInUsername, dashboard, btn) {
        var cancelReadyForNext = function(){
            $.ajax({
                url: '/users/' + loggedInUsername +'/settings/connections/ready',
                data: {now: false},
                type: 'PUT',
                success: function (res) {
                    $('#cancel-ready-btn').attr('disabled', false);
                    $('#loader-container').hide();
                    if (JSON.parse(res.success)) {
                        getDashboardInfoFromDB(loggedInUsername, dashboard);
                    } else {
                        alert('something went wrong with updating connection settings not ready'); // FIXME
                    }
                }
            });
        }

        return cancelReadyForNext;
    }

    var setUpConnectionSettingsUpdateButtons = function(loggedInUsername, dashboard){
        $('#signal-ready-btn').unbind().click(makeSignalReadyForNextFn(loggedInUsername, dashboard, $(this)));
        $('#cancel-ready-btn').unbind().click(makeCancelReadyForNextFn(loggedInUsername, dashboard, $(this)));
    };

    var getDashboardInfoFromDB = function(loggedInUsername, dashboard){
        // get all the information from the server
        $('#loader-container').show();
        $.get('users/'+loggedInUsername+'/dashboard', function(res) {
            $('#loader-container').hide();
            if (JSON.parse(res.success)){

                var settings = res.connectionSettings;
                if (JSON.parse(settings.readyToConnect) || JSON.parse(settings.alwaysReadyToConnect)){
                    $('#signal-ready-for-next').addClass('hidden');
                    $('#cancel-ready-for-next').removeClass('hidden');
                } else {
                    $('#cancel-ready-for-next').addClass('hidden');
                    $('#signal-ready-for-next').removeClass('hidden');
                }
                $('#connection-ready').removeClass('hidden'); // it will be hidden again if there is a connection
                var username = res.username;
                var matchingUserInfo = res.matchingUsersInfo;
                var readyToConnect = settings.readyToConnect || settings.alwaysReadyToConnect;
                dashboard.updateDisplay(username, matchingUserInfo, readyToConnect);
                $('#email-sent-msg').hide();
                $('#send-email-loader').hide();
                $('#email-send-error').hide();
            } else {
                // TODO
                alert("Something went wrong with getting your dashboard.");
            }
        });
    };

    $.get('auth/signin', function(res){ // check this just in case
        if (JSON.parse(res.success)){
            var loggedInUsername = res.username;

            var interestedCheckFn = function(interestUsername, dashboard){
                $('#loader-container').show();
                $.ajax({
                    url: '/users/'+loggedInUsername+'/interests/users',
                    data: {interestUsername: interestUsername},
                    type: 'POST',
                    success: function (res) {
                        $('#loader-container').hide();
                        if (JSON.parse(res.success)){
                            getDashboardInfoFromDB(loggedInUsername, dashboard);
                        } else {
                            // TODO
                            alert("Something went wrong with expressing your interest in this user.");
                        }
                    }
                });
            };

            var interestedUncheckFn = function(otherUsername, dashboard) {
                $('#loader-container').show();
                $.ajax({
                    url: '/users/' + loggedInUsername + '/interests/users/'+otherUsername,
                    data: {},
                    type: 'DELETE',
                    success: function (res) {
                        $('#loader-container').hide();
                        if (JSON.parse(res.success)) {
                            getDashboardInfoFromDB(loggedInUsername, dashboard);
                        } else {
                            // TODO
                            alert("Something went wrong with deselecting your interest in this user.");
                        }
                    }
                });
            };

            var closeConnectionFn = function(otherUsername, connectionId, dashboard) {
                $('#loader-container').show();
                var btn = $('#close-connection-btn');
                btn.attr('disabled', true);
                var btn2 = $('#send-email-button'); // don't send emails while closing the connection!
                btn2.attr('disabled', true);

                $.ajax({
                    url: '/users/' + loggedInUsername + '/connections/'+connectionId,
                    data: {connectUsername: otherUsername},
                    type: 'DELETE',
                    success: function (res) {
                        $('#loader-container').hide();
                        btn.attr('disabled', false);
                        btn2.attr('disabled', false);
                        if (JSON.parse(res.success)) {
                            getDashboardInfoFromDB(loggedInUsername, dashboard);
                        } else {
                            // TODO
                            alert("Something went wrong with closing your connection.");
                        }
                    }
                });
            };

            var sendEmailFn = function (connectionId, message) {
                var btn = $('#send-email-button');
                btn.attr('disabled', true);

                $.ajax({
                    url: '/users/' + loggedInUsername + '/connections/' + connectionId + '/mail',
                    data: { message: message },
                    type: 'POST',
                    success: function (res) {
                        btn.attr('disabled', false);
                        $('#send-email-loader').hide();
                        if (JSON.parse(res.success)) {
                            // TODO tell the user how their message was sent or received
                            // TODO if send successful, clear the container/ fill with default message
                            // TODO otherwise leave the previous message
                            $('#email-sent-msg').show();
                            $('#email-sent-msg').delay(3000).fadeOut();
                        } else {
                            $('#email-send-error').show();
                            $('#email-send-error').delay(8000).fadeOut();
                        }
                    }
                })
            };

            var dashboard = DashboardWidget(closeConnectionFn, interestedCheckFn, interestedUncheckFn, sendEmailFn);
            var dashboardWidget = dashboard.getDashboardElt();
            $('#dashboard-container').append(dashboardWidget);
            var signalReadyForNextFn = makeSignalReadyForNextFn(loggedInUsername, dashboard);
            dashboard.setSignalReadyForNextFn(signalReadyForNextFn);
            setUpConnectionSettingsUpdateButtons(loggedInUsername, dashboard);
            getDashboardInfoFromDB(loggedInUsername, dashboard);
        } else {
            window.location = 'signin.html';
        }
    });


});

