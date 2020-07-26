//Import package
var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;
var crypto = require('crypto');
var express = require('express');
var bodyParser = require('body-parser');
const {get, request } = require('http');
const { response } = require('express');
const e = require('express');

//Create function
var getRandomString = function(length) {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

var sha512 = function(password, salt) {
    var hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    var value = hash.digest('hex')
    return {
        salt: salt,
        passwordHash: value
    };
};

function saltHashPassword(userPassword) {
    var salt = getRandomString(16);
    var passwordData = sha512(userPassword, salt);
    return passwordData;
}

function checkHashPassword(userPassword, salt) {
    var passwordData = sha512(userPassword, salt);
    return passwordData
}

//Create Express service
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Create MongoDB Client
var MongoClient = mongodb.MongoClient;

//Connection URL
var url = 'mongodb://localhost:27017' //27017 is defaut code

MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, client) {
    if (err) {
        console.log("Unable to connect to MongoDB server" + err)
    } else {
        //Register
        app.post('/api/users/add', (request, response, next) => {
            var postData = request.body;
            var plaint_password = postData.password;
            var hash_data = saltHashPassword(plaint_password);

            var password = hash_data.passwordHash; //save password hash
            var salt = hash_data.salt; //save saly 
            var name = postData.name;
            var email = postData.email;

            var insertJson = {
                'email': email,
                'password': password,
                'name': name,
                'salt': salt
            };
            var db = client.db('test1');

            //Check email exists
            db.collection('user').find({ 'email': email }).count(function(err, number) {
                if (number != 0) {
                    response.json('Email already exists');
                    console.log('Email already exists')
                } else {
                    //Insert
                    db.collection('user').insertOne(insertJson, function(error, res) {
                        response.json('Add success');
                        console.log('Add success')
                    })
                }
            })

        })

        //Login
        app.post('/api/login', (request, response, next) => {
            var postData = request.body;

            var email = postData.email;
            var userPassword = postData.password;



            var db = client.db('test1');

            //Check email exists
            db.collection('user').find({ 'email': email }).count(function(err, number) {

                if (number == 0) {
                    response.json('Email not exists');
                    console.log('Email not exists')
                } else {
                    db.collection('user').findOne({ 'email': email }, function(err, user) {
                        var salt = user.salt;
                        var hashed_password = checkHashPassword(userPassword, salt).passwordHash; //Hash password with salt
                        var encrytype_password = user.password;
                        if (hashed_password == encrytype_password) {
                            response.json('Login success');
                            console.log('Login success')
                        } else {
                            response.json('Wrong password');
                            console.log('Wrong password')
                        }
                    })
                }
            })

        })


        //Get all user
        app.get('/api/user', (request, response, next) => {
            var db = client.db('test1');
            db.collection('user').find({}).toArray(function(err, user) {
                if (err) {
                    console.log('toang')
                } else {
                    response.json(user);
                }
            })
        })

        //Update user
        app.put('/api/user/update:id', (request, response, next) => {
            var postData = request.body;
            var email = postData.email;
            var db = client.db('test1');
            db.collection('user').findOne({ 'email': email }, function(err, user) {
                if (err) {
                    console.log("toang find user")
                } else {
                    console.log(user)
                    db.collection('user').updateOne(user, function(err, obj) {
                        if (err) {
                            throw err;
                        } else {
                            console.log("Update success");
                        }
                    })
                }
            })

        })

        //Delete user
        app.delete('/api/user/delete:id', (request, response, next) => {
            var postData = request.body;
            var email = postData.email;
            var db = client.db('test1');
            db.collection('user').findOne({ 'email': email }, function(err, user) {
                if (err) {
                    console.log("toang find user")
                } else {
                    console.log(user)
                    db.collection('user').deleteOne(user, function(err, obj) {
                        if (err) {
                            throw err;
                        } else {
                            console.log("Delete success");
                        }
                    })
                }
            })

        })

        //Start server
        app.listen(3000, () => {
            console.log("Connected")
        })
    }
});