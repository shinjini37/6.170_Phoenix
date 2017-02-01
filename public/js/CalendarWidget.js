/**
 * Taken from Shinjini Saha's Spring 2016 6.813 final project. Originally written by Cheuk Hang (Sam) Lee.
 * Edited for Fall 2016 6.170 by Shinjini Saha.
 */

/**
 * NOTE: Make one widget element per widget!
 * @param onSelectFunction
 * @returns {CalendarWidget}
 * @constructor
 */
var CalendarWidget = function (onSelectFunction) {
    var DAYS_OF_WEEK = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    var START_TIME = 0;
    var END_TIME = 24;

    var WEEK_IN_MILLIS = 604800000;

    var CURRENT_DATE; // today
    var date; // first day of the week displayed to users

    var availableTimes = []; // time is in UTC time, not local time!
    var calendarElt;

    var that = Object.create(CalendarWidget);

    // call this after all the functions are loaded
    var setUpVariables = function(){
        CURRENT_DATE = new Date();
        // from https://praveenlobo.com/blog/how-to-convert-javascript-local-date-to-utc-and-utc-to-local-date/
        var thisDate = CURRENT_DATE.getDate();
        var thisMonth = CURRENT_DATE.getMonth();
        var thisYear = CURRENT_DATE.getFullYear();
        CURRENT_DATE = new Date(thisYear, thisMonth, thisDate);

        // shift days of the week to start with today
        shiftArrayLeft(DAYS_OF_WEEK, (new Date().getDay())); // getday gets the offset from the previous sunday
        date = CURRENT_DATE;
        calendarElt = createCalendarElt();

    };


    /*
     * Public methods
     */

    that.getCalendarElt = function(){
        return calendarElt;
    };

    // return to current week
    that.returnToCurrentWeek = function () {
        date = CURRENT_DATE;
        calendarElt.find('#selected-week-text').text(weekText(date));
        changeDateText();
        showAvailableTimes(availableTimes);
        enableDisablePrevWeekBtn();
    };

    // get the time ranges that the user selected
    var updateAvailableTimes = function () {
        var thisDate = CURRENT_DATE.getDate();
        var thisMonth = CURRENT_DATE.getMonth();
        var thisYear = CURRENT_DATE.getFullYear();
        var selectedWeekOffset = getInterWeekOffsetAndIntraWeekOffsetFromToday(date.getTime()).inter;

        var availableTimesForThisWeek = DAYS_OF_WEEK.map(function (day, idx) { // idx 0 is today
            var selector = '#time-selector-col-' + day + ' .time-selector-cell';
            var times = [];
            $(selector).each(function (idx) {
                if ($(this).children().hasClass('time-selector-range-desired')) {
                    times.push(idx + START_TIME);
                }
            });

            return times.map(function(hour){
                // Note: adding the numbers works, because Date takes care of the rolling over
                var localTimeInMillis = (new Date(thisYear, thisMonth, (thisDate+ 7*selectedWeekOffset +idx), hour)).getTime();
                var UTCTimeInMillis = utils.getTimeInUTC(localTimeInMillis);
                return UTCTimeInMillis;
            });
        });
        availableTimesForThisWeek = availableTimesForThisWeek.reduce(function(a, b){
            return a.concat(b);
        });

        // get rid of previous entries of the current week
        availableTimes = availableTimes.filter(function(time){
            var weekOffsetFromThisWeek = getInterWeekOffsetAndIntraWeekOffsetFromToday(utils.getTimeInLocal(time)).inter;
            return (weekOffsetFromThisWeek!=selectedWeekOffset);
        });
        // add the current week's entries to the available times
        availableTimes = availableTimes.concat(availableTimesForThisWeek);
    };

    that.getAvailableTimes = function () {
        return JSON.parse(JSON.stringify(availableTimes));
    };

    // set the time ranges that the user selected
    that.setAvailableTimes = function (availability) {
        availableTimes = JSON.parse(JSON.stringify(availability));
        showAvailableTimes(availableTimes);
    };

    // show the time ranges that the user selected
    var showAvailableTimes = function (availability) {
        that.clearCalenderSelections();
        var availabilityInLocalTime = availability.map(function(timeString){
            return String(utils.getTimeInLocal(timeString));
        });
        var selectedWeek = getInterWeekOffsetAndIntraWeekOffsetFromToday(date.getTime()).inter;
        availabilityInLocalTime.forEach(function(time){
            time = parseInt(time);
            var weekOffset = getInterWeekOffsetAndIntraWeekOffsetFromToday(time).inter;
            var dayOffset = getInterWeekOffsetAndIntraWeekOffsetFromToday(time).intra;
            if (weekOffset==selectedWeek){
                var availableTime = new Date(time);
                var availableHour = availableTime.getHours();
                var selector = '#time-selector-col-' + DAYS_OF_WEEK[dayOffset] + ' .time-selector-cell';
                $($(selector)[availableHour - START_TIME]).children().addClass('time-selector-range-desired');
            }
        });
    };

    // clear the time ranges that the user selected
    that.clearCalenderSelections = function () {
        calendarElt.find('.time-selector-cell').children().removeClass('time-selector-range-desired');
    };

    // // show a schedule on calendar
    // that.markAvailableTimes = function (schedule) {
    //     that.clearCalenderSelections();
    //     _.zip(schedule, DAYS_OF_WEEK).forEach(function (tuple) {
    //         var available = tuple[0];
    //         var day = tuple[1];
    //         var cells = $('#time-selector-col-' + day + ' .time-selector-left-range');
    //         available.forEach(function (hr) {
    //             $(cells[hr-START_TIME]).addClass('time-selector-range-available');
    //         });
    //     });
    // };

    that.getStartDateOfSelectedWeek = function(){
        return new Date(date);
    };

    /**
    * Changes the internal start and end parameters and returns a new widget that reflects the change.
    * @param start {Number} Start Time in 24hr format
    * @param end {Number} End Time in 24hr format
    */
    that.changeRange = function(start, end){
       START_TIME = start;
       END_TIME = end;
       return createCalendarElt();
    };

    that.getRange = function(){
        return {start: START_TIME, end: END_TIME}
    };

    // create a calendar jquery object
    var createCalendarElt = function () {
        // add elements
        calendarElt = $('<div/>', {
            class: 'unhighlightable-text',
            id: 'calendar',
        });
        calendarElt.append(createWeekSelector());
        calendarElt.append(createTimeSelector());
        return calendarElt;
    };

    /*
     * Week selector
     */

    var createWeekSelector = function () {
        // base element
        var baseElt = $('<div/>', {
            id: 'week-selector',
        });
        // left: goto previous week
        var prevWeekBtnElt = $('<div/>', {
            class: 'col-xs-2 clickable-text-disabled',
            id: 'prev-week-btn',
        }).append($('<p/>', {
            class: 'center-text',
            text: '←',
        }));
        baseElt.append(prevWeekBtnElt);
        // center: show currently selected week
        var showWeekElt = $('<div/>', {
            class: 'col-xs-8',
            id: 'selected-week',
        }).append($('<p/>', {
            class: 'center-text',
            id: 'selected-week-text',
            text: weekText(CURRENT_DATE),
            style: 'width: 90%; text-align: center',
        }));
        // right: goto next week
        baseElt.append(showWeekElt);
        var nextWeekBtnElt = $('<div/>', {
            class: 'col-xs-2 clickable-text',
            id: 'next-week-btn',
        }).append($('<p/>', {
            class: 'center-text',
            text: '→',
        }));
        nextWeekBtnElt.click(function () {
            date = addDays(date, 7);
            calendarElt.find('#selected-week-text').text(weekText(date));
            changeDateText();
            enableDisablePrevWeekBtn();
            showAvailableTimes(availableTimes);
        });
        baseElt.append(nextWeekBtnElt);
        return baseElt;
    };

    // change dates in time selector headers
    var changeDateText = function () {
        _.range(7).forEach(function (idx) {
            var selector = '#time-selector-date-text-' + DAYS_OF_WEEK[idx];
            $(selector).text(dateToString(addDays(date, idx), false));
        });
    };
    
    var enableDisablePrevWeekBtn = function () {
        if (date <= CURRENT_DATE) {
            var prevWeekBtnElt = calendarElt.find('#prev-week-btn');
            prevWeekBtnElt.off('click');
            prevWeekBtnElt.removeClass('clickable-text');
            prevWeekBtnElt.addClass('clickable-text-disabled');
        } else {
            var prevWeekBtnElt = calendarElt.find('#prev-week-btn');
            prevWeekBtnElt.off('click').click(function () {
                date = addDays(date, -7);
                calendarElt.find('#selected-week-text').text(weekText(date));
                changeDateText();
                showAvailableTimes(availableTimes);
                enableDisablePrevWeekBtn();
            });
            prevWeekBtnElt.removeClass('clickable-text-disabled');
            prevWeekBtnElt.addClass('clickable-text');
        }
    };

    /*
     * Time selector
     */

    // dragging mechanism
    var toggling = false;
    var addingToSelector = false;

    var createTimeSelector = function () {
        var baseElt = $('<div/>', {
            id: 'time-selector',
        });
        baseElt.append(createTimeRangeDisplayColumn());
        _.range(7).forEach(function (idx) {
            baseElt.append(createTimeSelectColumn(idx));
        });
        return baseElt;
    };

    var createTimeRangeDisplayColumn = function () {
        var columnElt = $('<div/>', {
            class: 'col-8',
            id: "time-range"
        });
        var headerElt = $('<div/>', {
            class: 'time-selector-header',
        });
        columnElt.append(headerElt);
        _.range(START_TIME, END_TIME).forEach(function (hr) {
            var rangeElt = $('<div/>', {
                class: 'time-range-cell',
                text: convertTo12HrTime(hr),
            });
            columnElt.append(rangeElt);
        });
        return columnElt;
    };

    var createTimeSelectColumn = function (idx) {
        var day = DAYS_OF_WEEK[idx];
        var columnElt = $('<div/>', {
            class: 'col-8 time-selector-col',
            id: 'time-selector-col-' + day,
        });
        // header
        var headerElt = $('<div/>', {
            class: 'time-selector-header',
        });
        var dayTextElt = $('<p/>', {
            class: 'time-selector-header-text',
            text: day.charAt(0).toUpperCase() + day.slice(1), // capitalize first letter
        });
        headerElt.append(dayTextElt);
        var dateTextElt = $('<p/>', {
            class: 'time-selector-header-text',
            id: 'time-selector-date-text-' + day,
            text: dateToString(addDays(CURRENT_DATE, idx)),
        });
        headerElt.append(dateTextElt);
        columnElt.append(headerElt);
        // selector cells
        _.range(START_TIME, END_TIME).forEach(function (hr) {
            var rangeElt = $('<div/>', {
                class: 'time-selector-cell',
            });
            var leftRangeElt = $('<div/>', {
                class: 'time-selector-left-range',
            });
            rangeElt.append(leftRangeElt);
            var rightRangeElt = $('<div/>', {
                class: 'time-selector-right-range',
            });
            rangeElt.append(rightRangeElt);
            columnElt.append(rangeElt);
            // dragging mechanism
            rangeElt.mousedown(function () {
                toggling = true;
                if (rangeElt.children().hasClass('time-selector-range-desired')) {
                    addingToSelector = false;
                    rangeElt.children().removeClass('time-selector-range-desired');
                } else {
                    addingToSelector = true;
                    rangeElt.children().addClass('time-selector-range-desired');
                }
                $(document).mouseup(function () {
                    toggling = false;
                    //$('#calendar').trigger('timeUpdated');
                    $(document).off('mouseup');
                    updateAvailableTimes();
                    onSelectFunction(that);
                });
            });
            rangeElt.mousemove(function () {
                if (toggling === true) {
                    if (addingToSelector === true) {
                        rangeElt.children().addClass('time-selector-range-desired');
                    } else {
                        rangeElt.children().removeClass('time-selector-range-desired');
                    }
                }
            });
        });
        return columnElt;
    };

    /*
     * Date utilities
     */

    // display date in mm/dd/yyyy or mm/dd format
    // http://stackoverflow.com/questions/3066586/get-string-in-yyyymmdd-format-from-js-date-object
    var dateToString = function (d, displayYear) {
        var yyyy = d.getFullYear().toString();
        var mm = (d.getMonth()+1).toString(); // getMonth() is zero-based
        var dd  = d.getDate().toString();
        if (displayYear) {
            return (mm[1]?mm:'0'+mm[0]) + '/' + (dd[1]?dd:'0'+dd[0]) + '/' + yyyy;
        } else {
            return (mm[1]?mm:'0'+mm[0]) + '/' + (dd[1]?dd:'0'+dd[0]);
        }
    };

    // add a number of days to a date; original not modified
    var addDays = function (d, days) {
        var ret = new Date(d);
        ret.setDate(d.getDate() + days);
        return ret;
    };

    // get text representation of a week starting from a date
    var weekText = function (start) {
        var end = addDays(start, 6);
        return dateToString(start, true) + ' - ' + dateToString(end, true);
    };

    // convert 24-hour time to am/pm
    var convertTo12HrTime = function (n) {
        if (n === 0) {
            return '12 am';
        } else if (n < 12) {
            return n + ' am';
        } else if (n === 12) {
            return '12 pm';
        } else {
            return (n-12) + ' pm';
        }
    };

    // InterWeekOffset = how many weeks away from today
    // IntraWeekOffset = within a week, how many days away (ie, forgetting the week offset). eg, two wednesdays have 0
    //                      intra week offset
    // NOTE: time in millis must be in Local Time
    var getInterWeekOffsetAndIntraWeekOffsetFromToday = function(timeInMillis){
        var now = CURRENT_DATE.getTime();
        var offset = (parseInt(timeInMillis) - now)/WEEK_IN_MILLIS;
        var inter = parseInt(offset)%7;
        var intra = parseInt((offset-inter)*7);
        return {inter : inter, intra: intra};
    };

    // moves the first num elements to the back of the array
    var shiftArrayLeft = function(array, num){
        utils.times(num, function(){
            var t = array.shift();
            array.push(t);
            return t;
        });
    };

    setUpVariables();


    Object.freeze(that);
    return that;

};
