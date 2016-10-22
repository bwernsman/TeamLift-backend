'use strict';

var firebase = require("firebase");

var url = require( "url" );
var queryString = require( "querystring" );
var express = require('express');
var bodyParser = require('body-parser');

var app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

console.log("test2");

firebase.initializeApp({
  serviceAccount: "serviceAccountCredentials.json",
  databaseURL: "https://teamliftapp-dc901.firebaseio.com/"
});

var db = firebase.database();
var ref = db.ref("/users");
var gyms = db.ref("/gyms");

updateUser();

saveData(111);


app.get('/', function (req, res) {
  res.status(200).send('Everything is running!');
});

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

app.post("/swipe", function(request, response){
  var myId = request.body.myId;
  var otherId = request.body.otherId;
  if(myId == null || otherId == null)
    return response.send({"status": "invalid id(s)"});
  else
    swipe_user(myId, otherId);
  return response.send({"status":"200"});
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
  /*
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
  */
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

function updateUser(){
  ref.on("child_changed", function(snapshot) {
      var changedPost = snapshot.val();
      console.log("A new user was created");
      console.log(snapshot.key + "The updated post title is " + changedPost.text);
  });
}

// Start the server
var server = app.listen(process.env.PORT || '8080', function () {
  console.log('App listening on 127.0.0.1:%s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});


function swipe_user(myId, otherId){
  // console.log(gyms.child.name);
  console.log("wtf is this ");
  try{
  gyms.child("Users").once("value", function(snapshot) {
      console.log(snap.val);
  }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
  });
  }
  catch(err){
    console.log(err);
  } 

  //ref compare if user with myid has same gym as user with otherid
  //if not, return bad
  //else compare if otherId has swiped on myId. ONLY if YES and the above do we return 'match'
  return 0;
}
/*
swipe on another user
1) if other user has swipped
2) if other user belongs to the same gym


*/




