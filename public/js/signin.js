/**
 * Created by Shinjini on 11/22/2016.
 */
$(function() {
    // from http://bootsnipp.com/snippets/featured/login-and-register-tabbed-form
    $("#register-form").hide();
    $('#login-form-link').click(function(e) {
        $("#login-form").delay(100).fadeIn(100);
        $("#register-form").fadeOut(100);
        $('#register-form-link').removeClass('active');
        $(this).addClass('active');
        e.preventDefault();
    });
    $('#register-form-link').click(function(e) {
        $("#register-form").delay(100).fadeIn(100);
        $("#login-form").fadeOut(100);
        $('#login-form-link').removeClass('active');
        $(this).addClass('active');
        e.preventDefault();
    });


    // signs up a new user, and if the user is already signed up, prompts them to sign in
    $('#register-submit').click(function(e){
        var btn = $(this);
        btn.attr('disabled', true);
        e.preventDefault(); // to prevent refreshing on click
        var username = $('#signup-username').val();
        var password = $('#signup-password').val();
        var confirmPassword = $('#signup-confirm-password').val();
        var email = $('#signup-email').val();
        var publicEmail = $('#signup-public-email').val();
        if (username != username.toLowerCase()){
            $('#issue').text('Username must be in lowercase. Allowed characters are letters, numbers, -, _, ., and no spaces');
        } else if (password != confirmPassword){
            $('#issue').text('Passwords do not match!');
        }
        else {
            $.post('auth/signup',
                {
                    username: username,
                    password: password,
                    email: email,
                    publicEmail: publicEmail
                },
                function (res) {
                    if (JSON.parse(res.success)) {
                        window.sessionStorage.setItem('justSignedUp', true);
                        window.location = 'personal.html';
                    } else {
                        $('#issue').text(res.message);
                    }
                }
            );
        }
        btn.attr('disabled', false);
    });

    // signs in a user, and if the user is not signed up, prompts them to sign up
    $('#login-submit').click(function(e){
        var btn = $(this);
        btn.attr('disabled', true);

        e.preventDefault();// to prevent refreshing on click
        var username = $('#signin-username').val();
        var password = $('#signin-password').val();

        if (username.length>0){
            $.post('auth/signin',
                {username: username,
                    password: password},
                function(res){
                    if (JSON.parse(res.success)){
                        window.location = 'index.html';
                    } else {
                        $('#issue').text(res.message);
                    }
                }
            );
        }
        btn.attr('disabled', false);
    });


    $.get('auth/signin', function(res){
        if (JSON.parse(res.success)){
            window.location = 'index.html'; // don't want them messing around when they are still signed in
        }
    });
});
