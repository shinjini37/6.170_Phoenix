$(document).ready(function () {

    if (sessionStorage.getItem('justSignedUp')) {
        window.sessionStorage.removeItem('justSignedUp');
        $('#introduction').modal();
    }

    $('#location-info input').each(function(idx, elt){
        $(elt).on('keypress', function(event){
            return event.charCode >= 48 && event.charCode <= 57
        });
    });


    var setAboutMeCounter = function(){
        var input = $('#about-me-input');
        $('#count').text(input.val().length);
        input.on('input', function(){
            $('#count').text(input.val().length);
        });
    };

    var updateAboutMeInDB = function(username, callback){
        var aboutMe = $('#about-me-input').val();

        if (aboutMe.length <= 250) { // about me can be empty, their wish!
            $('#loader-container').show();
            $.ajax({
                url: '/users/'+username+'/about',
                data: { aboutMe: aboutMe },
                type: 'PUT',
                success: function (res) {
                    $('#loader-container').hide();
                    if (JSON.parse(res.success)) {
                        callback();
                    } else {
                        $("about-me-updated-failure").show();
                        $("about-me-updated-failure").delay(5000).fadeOut();
                    }
                }
            });
        } else {
            var btn = $('#information-update');
            btn.attr('disabled', false);

            alert('Your "About Me" is too long.'); // TODO
        }
    };

    var getAboutMeFromDB = function(username){
        $('#loader-container').show();
        $.get('users/'+username+'/about',
            function (res) {
                $('#loader-container').hide();
                if (JSON.parse(res.success)) {
                    $('#about-me-input').val(res.aboutMe);
                    setAboutMeCounter();
                } else {
                    alert('Something went wrong with getting your About Me'); // FIXME
                }
            });
    };

    var updateLocationInDB = function(username, callback){
        var dataLocation = { location: $('#location-input').val() };
        $('#loader-container').show();
        $.ajax({
            url: '/users/'+username+'/location',
            data: dataLocation,
            type: 'PUT',
            success: function (res) {
                $('#loader-container').hide();
                if (JSON.parse(res.success)) {
                    callback();
                } else {
                    var btn = $('#information-update');
                    btn.attr('disabled', false);
                    $("#location-updated-failure").show();
                    $("#location-updated-failure").delay(5000).fadeOut();
                }
            }
        });
    };

    var updateLocationRadiusInDB = function(username, callback){
        $('#loader-container').show();
        var dataLocationRadius = { locationRadius: $('#location-radius-input').val() };
        $.ajax({
            url: '/users/'+username+'/preferences/location/radius',
            data: dataLocationRadius,
            type: 'PUT',
            success: function (res) {
                $('#loader-container').hide();
                if (JSON.parse(res.success)) {
                    callback();
                } else {
                    var btn = $('#information-update');
                    btn.attr('disabled', false);
                    $("#radius-updated-failure").show();
                    $("#radius-updated-failure").delay(5000).fadeOut();
                }
            }
        });
    };

    var makeOnUpdateFunction = function(username) {
        var onUpdateFunction = function () {
            var btn = $('#information-update');
            btn.attr('disabled', true);
            $("information-update-loader").show();
            updateLocationInDB(username, function(){
                $("information-update-loader").hide();
                updateLocationRadiusInDB(username, function(){
                    updateAboutMeInDB(username, function(){
                        btn.attr('disabled', false);
                        $("#information-updated-success").show();
                        $("#information-updated-success").delay(3000).fadeOut();
                    });
                });
            });
        };
        return onUpdateFunction;
    };

    var makeTopicOverlapOnClickFunction = function(username){
        return function(clickedElt){
            // var dataTopicOverlap = { topicOverlap: $('input[name="topic-overlap"]:checked').val() };
            $('#loader-container').show();
            var dataTopicOverlap = { topicOverlap: $(clickedElt).val() };
            $.ajax({
                url: '/users/'+username+'/preferences/topic/overlap',
                data: dataTopicOverlap,
                type: 'PUT',
                success: function (res) {
                    $('#loader-container').hide();
                    if (JSON.parse(res.success)) {
                        $(clickedElt).closest(".radio").effect("highlight", {color: "rgba(2, 159, 91, 0.5)"}, 1000);
                    } else {
                        alert('Something went wrong with updating your topic overlap'); // FIXME
                    }
                }
            });
        }
    };

    var updateLocationViewFromDBData = function (username) {
        $('#loader-container').show();
        $.get('users/'+username+'/location', function(res) {
            $('#loader-container').hide();
            if (JSON.parse(res.success)){
                $('#location-input').val(res.location);
            } else {
                alert('Something went wrong with getting your location'); // FIXME
            }
        });
    };

    var getLocationRadiusFromDB = function(username){
        $('#loader-container').show();
        $.get('users/'+username+'/preferences/location/radius', function(res) {
            $('#loader-container').hide();
            if (JSON.parse(res.success)){
                $('#location-radius-input').val(res.locationRadius);
            } else {
                alert('Something went wrong with getting your search radius'); // FIXME
            }
        });
    };

    var getTopicOverlapFromDB = function(username){
        $('#loader-container').show();
        $.get('users/'+username+'/preferences/topic/overlap', function(res) {
            $('#loader-container').hide();
            if (JSON.parse(res.success)){
                $('input[name="topic-overlap"]').each(function(elt){
                    elt.checked = false;
                });

                $('input[name="topic-overlap"][value="'+res.topicOverlap+'"]')[0].checked = true;
            } else {
                alert('Something went wrong with getting your topic overlap'); // FIXME
            }
        });
    };


    $.get('auth/signin', function(res){
        if (JSON.parse(res.success)){
            var username = res.username;
            $('#username').text(username);

            var topicInterestCheckFn = function(interestTopicId) {
                $('#loader-container').show();
                $.ajax({
                    url: '/users/' + username + '/interests/topics/',
                    data: { topicId: interestTopicId },
                    type: 'POST',
                    success: function (res) {
                        $('#loader-container').hide();

                        if (JSON.parse(res.success)) {
                            $("#topicRow_" + interestTopicId).effect("highlight", {color: "rgba(2, 159, 91, 0.5)"}, 1000);
                        } else {
                            $("#topic_" + interestTopicId).attr("checked", false);
                        }
                    }
                });
            };

            var topicInterestUncheckFn = function(interestTopicId) {
                $('#loader-container').show();

                $.ajax({
                    url: '/users/' + username + '/interests/topics/' + interestTopicId,
                    type: 'DELETE',
                    success: function(res) {
                        $('#loader-container').hide();

                        if (JSON.parse(res.success)) {
                            $("#topicRow_" + interestTopicId).effect("highlight", {color: "rgba(255, 0, 0, 0.5)"}, 1000);
                        } else {
                            $("#topic_" + interestTopicId).attr("checked", true);
                        }
                    }
                });
            };

            var topics = TopicWidget(topicInterestCheckFn, topicInterestUncheckFn);
            var topicWidget = topics.getTopicElt();
            $('#topics-container').append(topicWidget);


            // Get topics from database
            $.get('/topics', function (allTopicsRes) {
                if (JSON.parse(res.success)) {
                    var allTopics = allTopicsRes.topics;
                    // Find out which topics a user is interested in
                    $.get('/users/' + username + '/interests/topics', function (interestTopicsRes) {
                        var interestedTopics = interestTopicsRes.topics;

                        topics.addTopics(allTopics, interestedTopics);
                    });
                }
            });

            updateLocationViewFromDBData(username);
            getLocationRadiusFromDB(username);
            getTopicOverlapFromDB(username);
            getAboutMeFromDB(username);
            $("#information-update").click(makeOnUpdateFunction(username));
            $("#information-updated-success").hide();
            $("#information-update-loader").hide();
            $("#about-me-updated-failure").hide();
            $("#location-updated-failure").hide();
            $("#radius-updated-failure").hide();
            $('input[name="topic-overlap"]').click(function(){
                makeTopicOverlapOnClickFunction(username)(this);
            });
        } else {
            window.location = 'signin.html';
        }
    });

});