'use strict'
let express = require('express');
let router = express.Router();
let _ = require('lodash')
let request = require('request')
/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Ignite AI'});
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
                console.log(event)
                if(event.message) {
                    receivedMessage(event)
                } else if(event.postback) {
                    receivedPostback(event);
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
                sendGenericMessage(senderID, messageText);
                break;
            default:
                sendTextMessage(senderID, messageText);
                break;
        }
        
    }
    
}
function sendGenericMessage(recipientId, messageText) {
    let messageData = {
        recipient: {
            id: recipientId,
        },
        message: {
            attachment: {
                type: 'template',
                payload: {
                    template_type: 'generic',
                    elements: [{
                        title: 'rift',
                        subtitle: 'Next-generation marketing AI',
                        item_url: process.env.IGNITEAI_URI,
                        image_url: process.env.IGNITEAI_URI + '/images/ss.png',
                        buttons: [{
                            type: 'web_url',
                            url: process.env.IGNITEAI_URI,
                            title: 'Open web url'
                        }, {
                            type: 'postback',
                            title: 'Call Postback',
                            payload: 'Payload for first bubble'
                        }]
                    }, {
                        title: "touch",
                        subtitle: "Your Hands, Now in Ignite AI",
                        item_url: process.env.IGNITEAI_URI + '/ignite',
                        image_url: process.env.IGNITEAI_URI + '/images/ss.png',
                        buttons: [{
                            type: "web_url",
                            item_url: process.env.IGNITEAI_URI + '/ignite',
                            title: "Open Web URL"
                        }, {
                            type: "postback",
                            title: "Call Postback",
                            payload: "Payload for second bubble",
                        }]
                    }]

                }
            }
        }
    };
    /*let messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: [{
                        title: "rift",
                        subtitle: "Next-generation virtual reality",
                        item_url: "https://www.oculus.com/en-us/rift/",
                        image_url: "http://messengerdemo.parseapp.com/img/rift.png",
                        buttons: [{
                            type: "web_url",
                            url: "https://www.oculus.com/en-us/rift/",
                            title: "Open Web URL"
                        }, {
                            type: "postback",
                            title: "Call Postback",
                            payload: "Payload for first bubble",
                        }],
                    }, {
                        title: "touch",
                        subtitle: "Your Hands, Now in VR",
                        item_url: "https://www.oculus.com/en-us/touch/",
                        image_url: "http://messengerdemo.parseapp.com/img/touch.png",
                        buttons: [{
                            type: "web_url",
                            url: "https://www.oculus.com/en-us/touch/",
                            title: "Open Web URL"
                        }, {
                            type: "postback",
                            title: "Call Postback",
                            payload: "Payload for second bubble",
                        }]
                    }]
                }
            }
        }
    };*/
    
    callSendAPI(messageData);
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

function receivedPostback(event) {
    let senderID = event.sender.id;
    let recipientID = event.recipient.id;
    let timeOfPostback = event.timestamp;
    let payload = event.postback.payload;
    console.log("Received postback for user %d and page %d with payload '%s' " + "at %d", senderID, recipientID, payload, timeOfPostback);
    sendTextMessage(senderID, "Postback celled");
}

module.exports = router;
