/**
 * Created by Shinjini on 12/10/2016.
 */
var JournalWidget = function(loggedInUsername, pastConnectionsTable, addNote, updateNote, deleteNote) {
    var that = Object.create(JournalWidget);

    Handlebars.partials = Handlebars.templates;

    var setNoteLengthCounter = function(){
        var noteInputs = $('.note-input');
        noteInputs.each(function(idx, noteInput){
            noteInput = $(noteInput);
            var count = noteInput.parent().find('#count');
            count.text(noteInput.val().length)
            noteInput.unbind().on('input', function(){
                count.text(noteInput.val().length);
            });
        });
    };


    // format a note from the backend for viewing
    // doesn't matter if you format an already formatted note
    var formatNote = function (note) {
        var formattedNote = JSON.parse(JSON.stringify(note));
        formattedNote.noteId = note._id;
        formattedNote.deleted = JSON.parse(note.deleted);
        var numVersions = note.versions.length;
        formattedNote.versions.forEach(function (version, idx) {
            version.latest = (idx == (numVersions - 1));// latest version
            version.writeDate = utils.getPrettyPrintLocalTime(utils.getTimeInLocal(version.writeTime));
        });
        return formattedNote;
    };


    // format a connection from the backend for viewing
    // doesn't matter if you format an already formatted connection
    var formatConnection = function (connection) {
        var formattedConnection = JSON.parse(JSON.stringify(connection));
        formattedConnection.openDate = utils.getPrettyPrintLocalTime(utils.getTimeInLocal(connection.openTime));

        if (formattedConnection.closeTime) {
            formattedConnection.closeDate = utils.getPrettyPrintLocalTime(utils.getTimeInLocal(connection.closeTime));
        }
        formattedConnection.notes = formattedConnection.notes.map(function (note) {
            return formatNote(note);
        });
        return formattedConnection;
    };

    var bindNoteAddUpdateDeleteListeners = function (loggedInUsername) {
        $('.add-note-btn').unbind().click(function () {
            var btn = $(this);
            var content = btn.parent().find('.new-note-input').val();
            if ((content.length > 0) && (content.length <= 250 )) {
                var connectionId = btn.parent().parent().parent().data('connectionid');
                addNote(that, loggedInUsername, connectionId, content);
            } else {
                alert('Your note needs to have some content! Or it is too long.'); // TODO
            }

        });

        $('.update-note-btn').unbind().click(function () {
            var btn = $(this);
            var content = btn.parent().find('.update-note-input').val();
            if ((content.length > 0) && (content.length <= 250 )) {
                var connectionId = btn.parent().parent().parent().parent().data('connectionid');
                var noteId = btn.parent().parent().data('noteid');
                updateNote(that, loggedInUsername, connectionId, noteId, content);
            } else {
                alert('Your note needs to have some content! Or it is too long.'); // TODO
            }
        });

        $('.delete-note-btn').unbind().click(function () {
            var btn = $(this);
            var connectionId = btn.parent().parent().parent().parent().data('connectionid');
            var noteId = btn.parent().parent().data('noteid');
            deleteNote(that, loggedInUsername, connectionId, noteId);
        });

        $('.view-previous-note-btn').unbind().click(function(){
            var btn = $(this);
            var prevs = btn.parent().parent().find('.previous');
            if (JSON.parse(btn.data('active'))){ // hide the things
                prevs.addClass('hidden');
                btn.text('View Previous Versions');
                btn.data('active', false);
            } else {
                prevs.removeClass('hidden');
                btn.text('Hide Previous Versions');
                btn.data('active', true);
            }

        });


    };

    var bindDisinterestEventListener = function(loggedInUsername){
        var checkOrUncheckStillInterested = function(disinterestUsername, check){
            $('[data-connectUsername='+disinterestUsername+'] .still-interested').each(function(idx, elt){
                elt.checked = check;
            });
        };

        $('.still-interested').unbind().click(function () {
            var checkbox = $(this);
            var stillInterested = checkbox[0].checked;
            var disinterestUsername = checkbox.parent().parent().data('connectusername');
            if (stillInterested){
                $.ajax({
                    url: '/users/' + loggedInUsername + '/disinterests/users/'+disinterestUsername,
                    data: {},
                    type: 'DELETE',
                    success: function (res) {
                        if (JSON.parse(res.success)) {
                            checkbox.closest('tr').effect("highlight", {color: "rgba(2, 159, 91, 0.5)"}, 1000);
                            checkOrUncheckStillInterested(disinterestUsername, true);
                        } else {
                            checkOrUncheckStillInterested(disinterestUsername, false);
                        }
                    }
                });
            } else {
                $.post('users/' + loggedInUsername + '/disinterests/users',
                    {disinterestUsername: disinterestUsername},
                    function (res) {
                        if (JSON.parse(res.success)) {
                            checkbox.closest('tr').effect("highlight", {color: "rgba(255, 0, 0, 0.5)"}, 1000);
                            checkOrUncheckStillInterested(disinterestUsername, false);
                        } else {
                            checkOrUncheckStillInterested(disinterestUsername, true);
                        }
                    });
            }
        });
    };

    var bindAllNoteListeners = function(loggedInUsername){
        bindNoteAddUpdateDeleteListeners(loggedInUsername);
        bindDisinterestEventListener(loggedInUsername);
        setNoteLengthCounter();
    };

    that.updatePastConnections = function (loggedInUsername, connections) {
        $("#connections-history-body tr").remove();
        var connectionsList = [];

        connections.forEach(function (connection) {
            var formattedConnection = formatConnection(connection);

            var newTR = Handlebars.templates.pastConnection(formattedConnection);
            $(pastConnectionsTable).append(newTR);
            connectionsList.push(formattedConnection);
        });
        bindAllNoteListeners(loggedInUsername);
        return connectionsList
    };

    that.addNoteToWidget = function(connectionId, noteInfo){
        var connectionElt = $('[data-connectionId = "' + connectionId + '"]');
        connectionElt.find('.notes').append(Handlebars.templates.note(formatNote(noteInfo)));
        connectionElt.find('.new-note-input').val('');
        bindAllNoteListeners(loggedInUsername);
    };

    that.updateNoteInWidget = function(connectionId, noteId, noteInfo){
        $('[data-noteId = "' + noteId + '"]')[0].outerHTML = Handlebars.templates.note(formatNote(noteInfo));
        bindAllNoteListeners(loggedInUsername);
    };

    that.removeNoteInWidget = function(connectionId, noteId){
        $('[data-noteId = "' + noteId + '"]').remove();
    };

    Object.freeze(that);
    return that;
};
