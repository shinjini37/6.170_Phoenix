/**
 * Created by Shinjini on 12/10/2016.
 */
$(document).ready(function(){
    var checkLoggedIn = function(callback){
        $.get('auth/signin', function(res){ // check this just in case
            if (JSON.parse(res.success)){
                callback(); // if success, just set timeout again!
            } else {
                window.location = 'signin.html';
            }
        });

    };

    var checkLoggedInEveryMinute = function(){
        // TODO do I need to delete these timeouts at anytime?
        window.setTimeout(function(){
            checkLoggedIn(checkLoggedInEveryMinute);
        }, 60000); // every minute
    };

    checkLoggedIn(checkLoggedInEveryMinute);
});