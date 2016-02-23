/**
 * Created by Abu on 2/5/2016.
 */
// BASE SETUP
// ==================================


// CALL THE PACKAGES ----------------
var express    = require('express'); // call express
var app        = express(); // define our app using express
var bodyParser = require('body-parser'); // get body-parser
var morgan     = require('morgan'); // used to see request
var mongoose   = require('mongoose'); // for working w/ our database
var port       = process.env.PORT || 8080; // set the port for our app
var User       = require('./models/user.js');
var jwt        = require('jsonwebtoken');


var superSecert = "Ilovetolearnalot";

// APP CONFIGURATION ------------------
// use body parser so we can grab information from POST requests
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

// configure our app to handle CORS requests
app.use(function(req, res, next){
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers','X-Requested-With,content-type, \Authorization');
    next();
});

// check the connection
mongoose.connection.on('open', function(ref){
    console.log('Connected to mongo server.');
});

mongoose.connection.on('error', function(err){
    console.log('Could not connect to mongo server!');
    console.log(err);
});


//connect to our database (hosted on modulus.io
mongoose.connect('mongodb://Abu:revolutionary@apollo.modulusmongo.net:27017/dyver8Im');
//mongoose.connect('mongodb://localhost:27017/test');

// log all requests to the console
app.use(morgan('dev'));

// ROUTES FOR OUR API
// =======================================

// basic route for the home page
app.get('/', function(req, res){
    res.send('Welcome to the home page!');
});

// get an instance of the express router
var apiRouter = express.Router();


// route for authenticating users
apiRouter.post('/authenticate', function(req, res){
     // find the user
    // select the name username and password explicitly
    User.findOne({
        username: req.body.username
    }).select('name username password').exec(function(err, user){
        // no user with that username was found
        if(!user){
            res.json({
                success: false,
                message: 'Authentication failed. | User not found.'
            });
        }else if(user){
            // if user is found and password is right
            // create a token
            var token = jwt.sign({
                name: user.name,
                username: user.username
            }, superSecert, {
                expiresInMinutes: 1440 // expires in 24 hours
            });

            // return the information including token as JSON
            res.json({
                success: true,
                message: 'Enjoy your token!',
                token: token
            });
        }
    });
});




apiRouter.use(function(req, res, next){
   // do logging
    console.log('Someday just came to our app!');

    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode token
    if(token){
        // verifies secert and checks exp
        jwt.verify(token, superSecert, function(err, decoded){
            if(err){
                return res.status(403).send({
                    success: false,
                    message: 'Failed to authenticate token.'
                });
            }else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;

                next();
            }
        });
    } else{
        // if there is no token
        // return as HTTP response of 403 (access forbidden) and an error message
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });
    }


   // next();
});

// test route to make sure everything is working
// accessed at GET http://localhost:8080/api
apiRouter.get('/', function(req, res){
    res.json({ message: 'hooray! welcome to our api!'});
});

// more routes for our API will happen here
apiRouter.route('/users')

        // create a user (accessed at POST http://localhost:8080/api/users)
    .post(function(req, res){
        // create a new instance of the User model
        var user = new User();

        // set the users information (comes from the request)
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        // save the user and check for errors
        user.save(function(err){
           if(err){
               //duplicate entry
               if(err.code == 11000){
                   return res.json({ success: false, message: 'A user with that username already exists. '});
               }else{
                   return res.send(err);
               }
           }
            res.json({ message: 'User created! '});
        });
    })

    // get all the users (accessed at GET http://localhost:8080/api/users)
    .get(function(req, res){
        User.find(function(err, users){
            if(err){
                res.send(err);
            }

            // return the users
            res.json(users);
        });
    });

apiRouter.route('/users/:user_id')

        // get the user with that id
        // (accessed at GET http://localhost:8080/api/users/:user_id)
    .get(function(req, res){
        User.findById(req.params.user_id, function(err, user){
            if(err){
                res.send(err);
            }

            // return that user
            res.json(user);
        });
    })

    // update the user with this id
    // (accessed at PUT http://localhost:8080/api/users/:user_id)
    .put(function(req, res){

        // user our user model to find the user we want
        User.findById(req.params.user_id, function(err, user){
            if(err){
                res.send(err);
            }

            // update the users info only if it's new
            if(req.body.name){
                user.name = req.body.name;
            }
            if(req.body.username){
                user.username = req.body.username;
            }
            if(req.body.username){
                user.password = req.body.password;
            }

            // save the user
            user.save(function(err){
                if(err){
                    res.send(err);
                }

                // return a message
                res.json({ message: 'User updated!'});
            });
        });
    })

    // delete the user with this id
    // (accessed at DELETE http://localhost:8080/api/users/:user_id)
    .delete(function(req, res){
        User.remove({
            _id: req.params.user_id
        }, function(err, user){
            if(err) {
                return res.send(err);
            }
            res.json({ message: 'Successfully delete'});
        });
    });


// api endpoint to get user information
apiRouter.get('/me', function(req, res){
    res.send(req.decoded);
});
// REGISTER OUR ROUTES -------------------
// all of our routes will be prefixed with /api
app.use('/api', apiRouter);

// START THE SERVER
// =======================================
app.listen(port);
console.log('Magic happens on port ' + port);