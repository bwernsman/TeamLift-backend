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
  authToken(request.body.idToken, function (status, user, uid) {
    if(status == 2){
      return response.send({"error": "Invalid token"});
    }
    else{
      if(request.body.gym == user["card_info"]["gym"]){
        return response.send({"error": "Gym Already Set"});
      }
      else{
        removeGym(user, function (status) {
        if(status == 2){
          return response.send({"error": "Remove failed"});
        }
        else{
          setGym(request.body.gym, uid, function (status, newGymUserID) {
            if(status == 2){
              return response.send({"error": "Set Gym failed"});
            }
            else{
              updateGymUser(uid, request.body.gym, newGymUserID, function (status){
                if(status == 2){
                  return response.send({"error": "Update Gym failed"});
                }
                else{
                  return response.send({"status": "1","message":"Gym Updated"});
                }
              });
            }
          });  
        }
        });
      }
    }
  });  
});

app.post("/getUsers", function(request, response) {
  if(request.body.idToken == null){
    return response.send({"error": "Missing token"});
  }
  authToken(request.body.idToken, function (status, user, uid) {
    if(status == 2){
      return response.send({"error": "Invalid token"});
    }
    else{
      if(user["potential_matches"]){
        var pUsers = [];
        for(var item in user["potential_matches"]){
          pUsers.push(user["potential_matches"][item]["userID"]);
        }
        return response.send({"status": "1","users":pUsers});
      }
      else{
        var gymUsers = [];
        var connectedUsers = [];
        gyms.child(user["card_info"]["gym"]).child("users").once("value", function(snapshot) {
          for(var item in snapshot.val()){
            console.log(snapshot.val()[item]["uid"]);
            if(snapshot.val()[item]["uid"] != uid){
              gymUsers.push(snapshot.val()[item]["uid"]);
            }
            
          }

          users.child(uid).child("connected_users").once("value", function(snapshot) {
            for(var item in snapshot.val()){
              console.log(snapshot.val()[item]["userID"]);
              connectedUsers.push(snapshot.val()[item]["userID"]);
            }

            var newArray = [];

            for (var i = 0; i < gymUsers.length; i++){
              if(connectedUsers.indexOf(gymUsers[i]) == - 1 ){
                newArray.push(gymUsers[i]);
              }
            }

            if(newArray.length == 0){
              response.send({"Status": "No new matches"});
            }
            else{
              for(var i = 0; i < newArray.length; i++){
                console.log(newArray[i]);
                var userID = newArray[i];
                users.child(uid).child("potential_matches").push({userID},function(error) {
                  if(error){
                    response.send({"error": "error connecting"});
                  }
                });
                users.child(uid).child("connected_users").push({userID},function(error) {
                  if(error){
                    response.send({"error": "error connecting"});
                  }
                });
              }
              return response.send({"status": "1","users":newArray});
            }
          }, function (errorObject) {
            return response.send({"error": "error connecting"});
          });
        }, function (errorObject) {
          return response.send({"error": "error connecting"});
        }); 
      }
    }
  });
});

//Swipe user
//Input
//-idToken, userID, swipe (yes or no)
app.post("/swipe", function(request, response) {
  if(request.body.idToken == null){
    return response.send({"error": "Missing token"});
  }
  else if(request.body.userID == null){
    return response.send({"error": "Missing userID"});
  }
  else if(request.body.swipe == null){
    return response.send({"error": "Missing swipe"});
  }
  else if(request.body.swipe != "yes" && request.body.swipe != "no"){
    return response.send({"error": "Invalid Swipe"});
  }
  authToken(request.body.idToken, function (status, user, uid) {
    var found = false;
    for(var item in user["potential_matches"]){
      console.log(user["potential_matches"][item]["userID"]);
      if(user["potential_matches"][item]["userID"] == request.body.userID){
        found = true
        console.log("Found");
        console.log(item);
        users.child(uid).child("potential_matches").child(item).remove(function(error){
          if(error){
            return response.send({"error": "Error removing"});
          }
          else{
            if(request.body.swipe == "no"){
              return response.send({"status": 1,"message":"swipe is a no"});
            }
            else{
              var swipeUser = request.body.userID;
              users.child(uid).child("liked_users").push({swipeUser}, function(error){
                if(error){
                  return response.send({"error": "Error updating likes"});
                }

                //Check if they liked me
                var matchFound = false;
                console.log("See if they like us");
                
                for(var item in user["liked_me"]){
                  console.log(user["liked_me"][item]["uid"]);
                  console.log(request.body.userID);
                  if(user["liked_me"][item]["uid"] == request.body.userID){
                    matchFound = true;
                    //it's a match
                    users.child(uid).child("matches").push({"uid":swipeUser}, function(error){
                      if(error){
                        return response.send({"error": "Error updating likes"});
                      }
                      users.child(swipeUser).child("matches").push({"uid":uid}, function(error){
                        if(error){
                          return response.send({"error": "Error updating likes"});
                        }
                        //Check if they are a match
                        return response.send({"status": 1,"message":"swipe is a yes add added to matches"});
                      });
                    });
                  }
                }

                if(!matchFound){
                  users.child(swipeUser).child("others_liked").push({uid}, function(error){
                    if(error){
                      return response.send({"error": "Error updating likes"});
                    }
                    //Check if they are a match
                    return response.send({"status": 1,"message":"swipe is a yes, added to other user likes"});
                  });
                }
              });
            }
          }
        });
      }
    }
    if(!found){
      return response.send({"error": "User not found"});
    }
  })
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
        if(error){
          return callback(2,"Failed");
        }
        return callback(1, newGymUserID);
  });
}

//Delete Old Gym
function removeGym(user, callback){
  if(!user["card_info"]["gym"] && !user["card_info"]["gymUserID"]){
    return callback("3");
  }
  else{
    gyms.child(user["card_info"]["gym"]).child("users").child(user["card_info"]["gymUserID"]).remove(function(error){
      if(error){
        return callback("2");
      }
      return callback("1");
    });
  }
}

//Update user 
function updateGymUser(uid, newGym, newGymUserID, callback){
  users.child(uid).child("card_info").update({"gymUserID":newGymUserID,"gym":newGym}, function(error){
    if(error){
      return callback("2");
    }
    return callback("1");
  });
}

//Get a users account
function getUser(userID, callback) {
  users.child(userID).once("value", function(snapshot) {
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




