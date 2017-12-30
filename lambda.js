'use strict';

/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills Kit.
 * The Intent Schema, Custom Slots, and Sample Utterances for this skill, as well as
 * testing instructions are located at http://amzn.to/1LzFrj6
 *
 * For additional samples, visit the Alexa Skills Kit Getting Started guide at
 * http://amzn.to/1LGWsLG
 */

// -------------------------------- Constants ------------------------------------
const BANDCOLORS = [
                    "black",
                    "brown",
                    "red",
                    "orange",
                    "yellow",
                    "green",
                    "blue",
                    "purple",
                    "grey",
                    "white"
                    ];

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `CircuitBuddy - ${title}`,
            content: `${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome';
    const speechOutput = 'Welcome to Circuit Buddy. ' +
        'You can ask me questions about circuits, such as resistor values!';
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'You can ask me questions about circuits, such as resistor values!' +
                            'Try saying, I need a 300 ohm resistor.';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'Thanks for using Circuit Buddy!';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

/**
 * Responds to user requests for a color code computation
 */
function getResistorColors(intent, session, callback){
    const cardTitle = intent.name;
    const resistanceSlot = intent.slots.resistance;
    let shouldEndSession = false;
    let speechOutput = '';
    let repromptText = '';

    if(resistanceSlot)
    {
        const resistance = resistanceSlot.value;
        if(resistance)
        {
            speechOutput = computeColorResponse(resistance);
        }
        else
        {
            speechOutput = "Please specify a resistance when you run that command!";
            repromptText = "Please try again and specify your resistance!";
        }
        //shouldEndSession = true;
    }
    else
    {
        speechOutput = "I'm not sure what that resistance value is. Please try again.";
        repromptText = "I'm not sure what that resistance value is. You can ask me to " +
            "get a resistor color code by saying, what resistor has a value of three ohms";
    }

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function getResistorValue(intent, session, callback){
    callback({}, buildSpeechletResponse(intent.name, "This is not supported yet. Try a different command.", "", false));
}

/**
 * Computes a color code from a resistance and gives a speech response
 */
function computeColorResponse(resistance)
{
    var digits = [],
    exact = true,
    sNumber = resistance.toString();
    for (var i = 0, len = sNumber.length; i < len; i += 1) {
        digits.push(+sNumber.charAt(i));
        if(i > 1 && digits[i] != 0)
            exact = false;
    }

    if(digits.length == 1)
    {
        var color1 = BANDCOLORS[0];
        var color2 = BANDCOLORS[digits[0]];
        var color3 = BANDCOLORS[0];
    }else{
        var color1 = BANDCOLORS[digits[0]];
        var color2 = BANDCOLORS[digits[1]];
        var color3 = BANDCOLORS[digits.length - 2];
    }

    if(exact)
    {
        return "The code for a resistor of value " + resistance + " ohms is " +
                color1 + " " + color2 + " " + color3 + ".";
    }
    else
    {
        return "The closest code for a 3-band resistor of value " + resistance + " ohms is " +
                color1 + " " + color2 + " " + color3 + ".";
    }
}


// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'GetResistorColors') {
        getResistorColors(intent, session, callback);
    } else if (intentName === 'GetResistorValue') {
        getResistorValue(intent, session, callback);
    } else if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else {
        throw new Error('Invalid intent');
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== 'amzn1.echo-sdk-ams.app.[unique-value-here]') {
             callback('Invalid Application ID');
        }
        */

        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};
