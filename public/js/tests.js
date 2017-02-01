/**
 * Created by Shinjini on 11/18/2016.
 */
$(document).ready(function() {
    // NOTE! This is not a real test suite by just contains some code that can be used for testing. Should be
    // turned into a real test suite soon though.


    // var test = function(){
    //     var username = (new Date()).getTime();
    //     var password = 'password';
    //     $.post('auth/signup',
    //         {username: username,
    //             password: password},
    //         function(res){
    //             console.log('signup ', res.success);
    //             $.post('auth/signout',
    //                 {},
    //                 function(res){
    //                     console.log('signout', res.success);
    //                     $.post('auth/signin',
    //                         {username: username,
    //                             password: password},
    //                         function(res){
    //                             console.log('signin', res.success);
    //                         }
    //                     );
    //                 }
    //             );
    //         }
    //     );
    // };

    var test = function(){
        var username = (new Date()).getTime();
        var password = 'password';
        $.post('auth/signup',
            {username: username,
                password: password},
            function(res){
                console.log('signup ', res.success);
                $.get('user/'+username+'/calendar',
                    {},
                    function(res){
                        console.log('calendar', res.availability);
                        var data = {availability: [1479920200000, 1479920400000, 1479924000000], moop: ['a', 'b'], doop: 'c'};
                        $.ajax({
                            url: '/user/'+username+'/calendar',
                            data: data,
                            type: 'PUT',
                            success: function (res) {
                                console.log('update', res.success, res.error);
                                $.get('user/'+username+'/calendar',
                                    {},
                                    function(res){
                                        console.log('calendar', res.availability);

                                    }
                                );
                            }
                        });
                    }
                );
            }
        );
    };


    // var test = function(){
    //     var findMatchingTimes = function(a1, a2){
    //         var unorderedCombinations = function(array1, array2, fn){
    //             for (var i = 0; i < array1.length; i++) {
    //                 for (var j = i; j < array2.length; j++) {
    //                     fn(array1[i], array2[j]);
    //                 }
    //             }
    //         };
    //
    //         var now = (new Date()).getTime();
    //         var matchingTimes = [];
    //         a1.forEach(function(time1){
    //             a2.forEach(function(time2){
    //                 time1 = parseInt(time1);
    //                 time2 = parseInt(time2);
    //                 if (time1>now && time2>now){
    //                     console.log(time1, time2);
    //                     if (time1 == time2){
    //
    //                         matchingTimes.push(String(time1));
    //                     }
    //                 }
    //             });
    //         });
    //         return matchingTimes;
    //     };
    //
    //     var a1 = [1479920200000, 1479920400000, 1479924000000];
    //     var a2 = [1479920400000, 1479924000000, 1479927600000, 1479931200000, 1479934800000, 1479938400000, 1479942000000, 1479945600000, 1479949200000, 1479952800000, 1480093200000, 1480096800000, 1480100400000, 1480104000000, 1480107600000, 1480111200000, 1480114800000, 1480118400000, 1480122000000, 1480125600000]
    //     var matchTimes = findMatchingTimes(a1, a2);
    //     console.log(matchTimes);
    //
    // };

    test();

});

