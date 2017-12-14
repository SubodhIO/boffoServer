var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var request = require("request");
var CircularJSON = require("circular-json");
var Client = require("node-rest-client").Client;
var client = new Client();
var http = require("http");
http.post = require("http-post");

// set content-type header and data as json in args parameter
var args = {
  data: { username: "admin", password: "c2vc1970aeS" },
  headers: { "Content-Type": "application/json" }
};

var app = express();
var sessionId = -99;

const PORT = process.env.PORT || 5000;
const SERVER_URL = "https://komori.cloudio.io/api";

const vapidKeys = {
  publicKey:
    "BImq0Bc-KX_BFwduRt3krYoqzpBoq0gQQj-p8NE0nY4WP3UAXY1FjWmzd3JbT6ZhxE5WAaAIqIfhO9aqAnmCWzk",
  privateKey: "gyQGNhCmXoxBaN7lF1rsJ6sLqSXZ08bR3YBsDlpfiTU"
};

const webpush = require("web-push");

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

webpush.setVapidDetails(
  "mailto:subodhkumarjc@gmail.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

var validateSession = function() {};

var insertDS = function(dsName, insData) {
  return new Promise(function(resolve, reject) {
    console.log("### INSERT DS | " + dsName + " | Session Id | " + sessionId);
    if (sessionId !== -99) {
      var payload = {
        sessionId: sessionId,
        userName: "TestUser",
        userEmailId: "testUser@cloudio.io",
        createdBy: 0,
        creationDate: new Date(),
        lastUpdatedBy: 0,
        lastUpdateDate: new Date()
      };

      var query_args = {
        data: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        dataType: "json"
      };

      // URL: http://om.cloudio.io:9180/api/BFOUsers/insert
      client.post(SERVER_URL + "/" + dsName + "/insert", query_args, function(
        data,
        response
      ) {
        if (response._error === "Y") {
          console.log(response.errorMessage);
          reject("Error" + response.errorMessage);
        } else {
          console.log("INSERT DS | RESULT | " + CircularJSON.stringify(data));
          resolve(CircularJSON.stringify(data));
        }
      });
    } else {
      getSessionId().then(
        function(response) {
          resolve(insertDS(dsName, insData));
        },
        function(err) {
          reject(err);
        }
      );
    }
  });
};

var queryDS = function(dsName) {
  return new Promise(function(resolve, reject) {
    console.log("Session Id | " + sessionId);
    if (sessionId !== -99) {
      // PREPARE PAYLOAD
      var payload = {
        sessionId: sessionId,
        offset: 0,
        limit: 200,
        params: { executeCountSql: "N" },
        data: {}
      };

      // PREPARE ARGS FOR POST CALL
      var query_args = {
        data: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        dataType: "json"
      };

      //POST CALL
      console.log("SERVER | " + SERVER_URL + "/" + dsName);
      console.log("ARGS | " + JSON.stringify(query_args));
      client.post(SERVER_URL + "/" + dsName, query_args, function(
        data,
        response
      ) {
        if (response._error === "Y") {
          console.log(response.errorMessage);
          reject("Error" + response.errorMessage);
        } else {
          console.log("QUERY DS | RESULT | " + CircularJSON.stringify(data));
          resolve((data));
        }
      });
    } else {
      getSessionId().then(
        function(response) {
          console.log("QUERY DS | LOGIN SUCCESS | " + response);
          resolve(queryDS(dsName));
        },
        function(error) {
          console.log("QUERY DS | ERROR");
          reject("Error");
        }
      );
    }
  });
};

var getSessionId = function() {
  return new Promise(function(resolve, reject) {
    if (sessionId !== -99) {
      return sessionId;
      resolve(sessionId);
    } else {
      /******/
      console.log("***LOGIN REQUEST");

      client.post(
        SERVER_URL + "/signin",
        args,
        function(data, response) {
          // parsed response body as js object
          sessionId = data.sessionId;
          console.log(data.sessionId);
          resolve(sessionId);
          // raw response
          // console.log(response.data);
        },
        function(err) {
          reject("Error");
        }
      );
      console.log("#here");
      /******/
    }
  });
};

const triggerPushMsg = function(subscription, dataToSend) {
  /* List all the subscriptions | Begin */

  var PromiseArr = [];

  queryDS("BFOSubscriptions").then(
    function(response) {
      console.log("*** List of Subscriptions *** ");
      console.log(JSON.stringify(response.data));

      //var dataToSend = "Test Notification From Boffo";
      var subscriptionObj = {};

      response.data.forEach( function(row) {
        console.log('#### Subscription | '+JSON.stringify(row));
        subscriptionObj = row.data;
        PromiseArr.push(
          webpush.sendNotification(JSON.parse(subscriptionObj), dataToSend).catch(err => {
            if (err.statusCode === 410) {
              //return deleteSubscriptionFromDatabase(subscription._id);
              console.log("Subscription is error");
            } else {
              console.log("Subscription is no longer valid: ", err);
            }
          })
        );
      });

      /* List all the subscriptions | End */
      // var subscription = {
      //   endpoint:
      //     "https://fcm.googleapis.com/fcm/send/erPEXkF7iYE:APA91bFbVhKIVnJEGS325U6QArxvmqan0Q23CoN69rhUMBGlV-l_wxbXL482w_ME3Zlkk-rZHCPzkIhacl6N7Fi8P--kl5hihva9kOMlld9q2m1evBGPJyD7EybTLp0NEDv1D2Y4u5iM",
      //   expirationTime: null,
      //   keys: {
      //     p256dh:
      //       "BNihEYwmRKYgSILUjic2m2HHD5b3CG_Mugo81FcDl4r5oZpAgTj7aqPfoiL9IGZJf2EkQT3qKKjlp50gScDKAXw=",
      //     auth: "CnsIiHeZu3WsWZfY7bII8w=="
      //   }
      // };

      Promise.all(PromiseArr).then(
        function(response) {
          resolve("true");
        },
        function(err) {
          reject("false");
        }
      );
    },
    function(err) {
      reject("Error");
    }
  );
};

/*


Public Key:
BImq0Bc-KX_BFwduRt3krYoqzpBoq0gQQj-p8NE0nY4WP3UAXY1FjWmzd3JbT6ZhxE5WAaAIqIfhO9aqAnmCWzk

Private Key:
gyQGNhCmXoxBaN7lF1rsJ6sLqSXZ08bR3YBsDlpfiTU

*/

/*

{"endpoint":"https://fcm.googleapis.com/fcm/send/f_dTPfssNUs:APA91bE_uZjEE2LEmc4aJwiRKDoAELASM_p8F7gY_Q90zb5KOBJ36fbVE-6lH9Y8k2xWJ-hp9pmKN5ozjvdThRjI1q30q2_b0p9w2oQcAAkeE4aWRUCI3e-h8MV4o8DznkAdYKblyaWy","expirationTime":null,"keys":{"p256dh":"BDatuUspCGeRp0jOLHuiMGTRZjcFkmuHwl7aHwJxgjN8N--p8xvdRInI9LmA5M3spIiwoW0ujy-teVeG-fwvJFw=","auth":"I6fsS8IdW50rybQ4tRdHyw=="}}

*/

app.use(express.static(path.join(__dirname, "public")));

var server = app.listen(PORT, function() {
  console.log("Boffo server started @" + PORT);
});

var host = server.address().address;
var port = server.address().port;



/********* API CALLS *********/
app.get("/", function(req, res) {
  res.redirect("pages/index.html");
});
app.get("/.well-known/acme-challenge/6DeU-NImvrP3PXmRsMbzWhjxOrQSMNjHF5vGAFIxd8M",function(req,res){
  res.redirect("/pages/file");
});

app.get("/testcertificate",function(req,res){
  res.redirect("/pages/file");
});
app.get("/api/login", function(req, res) {
  console.log("*** SERVER LOG | LOGIN **** ");
  getSessionId().then(function(response) {
    res.send({"message":"API *** LOGIN PROMISE RETURNED | " + response});
  });
});

app.get("/api/load", function(req, res) {
  console.log("*** LOAD LOG | START **** ");
  queryDS("BFOUsers").then(
    function(response) {
      res.send({"message":"LOAD *** LOAD PROMISE RETURNED | " + response});
    },
    function(err) {
      res.send({"message":"LOAD *** LOAD PROMISE ERROR | " + err});
    }
  );
});


app.get("/api/insert", function(req, res) {
  console.log("*** INSERT LOG | START **** ");
  insertDS("BFOUsers").then(
    function(response) {
      res.send({"message":"INSERT *** INSERT PROMISE RETURNED | " + response});
    },
    function(err) {
      res.send({"message":"INSERT *** INSERT PROMISE ERROR | " + err});
    }
  );
});

app.get("/api", function(req, res) {
  res.send("API");
});

app.get("/api/add-subscription", function(req, res) {
  res.send({"message":"will send the Notifications"});
  console.log("*** SERVER LOG | ADD USER **** ");

  var userId = req.body.userId;
  var subscription = req.body.subscription;

  console.log("***" + userId + "/***" + subscription);
});

app.get("/api/notification/test", function(req, res) {
  console.log("*** SERVER LOG | SEND **** " + req);
  triggerPushMsg("", "Test Notification");
  res.send({"message":"Success"});
});

app.get("/api/notification/new-event",function(req,res){
  console.log("*** SERVER LOG | SEND **** " + req);
  triggerPushMsg("", "New Event Created");
  res.send({"message":"Success"});
});

app.get("/api/notification/new-poll",function(req,res){
  console.log("*** SERVER LOG | SEND **** " + req);
  triggerPushMsg("", "New Poll Created");
  res.send({"message":"Success"});
});

app.get("/api/notification/new-query",function(req,res){
  console.log("*** SERVER LOG | SEND **** " + req);
  triggerPushMsg("", "New Query Posted");
  res.send({"message":"Success"});
});

app.get("/api/notification/new-proposal",function(req,res){
  console.log("*** SERVER LOG | SEND **** " + req);
  triggerPushMsg("", "New Proposal added");
  res.send({"message":"Success"});
});

app.get("/api/testpost",function(req,res){
  console.log('**** '+JSON.stringify(server.address()));
  res.send({"message":""+JSON.stringify(server.address())});
});


/********* API CALLS *********/