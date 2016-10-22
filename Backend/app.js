'use strict';

var firebase = require("firebase");
var url = require( "url" );
var queryString = require( "querystring" );
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

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
  firebase.auth().verifyIdToken(request.body.idToken).then(function(decodedToken) {
    var uid = decodedToken.sub;
    var userObject = getUser(uid, function(foundUser) {
      var responseCode;
      return response.send({"status": responseCode,"User":foundUser});
      });
    }).catch(function(error) {
      // Handle error
      console.log(error);
      return response.send({"status": "2"});
    });
});


//Add a user to a gym
app.post("/addgym", function(request, response) {
  if(request.body.idToken == null){
    return response.send({"error": "Missing token"});
  }
  else if(request.body.gym == null){
    return response.send({"error": "Missing gym"});
  }
  firebase.auth().verifyIdToken(request.body.idToken).then(function(decodedToken) {
    var uid = decodedToken.sub;
    

    gyms.child(request.body.gym).child("users").once("value", function(snapshot) {
      console.log(snapshot.key);
      
      console.log(snapshot.hasChild("user"));

      for(var item in snapshot.val()){
        if(snapshot.val()[item]["user"] == uid){
          return response.send({"status": "Gym already set"});
        }
        else{
          //Set the gym
        }
      }
      var setGym = gyms.child(request.body.gym).child("users");
      setGym.push({
            "user": uid
          },function(error) {
          if (error) {
            console.log("Data could not be saved." + error);
            return response.send({"status": "failed"});
          } else {
          console.log("Data saved successfully.");
          return response.send({"status": "saved"});
      }
      });

    }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
      return response.send({"status": "error"});
    });
  }).catch(function(error) {
      // Handle error
      console.log(error);
      return response.send({"status": "2"});
  });
});


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




