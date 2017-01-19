'use strict';

var express = require('express');
var router = express.Router();
var _ = require('lodash');
var request = require('request');
/* GET home page. */
router.get('/', function (req, res, next) {
    console.log(process.env.IGNITEAI_URI);
    res.render('index', { title: 'Ignite AI' });
});

router.get('/webhook', function (req, res) {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
});

router.post('/webhook', function (req, res, next) {

    var data = req.body;

    if (data.object === 'page') {

        data.entry.forEach(function (entry) {

            var pageID = entry.id;
            var timeOfEvent = entry.time;

            entry.messaging.forEach(function (event) {
                console.log(event);
                if (event.message) {
                    receivedMessage(event);
                } else if (event.postback) {
                    receivedPostback(event);
                } else {
                    console.log("Webhook received unkown event: %s", event);
                }
            });
        });
    }

    res.sendStatus(200);
});

function receivedMessage(event) {
    console.log('Message data: %s', event.data);

    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;
    console.log("Received message for user %d and page %d at %d with message:", senderID, recipientID, timeOfMessage);
    console.log(JSON.stringify(message));

    var messageID = message.id;
    var messageText = message.text;
    var messageAttachment = message.attachments;
    if (messageText) {

        switch (messageText) {
            case 'generic':
                sendGenericMessage(senderID, messageText);
                break;
            case 'How are you?':
                sendGenericMessage(senderID, "I am going great and you?");
                break;
            default:
                sendTextMessage(senderID, messageText);
                break;
        }
    }
}
function sendGenericMessage(recipientId, messageText) {

    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: [{
                        title: "Ignite AI",
                        subtitle: "Facebook Marketing A.I. for E-commecre Brands, Made Easy.",
                        // item_url: "https://www.oculus.com/en-us/rift/",
                        // item_url: process.env.IGNITEAI_URI,
                        item_url: 'http://ignite-fb-demo.herokuapp.com/images/ss.png',
                        // image_url: process.env.IGNITEAI_URI + 'images/ss.png',
                        image_url: 'http://ignite-fb-demo.herokuapp.com/images/ss.png',
                        buttons: [{
                            type: "web_url",
                            url: process.env.IGNITEAI_URI,
                            title: "Open Web URL"
                        }, {
                            type: "postback",
                            title: "Call Postback",
                            payload: "Payload for first bubble"
                        }]
                    }, {
                        title: "Ignite AI - Fact of the day",
                        subtitle: "Grass is green!",
                        item_url: process.env.IGNITEAI_URI + '/ignite/',
                        image_url: process.env.IGNITEAI_URI + 'images/ss.png',
                        buttons: [{
                            type: "web_url",
                            url: process.env.IGNITEAI_URI + '/ignite/',
                            title: "Open Web URL"
                        }, {
                            type: "postback",
                            title: "Call Postback",
                            payload: "Payload for second bubble"
                        }]
                    }, {
                        title: "Ignite AI - Joke of the day",
                        subtitle: "some joke",
                        item_url: process.env.IGNITEAI_URI + '/ignite/',
                        image_url: process.env.IGNITEAI_URI + 'images/ss.png',
                        buttons: [{
                            type: "web_url",
                            url: process.env.IGNITEAI_URI + '/ignite/',
                            title: "Open Web URL"
                        }, {
                            type: "postback",
                            title: "Call Postback",
                            payload: "Payload for second bubble"
                        }]
                    }]
                }
            }
        }
    };

    callSendAPI(messageData);
}

function sendTextMessage(recipientID, messageText) {
    var messageData = {
        recipient: {
            id: recipientID
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
        qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: messageData
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;
            console.log("Successfully sent generic message with id %s to recipient %s", messageId, recipientId);
        } else {
            console.error('Unable to send message.');
            console.error(response);
            console.error(error);
        }
    });
}

function receivedPostback(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfPostback = event.timestamp;
    var payload = event.postback.payload;
    console.log("Received postback for user %d and page %d with payload '%s' " + "at %d", senderID, recipientID, payload, timeOfPostback);
    sendTextMessage(senderID, "Postback celled");
}

module.exports = router;
//# sourceMappingURL=index.js.map