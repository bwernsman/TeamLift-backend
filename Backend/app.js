'use strict';

//Imports
var firebase = require("firebase");
var url = require("url");
var queryString = require("querystring");
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

//Set app to use JSON and URL Encoding
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Initalize Firebase
firebase.initializeApp({
  serviceAccount: "serviceAccountCredentials.json",
  databaseURL: "https://teamlift-12d20.firebaseio.com/"
});

//Set db ref for Firebase
var db = firebase.database();
var gyms = db.ref("/gyms");
var users = db.ref("/users");

// Start the server
var server = app.listen(process.env.PORT || '8080', function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});

//When the root is called
app.get('/', function (req, res) {
  res.status(200).send('Everything is running!');
});

//Authenticate the user
app.post("/auth", function(request, response) {
   authToken(request.body.idToken, function (status, user, uid) {
       return response.send({"status": status,"User":user});
   })
});

//Add a user to a gym
app.post("/addgym", function(request, response) {
  if(request.body.idToken == null){
    return response.send({"error": "Missing token"});
  }
  else if(request.body.gym == null){
    return response.send({"error": "Missing gym"});
  }
  console.log("bb-bb")
  authToken(request.body.idToken, function (status, user, uid) {
    setGym(request.body.gym, uid, function (newGymUserID) {
      console.log(newGymUserID);
      return response.send({"success": newGymUserID});
    });
  });

    /*
    if(status == 2){
      return response.send({"error": "Invalid token"});
    }
    else{
      if(user["card_info"]["gym"]){
        console.log("Removing");
        var previousGym = user["card_info"]["gym"];
        var previousGymID = user["card_info"]["gym"];
        gyms.child(previousGym).child("users").child(previousGymID).remove(function(error){
          console.log("Removed");
          gyms.off();
        });
      }

      console.log("aaa-aa")
      var setGym = gyms.child(request.body.gym).child("users").push({uid}, function(error){
        console.log("Set gym")
        var newGymUserID = setGym.key;
        setGym.off();
        console.log(newGymUserID);
        var updateUser = users.child(uid).child("card_info").update({"gymUserID":newGymUserID,"gym":"Greg"}, function(error){
          console.log("Made it here");
          users.off();
          return response.send({"Passed": "It worked"});
        });
      });
    }
    */

  
});



//Authenticate token
function authToken(token, callback){
  firebase.auth().verifyIdToken(token).then(function(decodedToken) {
    var uid = decodedToken.sub;
    var userObject = getUser(uid, function(foundUser) {
      return callback(1, foundUser, uid);
      });
    }).catch(function(error) {
      console.log(error);
      return callback(2, "Invalid access token", "Not Found");
    });
}

//Set Gym
function setGym(gym, uid, callback){
  var setGym = gyms.child(gym).child("users").push({uid},function(error) {
        var newGymUserID = setGym.key;
        return callback(newGymUserID);
  });
}

//Get a users account
function getUser(userID, callback) {
  users.child(userID).on("value", function(snapshot) {
    //Stop the listener
    users.off("value");
    return callback(snapshot.val());
  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
    return callback("Error");
  });
}



//--------------------------------------------------------//

/*

//Use this to search through a gym

for(var item in snapshot.val()){
        if(snapshot.val()[item]["user"] == uid){
          console.log("Found User");
          //return response.send({"status": "Gym already set"});
        }
      }
*/


//Check for updates within Gyms
function updateUserGym(){
  gyms.on("value", function(snapshot) {
    console.log("----Entire Snapshot----");
    console.log(snapshot.val());
    console.log("----Just the gym name----");
    console.log(snapshot.val().name);
    //Stop the listener
    //gyms.off("value");
  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  });
}


//Check for updates with user of the gym
function checkUser(){
  gyms.child("Users").on("value", function(snapshot) {
      console.log(snapshot.val());
  }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
  });
  //Stop the listener
  gyms.off("value");
}


/*
app.post("/account", function(req, res) {
  console.log(req.query)
    if(!req.query.username) {
        return res.send({"status": "error", "message": "missing username"});
    } else if(req.query.username != accountMock.username) {
        return res.send({"status": "error", "message": "wrong username"});
    } else {
        return res.send(accountMock);
    }
});

app.post("/login", function(req, res) {
  console.log(req.body)
    if(!req.body.email) {
        return res.send({"status": "error", "message": "missing username"});
    } 
    if(req.body.email == "Ben" && req.body.password == "123"){
      return res.send({"status": "0", "message": "Success","providerStatus": "true"});
    }
});

app.post("/auth", function(request, response) {
      //console.log(request.body);
      //console.log(request.body.idToken);

      if(request.body.idToken == null){
        return response.send({"status": "no token"});
      }

      firebase.auth().verifyIdToken(request.body.idToken).then(function(decodedToken) {
      var uid = decodedToken.sub;
     // ...
     var accountMock = {
          "username": "nraboy",
          "password": "1234",
          "twitter": "@nraboy"
      }

      var responseCode;

      checkUserLogin(uid, function(foundUser) {
      console.log("FOUND USER");
      console.log(foundUser);
      responseCode = foundUser;
    });

     return response.send({"status": responseCode,"value":"blah"});
    }).catch(function(error) {
      // Handle error
        console.log(error);
      return response.send({"status": "2"});
    });
      
      
});


function checkUser(userID){
  return ref.child(userID).on("value", function(snapshot) {
      console.log("made it here");
      if(snapshot.val().nickname == null){
        console.log("value is null");
        return 1;
      }
      else{
        console.log("value is not null");
        return 0;
      }
  }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
  });
  console.log("something went wrong");
  //ref.off("value");
  console.log("Checking user");

  
  console.log("Checking user---");
}

function checkUserLogin(userID, callback) {
  console.log("-----1");
    ref.child(userID).once("value", function(snapshot) {
      console.log("Got access");
        if(snapshot.val().nickname == null){
        console.log("value is null");
        return callback(110);
      }
      else{
        return callback(111);
      }   
      return callback(112);      
    });
}

function saveData(userID){
  var hopperRef = ref.child(userID);
    hopperRef.update({
      "nickname": "AJMALLLLLLLLLL"
  },function(error) {
    if (error) {
    console.log("Data could not be saved." + error);
  } else {
    console.log("Data saved successfully.");
  }
  });
}



  */




