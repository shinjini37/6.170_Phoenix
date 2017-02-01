
var TopicWidget = function(topicInterestCheckFn, topicInterestUncheckFn) {
    var that = Object.create(TopicWidget);

    var topicElt;

    that.getTopicElt = function(){
        return topicElt;
    };

    // Add topics to the topic widget and check the ones that the user is interested in
    that.addTopics = function(allTopics, interestedTopics){
        // Check each topic to see if it's in the user's list of desired topics
        var topicInfos = allTopics.map(function (topic) {
            var info = JSON.parse(JSON.stringify(topic));
            info.interested = interestedTopics.map( function (t) { return t == null || t._id } ).includes(topic._id);
            return info;
        });

        // Add the topics to the topic widget
        topicInfos.forEach(function (info) {
            that.addTopic(info);
        });
    };

    /**
     * Adds a topic to the topic table
     */
    that.addTopic = function(topicInfo){
        var topicRow = $('<tr></tr>');
        var topicId = topicInfo._id;
        topicRow.addClass('topicRow');
        topicRow.attr('id', 'topicRow_'+topicId);
        topicRow.data('topicid', topicId);

        var checkboxElt = $('<input type="checkbox" id="topic_' + topicId + 'input">');
        var checkboxCell = $('<td></td>').append(checkboxElt)
        checkboxElt.attr('checked', JSON.parse(topicInfo.interested));
        var nameCell = $('<td>'+topicInfo.name+'</td>');
        var positionCell = $('<td>'+topicInfo.position+'</td>');

        // Add the checkbox, topic name, and position to the row
        topicRow.append(checkboxCell).append(nameCell).append(positionCell);

        checkboxElt.click(function () {
            if (this.checked) { // becoming interested
                topicInterestCheckFn(topicId);
            } else { // becoming uninterested
                topicInterestUncheckFn(topicId);
            }
        });

        topicElt.append(topicRow);
    };

    var createTopicElt = function () {
        topicElt = $('<table></table>');
        topicElt.attr('id', 'topics');
        var headerRow = $('<tr> <td></td> <th>Topic</th> <th>Position</th> </tr>');
        topicElt.append(headerRow);

        return topicElt;
    };


    topicElt = createTopicElt();


    Object.freeze(that);
    return that;
};

