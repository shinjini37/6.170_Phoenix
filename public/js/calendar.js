/**
 * Created by Shinjini on 11/18/2016.
 */
$(document).ready(function(){

    var sidebar = Handlebars.templates.sidebar();
    $('#sidebar-container').html(sidebar);

    // ampm == "0" if am ; == "1" if pm
    var from12To24 = function(val12, ampm, isEnd){
        val12 = parseInt(val12);
        var val124 = (val12 % 12) + 12 * parseInt(ampm);
        if (isEnd){
            if (val124 == 0){
                val124 = 24;
            }
        }
        return val124;
    };

    var from24To12 = function(val24){
        val24 = parseInt(val24);
        var val12;
        var ampm;

        if (val24 == 12){
            val12 = 12;
            ampm = '1'
        } else if ((val24 == 0) || (val24 == 24)){
            val12 = 12;
            ampm = '0'
        } else {
            val12 = (val24 % 12);
            ampm = (val24<=12)?'0':'1';
        }
        return [val12, ampm];
    };


    var checkRangeInput = function(start, end){
        if (!start){
            start = $('#start').val();
        }
        if (!end){
            end = $('#end').val();
        }
        var ok = false;
        var checkInput = function(val){
            if (!isNaN(val)){
                if ((val<=12) && (val>0)){
                    return true;
                }
            }
            return false;
        };

        if (checkInput(start) && checkInput(end)) {
            start = parseInt(start);
            end = parseInt(end);
            start = from12To24(start, $('#start-am-pm-select').val(), false);
            end = from12To24(end, $('#end-am-pm-select').val(), true);

            if (start < end) {
                ok = true;
            }
        }
        if (!ok){
            start = null;
            end = null;
        }

        return {ok: ok, start: start, end: end};
    };

    $('#start, #end').each(function(idx, elt){
        $(elt).on('keypress', function(event){
            return event.charCode >= 48 && event.charCode <= 57
        });
        $(elt).on('input', function(){
            var max = parseInt(elt.max);
            var min = parseInt(elt.min);
            var start = parseInt($(elt).val());
            if (start > max){
                $(elt).val(max);
            } else if (start < min){
                $(elt).val(min);
            }
        });
    });

    var makeOnSelectFunction = function(username){
        var onSelectFunction = function(cal) {
            var availableTimes = cal.getAvailableTimes();
            var data = {availability: JSON.stringify(availableTimes)}; // sending parameter as an array behaves weirdly...
            $('#loader-container').show();
            $.ajax({
                url: '/users/'+username+'/calendar',
                data: data,
                type: 'PUT',
                success: function (res) {
                    $('#loader-container').hide();
                    if (JSON.parse(res.success)){
                        cal.setAvailableTimes(res.availability);
                    } else {
                        // TODO
                    }

                }
            });
        };
        return onSelectFunction;
    };

    var setCalendarBoutdInput = function(startOrEnd, val24, ampm){
        var val12AmPm = from24To12(val24);
        $('#'+startOrEnd).val(val12AmPm[0]);
        $('#'+startOrEnd+'-am-pm-select').val(val12AmPm[1]);
    };

    var updateCalendarViewFromDBData = function(username, cal){
        $('#loader-container').show();
        $.get('users/'+username+'/calendar',
            function(res){
                $('#loader-container').hide();
                var calendarStart = parseInt(res.calendarRange.start);
                var calendarEnd = parseInt(res.calendarRange.end);
                setCalendarBoutdInput('start', calendarStart);
                setCalendarBoutdInput('end', calendarEnd);
                
                var calWidget = cal.changeRange(calendarStart, calendarEnd);
                $('#calendar-container').html('').append(calWidget);
                cal.setAvailableTimes(res.availability);
            }
        );
    };


    $.get('auth/signin', function(res){
        if (JSON.parse(res.success)){
            var username = res.username;
            var cal = CalendarWidget(makeOnSelectFunction(username)); // 12am to 11pm
            updateCalendarViewFromDBData(username, cal);

            $('#update-calendar-bounds').click(function(){
                var startEnd = checkRangeInput();
                if (startEnd.ok){
                   $('#loader-container').show();
                    $.ajax({
                        url: '/users/'+username+'/settings/calendar/range',
                        data: {start: startEnd.start, end: startEnd.end},
                        type: 'PUT',
                        success: function (res) {
                            $('#loader-container').hide();
                            if (JSON.parse(res.success)){
                                updateCalendarViewFromDBData(username, cal);
                            } else {
                                // TODO
                                alert("Something went wrong with getting the start and end times for your calendar");
                                var calendarStartEnd = cal.getRange();
                                setCalendarBoutdInput('start', calendarStartEnd.start);
                                setCalendarBoutdInput('end', calendarStartEnd.end);
                            }
                        }
                    });
                } else {
                    alert('Start time must be before end time!'); // TODO
                }
            });

        } else {
            window.location = 'signin.html';
        }
    });
});