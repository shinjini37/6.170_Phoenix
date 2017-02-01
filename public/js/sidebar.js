$(document).ready(function() {
    // All things Handlebars
    // Allow using Handlebars templates as partials as well.
    Handlebars.partials = Handlebars.templates;

    // Check that the user is logged in and add their username
    $.get('auth/signin', function (res) {
        var sidebar = Handlebars.templates.sidebar(res);
        $('#sidebar-container').html(sidebar);

        $('.sidebar-link').each(function() {
            if ($(this).prop('href') == window.location.href) {
                $(this).css("color" ,"white");
            }
        });

        $('#signout').click(function(){
            $('#loader-container').show();
            $.post('auth/signout',
                {},
                function(res){
                    $('#loader-container').hide();
                    if (JSON.parse(res.success)){
                        window.sessionStorage.removeItem('loggedInUsername');
                        window.location = 'signin.html';
                    } else {
                        $('#issue').text(res.message);
                    }
                }
            );
        });
    });
});