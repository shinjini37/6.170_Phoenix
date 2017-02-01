/**
 * Created by Shinjini on 12/10/2016.
 */

var express = require('express');
var router = express.Router();
var TopicModel = require('../models/Topic');

var errorHandler = require('../models/ErrorHandler');
var response = require('../models/Response');

/**
 * Get all the topics in the database
 */
router.get('/', function (req, res, next) {
    TopicModel.getAllTopics(function (err, topics) {
        if (err) {
            errorHandler.handleError(err, res);
        } else {
            response.handleResponse({topics: topics}, res);
        }
    })
});




module.exports = router;
