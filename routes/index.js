let express = require('express');
let router = express.Router();
let _ = require('lodash')
let request = require('request')
/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

router.get('/webhook', function (req, res) {
    if(req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
});

router.post('/webhook', (req, res, next) => {
    
    let data = req.body;
    
    if(data.object === 'page') {
        
        data.entry.forEach((entry) => {
            
            let pageID = entry.id;
            let timeOfEvent = entry.time;
            
            entry.messaging.forEach((event) => {
                
                if(event.message) {
                    receivedMessage(event)
                } else {
                    console.log("Webhook received unkown event: %s", event)
                }
                
            })
            
        });
        
    }
    
    res.sendStatus(200);
    
})

function receivedMessage(event) {
    console.log('Message data: %s', event.data)
    
    let senderID = event.sender.id;
    let recipientID = event.recipient.id;
    let timeOfMessage = event.timestamp;
    let message = event.message;
    console.log("Received message for user %d and page %d at %d with message:", senderID, recipientID, timeOfMessage);
    console.log(JSON.stringify(message));
    
    let messageID = message.id;
    let messageText = message.text;
    let messageAttachment = message.attachments;
    if(messageText) {
        
        switch (messageText) {
            case 'generic':
                sendGenericMessage(senderID);
                break;
            default:
                sendTextMessage(senderID, messageText);
                break;
        }
        
    }
    
}


function sendGenericMessage(senderID) {
    
}

function sendTextMessage(recipientID, messageText) {
    let messageData = {
        recipient: {
            id: recipientID,
        },
        message: {
            text: messageText
        }
    };
    callSendAPI(messageData);
}


function callSendAPI(messageData) {
    
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: messageData
    }, (error, response, body) => {
        if(!error && response.statusCode === 200) {
            let recipientId = body.recipient_id;
            let messageId = body.message_id;
            console.log("Successfully sent generic message with id %s to recipient %s", messageId, recipientId);
            
        } else {
            console.error('Unable to send message.')
            console.error(response);
            console.error(error);
        }
    })
    
}

module.exports = router;
