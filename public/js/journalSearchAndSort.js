/**
 * Created by Shinjini on 12/10/2016.
 */
var SorterAndSearcher = function(loggedInUsername){
    var that = Object.create(SorterAndSearcher);

    var allConnections = [];
    var connectionsByUser = {};

    var filterUser = '';

    var updatePastConnections = function(){
        console.log('unassigned');
    };

    var Sorter = function () {
        var subThat = Object.create(Sorter);
        // 1 = a-z or ascending, -1 = z-a or descending
        // the 1st item is the secondary sort and the 1st one is primary
        // It will sort twice, the secondary first, then the primary
        var sortOrder = [{username: 1}, {openTime: 1}];


        var sort = function (connections, type, order) {
            // if no type and order, just sort by the stored sort order
            var usernameAZ = function (a, b) {
                if (a.connectUsername > b.connectUsername) {
                    return 1;
                } else if (a.connectUsername == b.connectUsername) {
                    return 0
                } else {
                    return -1
                }
            };
            var openTimeON = function (a, b) {
                return a.openTime - b.openTime;
            };

            if (type) {
                // check if the shortOrder has to be shifted:
                if (Object.keys(sortOrder[1])[0] != type) {// then need to flip the order
                    var temp = [];
                    temp.push(sortOrder[1]);
                    temp.push(sortOrder[0]);
                    sortOrder = temp;
                }
                sortOrder[1][type] = order; // in any case, update the order
            }

            var sortedConnections = connections;
            sortOrder.forEach(function (sortTypeAndOrder) {
                var type = Object.keys(sortTypeAndOrder)[0];
                var order = sortTypeAndOrder[type];
                if (type == 'username') {
                    sortedConnections = sortedConnections.sort(function (a, b) {
                        return (order) * usernameAZ(a, b);
                    });
                } else if (type == 'openTime') {
                    sortedConnections = sortedConnections.sort(function (a, b) {
                        return (order) * openTimeON(a, b)
                    });
                } else {

                }
            });
            return sortedConnections;
        };

       subThat.bindSortEventListener = function (connectionsList) {
            $('#sort-select').unbind().change(function () {
                var val = $(this).val();
                var typeAndOrder = val.split('-');
                var type = typeAndOrder[0];
                var order = [typeAndOrder[1]].map(function (code) {
                    if ((code == 'AZ') || (code == 'ON')) {
                        return 1
                    } else {
                        return -1
                    }
                })[0]; // sorry this looks a bit weird
                var sortedConnections = sort(connectionsList, type, order);
                updatePastConnections(loggedInUsername, sortedConnections);
            });
        };

        // sorts the list according to the saved sort orders
        subThat.sort = function (connectionsList) {
            var sortedConnections;

            if (connectionsList) {
                sortedConnections = sort(connectionsList);
            } else {
                sortedConnections = sort(allConnections);
            }
            return sortedConnections;
        };

        return subThat;

    };

    var sorter = Sorter();

    that.addConnectionsList = function (connectionsList) {
        allConnections = JSON.parse(JSON.stringify(connectionsList));
        connectionsByUser = {};
        allConnections.forEach(function (connection) {
            if (!(connection.connectUsername in connectionsByUser)) {
                connectionsByUser[connection.connectUsername] = [];
            }
            connectionsByUser[connection.connectUsername].push(connection);
        });
        if (filterUser.length>0){
            if (filterUser in connectionsByUser){
                sorter.bindSortEventListener(connectionsByUser[filterUser]);
            } else {
                sorter.bindSortEventListener([]);
            }
        } else {
            sorter.bindSortEventListener(connectionsList);
        }
        setUpSearch();
    };


    var setUpSearch = function () {
        var trie = Trie();

        var userList = Object.keys(connectionsByUser);

        userList.forEach(function (username) {
            trie.addWord(username);
        });

        $('#search-term-input').unbind().on('input', function () {
            var resultList = $('#results-list');
            resultList.children().remove();
            var prefix = $(this).val();
            if (prefix.length > 0) {
                trie.autocomplete(prefix).forEach(function (username) {
                    var li = $('<li></li>');
                    li.text(username);
                    (function () {
                        var thisUsername = username;
                        li.click(function () {
                            filterUser = thisUsername;
                            var userConnections = connectionsByUser[thisUsername];
                            // update the sorter list and sort and load it
                            sorter.bindSortEventListener(userConnections);
                            updatePastConnections(loggedInUsername, sorter.sort(userConnections));
                        });
                    })();
                    resultList.append(li);
                });
            } else {
                // reset the filter user
                filterUser = '';
                // update the sorter list and sort and load it
                sorter.bindSortEventListener(allConnections);
                updatePastConnections(loggedInUsername, sorter.sort(allConnections));
            }
        });
    };

    that.addUpdateConnectionsFunction = function(fn){
        updatePastConnections = fn;
    };

    that.setUpSearchAndSort = function(allConnections){
        that.addConnectionsList(allConnections);
        setUpSearch();
    };

    return that;
};








