/**
 * Created by Shinjini on 11/18/2016.
 */

/**
 * This is a class to encapsulate all response handling for the index router.
 * @returns {IndexResponse}
 * @constructor
 */
var IndexResponse = function() {
    var that = Object.create(IndexResponse);

    /**
     * Sends data back to the client
     *
     * @param data
     * @param res
     */
    that.handleResponse = function(data, res){
        res.status(200);
        data.success = true;
        res.json(data);
    };

    Object.freeze(that);
    return that;
};

module.exports = IndexResponse();
