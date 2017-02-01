var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var authRoutes = require('./routes/auth');
var usersRoutes = require('./routes/users');
var topicsRoutes = require('./routes/topics');

var mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/phoenixdb');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
 console.log("database connected");
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret: 'suchsecretwow',
    resave: true,
    saveUninitialized: true})
);
app.set('view engine', '.hbs');

// Uncomment after favicon is placed in public
// favicon
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/topics', topicsRoutes);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        //res.json({
        //  'message': err.message,
        //  'error': err
        //});
        res.render('error', {'message': err.message});
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    //res.json({
    //    'error': err.message
    //});
    res.render('error', {'message': err.message});
});


module.exports = app;
