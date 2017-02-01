$(document).ready(function() {

    var pastConnectionsTable = document.getElementById('connections-history-body');
    var allConnectionsMasterList = [];

    var loadPastConnectionsFromDB = function (loggedInUsername, journalWidget, callback) {
        $('#loader-container').show();
        $.get('users/' + loggedInUsername + '/connections', function (res) {
            $('#loader-container').hide();
            if (JSON.parse(res.success)) {
                var allConnections = journalWidget.updatePastConnections(loggedInUsername, res.connections);
                callback(null, allConnections);
            } else {
                alert('Something went wrong while loading past connections.');
                callback('error'); // FIXME
            }

        });
    };

    var makeAddNote = function(sorterAndSearcher){
        return function (journalWidget, loggedInUsername, connectionId, content) {
            $('#loader-container').show();
            var btn = $('[data-connectionId = "' + connectionId + '"] .add-note-btn');
            btn.attr('disabled', true);

            $.post('users/' + loggedInUsername + '/connections/' + connectionId + '/notes',
                {content: content},
                function (res) {
                    btn.attr('disabled', false);
                    $('#loader-container').hide();
                    if (JSON.parse(res.success)) {
                        journalWidget.addNoteToWidget(connectionId, res.newNote);
                        allConnectionsMasterList.forEach(function(connection){
                            if (connection._id == connectionId){
                                connection.notes.push(res.newNote);
                            }
                        });
                        sorterAndSearcher.addConnectionsList(allConnectionsMasterList);
                    } else {
                        alert('Something went wrong in adding this note.');
                    }
                });
        };
    };

    var makeUpdateNote = function(sorterAndSearcher){
        return function (journalWidget, loggedInUsername, connectionId, noteId, newContent) {
            $('#loader-container').show();
            var btn = $('[data-noteId = "' + noteId + '"] .update-note-btn');
            btn.attr('disabled', true);

            $.ajax({
                url: '/users/' + loggedInUsername + '/connections/' + connectionId + '/notes/' + noteId,
                data: {newContent: newContent},
                type: 'PUT',
                success: function (res) {
                    btn.attr('disabled', false);
                    $('#loader-container').hide();
                    if (JSON.parse(res.success)) {
                        journalWidget.updateNoteInWidget(connectionId, noteId, res.updatedNote);
                        allConnectionsMasterList.forEach(function(connection, idxConn){
                            if (connection._id == connectionId){
                                connection.notes.forEach(function(note, idxNote){
                                    if (note._id == noteId){
                                           allConnectionsMasterList[idxConn].notes[idxNote] = res.updatedNote;
                                    }
                                });
                            }
                        });
                        sorterAndSearcher.addConnectionsList(allConnectionsMasterList);
                    } else {
                        alert('Something went wrong with updating this note.'); // FIXME
                    }
                }
            });
        };
    };

    var makeDeleteNote = function(sorterAndSearcher){
        return function (journalWidget, loggedInUsername, connectionId, noteId) {
            $('#loader-container').show();
            var btn = $('[data-noteId = "' + noteId + '"] .delete-note-btn');
            btn.attr('disabled', true);

            $.ajax({
                url: '/users/' + loggedInUsername + '/connections/' + connectionId + '/notes/' + noteId,
                data: {},
                type: 'DELETE',
                success: function (res) {
                    btn.attr('disabled', false);
                    $('#loader-container').hide();
                    if (JSON.parse(res.success)) {
                        journalWidget.removeNoteInWidget(connectionId, noteId);
                        allConnectionsMasterList.forEach(function(connection, idxConn){
                            if (connection._id == connectionId){
                                connection.notes.forEach(function(note, idxNote){
                                    if (note._id == noteId){
                                        allConnectionsMasterList[idxConn].notes[idxNote].deleted = true;
                                    }
                                });
                            }
                        });
                        sorterAndSearcher.addConnectionsList(allConnectionsMasterList);
                    } else {
                        alert('Something went wrong with deleting this note.'); // FIXME
                    }
                }
            });
        };

    };

    var addNote = function (journalWidget, loggedInUsername, connectionId, content) {
        $('#loader-container').show();
        var btn = $('[data-connectionId = "' + connectionId + '"] .add-note-btn');
        btn.attr('disabled', true);

        $.post('users/' + loggedInUsername + '/connections/' + connectionId + '/notes',
            {content: content},
            function (res) {
                btn.attr('disabled', false);
                $('#loader-container').hide();
                if (JSON.parse(res.success)) {
                    journalWidget.addNoteToWidget(connectionId, res.newNote);
                } else {
                    alert('Something went wrong in adding this note.');
                }
            });
    };

    var updateNote = function (journalWidget, loggedInUsername, connectionId, noteId, newContent) {
        $('#loader-container').show();
        var btn = $('[data-noteId = "' + noteId + '"] .update-note-btn');
        btn.attr('disabled', true);

        $.ajax({
            url: '/users/' + loggedInUsername + '/connections/' + connectionId + '/notes/' + noteId,
            data: {newContent: newContent},
            type: 'PUT',
            success: function (res) {
                btn.attr('disabled', false);
                $('#loader-container').hide();
                if (JSON.parse(res.success)) {
                    journalWidget.updateNoteInWidget(connectionId, noteId, res.updatedNote);
                } else {
                    alert('Something went wrong with updating this note.'); // FIXME
                }
            }
        });
    };

    var deleteNote = function (journalWidget, loggedInUsername, connectionId, noteId) {
        $('#loader-container').show();
        var btn = $('[data-noteId = "' + noteId + '"] .delete-note-btn');
        btn.attr('disabled', true);

        $.ajax({
            url: '/users/' + loggedInUsername + '/connections/' + connectionId + '/notes/' + noteId,
            data: {},
            type: 'DELETE',
            success: function (res) {
                btn.attr('disabled', false);
                $('#loader-container').hide();
                if (JSON.parse(res.success)) {
                    journalWidget.removeNoteInWidget(connectionId, noteId);
                } else {
                    alert('Something went wrong with deleting this note.'); // FIXME
                }
            }
        });
    };


    $.get('auth/signin', function (res) {
        if (JSON.parse(res.success)) {
            var loggedInUsername = res.username;

            var sorterAndSearcher = SorterAndSearcher(loggedInUsername);

            // var journalWidget = JournalWidget(loggedInUsername, pastConnectionsTable, addNote, updateNote, deleteNote);
            var journalWidget = JournalWidget(loggedInUsername, pastConnectionsTable,
                makeAddNote(sorterAndSearcher), makeUpdateNote(sorterAndSearcher), makeDeleteNote(sorterAndSearcher));

            loadPastConnectionsFromDB(loggedInUsername, journalWidget, function (err, allConnections) {
                if (err) {
                    // TODO
                } else {
                    allConnectionsMasterList = allConnections;
                    // var sorterAndSearcher = SorterAndSearcher(loggedInUsername, journalWidget.updatePastConnections);
                    sorterAndSearcher.addUpdateConnectionsFunction(journalWidget.updatePastConnections);
                    sorterAndSearcher.setUpSearchAndSort(allConnectionsMasterList);
                }
            });
        } else {
            window.location = 'signin.html';
        }
    });

});