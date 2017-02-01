/**
 * Created by Shinjini on 12/5/2016.
 */
$(document).ready(function () {

    var updateConnectionSettingsAlwaysInDB = function(loggedInUsername, callback){
        var always = !($('#connection-ready-checkbox')[0].checked);
        $.ajax({
            url: '/users/' + loggedInUsername +'/settings/connections/ready',
            data: {always: always},
            type: 'PUT',
            success: function (res) {
                if (JSON.parse(res.success)) {
                    if (always) {
                        $("#connection-ready-row").effect("highlight", {color: "rgba(255, 0, 0, 0.5)" }, 1000);
                    } else {
                        $("#connection-ready-row").effect("highlight", {color: "rgba(2, 159, 91, 0.5)"}, 1000);
                    }
                    
                } else {
                    alert('something went wrong with updating connection settings ready'); // FIXME
                }
            }
        });
    };


    var makeConnectionSettingsOnClickFunction = function(loggedInUsername){
        return function(){
            updateConnectionSettingsAlwaysInDB(loggedInUsername);
        }
    };

    var getSettingsFromDB = function (loggedInUsername) {
        $.get('users/'+loggedInUsername+'/settings', function(res) {
            if (JSON.parse(res.success)){
                $('#connection-ready-checkbox')[0].checked = !JSON.parse(res.settings.connections.alwaysReadyToConnect);
            } else {
                alert('something went wrong'); // FIXME
            }
        });
    };

    $.get('auth/signin', function(res){
        if (JSON.parse(res.success)){
            var username = res.username;
            window.sessionStorage.setItem('loggedInUsername', username);
            getSettingsFromDB(username);
            $('#connection-ready-checkbox').click(makeConnectionSettingsOnClickFunction(username));
        } else {
            window.sessionStorage.removeItem('loggedInUsername');
            window.location = 'signin.html';
        }
    });

});