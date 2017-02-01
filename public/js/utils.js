/**
 * Created by Shinjini on 11/18/2016.
 */
var Utitilities = function() {
    var that = Object.create(Utitilities);

    var UTC_OFFSET = (new Date()).getTimezoneOffset() * 60000;


    that.times = function(number, f){
        for (var i = 0; i<number; i++){
            f();
        }
    };

    that.getTimeInUTC = function(millisInLocal){
        // return parseInt(millisInLocal) + UTC_OFFSET
        return parseInt(millisInLocal)
    };


    that.getTimeInLocal = function(millisInUTC){
        // return parseInt(millisInUTC) - UTC_OFFSET
        return parseInt(millisInUTC);
    };

    that.getPrettyPrintLocalTime = function(millisInLocal){
        // edited from http://stackoverflow.com/questions/8362952/javascript-date-output-formatting

        var twoSF = function(num){
            return ("0" + num).slice(-2)
        };

        var date = new Date(millisInLocal);
        var dateString = twoSF(date.getMonth()+1) +"/"+ twoSF(date.getDate())  +"/"+ date.getFullYear();
        var hoursIn12 = twoSF(date.getHours()%12);
        var ampm = (12-date.getHours()>0)?'am':'pm';
        var timeString = hoursIn12 + ":" + twoSF(date.getMinutes()) + ":" + twoSF(date.getSeconds()) + ' ' + ampm;

        return  dateString + " " + timeString;

    };

    Object.freeze(that);
    return that;
};

var utils = Utitilities();