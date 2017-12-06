var express=require('express');
var path = require('path');

var app = express();

const PORT = process.env.PORT || 5000;

const vapidKeys = {
  publicKey:'BImq0Bc-KX_BFwduRt3krYoqzpBoq0gQQj-p8NE0nY4WP3UAXY1FjWmzd3JbT6ZhxE5WAaAIqIfhO9aqAnmCWzk',
  privateKey:'gyQGNhCmXoxBaN7lF1rsJ6sLqSXZ08bR3YBsDlpfiTU'
};

const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:subodhkumarjc@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);


const triggerPushMsg = function(subscription, dataToSend) {

  var subscription = {"endpoint":"https://fcm.googleapis.com/fcm/send/f_dTPfssNUs:APA91bE_uZjEE2LEmc4aJwiRKDoAELASM_p8F7gY_Q90zb5KOBJ36fbVE-6lH9Y8k2xWJ-hp9pmKN5ozjvdThRjI1q30q2_b0p9w2oQcAAkeE4aWRUCI3e-h8MV4o8DznkAdYKblyaWy","expirationTime":null,"keys":{"p256dh":"BDatuUspCGeRp0jOLHuiMGTRZjcFkmuHwl7aHwJxgjN8N--p8xvdRInI9LmA5M3spIiwoW0ujy-teVeG-fwvJFw=","auth":"I6fsS8IdW50rybQ4tRdHyw=="}};
  var dataToSend = 'Test Data From My Server';

  return webpush.sendNotification(subscription, dataToSend)
  .catch((err) => {
    if (err.statusCode === 410) {
      //return deleteSubscriptionFromDatabase(subscription._id);
      console.log('Subscription is error');
    } else {
      console.log('Subscription is no longer valid: ', err);
    }
  });
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

app.use(express.static(path.join(__dirname,'public')));

app.listen(PORT,function(){
    console.log('Boffo server started @'+PORT);
});

app.get('/',function(req,res){
    res.redirect('pages/index.html');
});

app.get('/addUser',function(req,res){
  res.send('will send the Notifications');
  console.log('*** SERVER LOG | ADD USER **** '+ JSON.stringify(req));
});

app.get('/send',function(req,res){
  console.log('*** SERVER LOG | SEND **** '+ req);
  triggerPushMsg('','');
  res.send('Success');
});


