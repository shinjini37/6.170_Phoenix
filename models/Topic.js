/**
 * Created by Kim on 11/26/2016
 *
 * To manage topics, use https://www.humongous.io.
 */

var mongoose = require("mongoose");

var TopicSchema = mongoose.Schema({
    name: {type: String, required: true},
    description: {type: String, required: true},
    position: {type: String},
    inUse: {type: Boolean, required: true}
});

/**
 * Gets all topics from the DB.
 * @param callback
 */
TopicSchema.statics.getAllTopics = function (callback) {
    TopicModel.find({}, callback);
};

var TopicModel = mongoose.model("Topic", TopicSchema);

module.exports = TopicModel;
