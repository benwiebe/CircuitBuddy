'use strict';

// -------------------------------- Constants ------------------------------------
const KEYS = require("./keys.js");
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
const CAPTOL = [
                "0.1 pico farads",
                "0.25 pico farads",
                "0.5 pico farads",
                "one percent",
                "two percent",
                "five percent",
                "ten percent",
                "twenty-five percent",
                "plus eighty percent to minus twenty percent"
               ];
const SIPREFIXCAP = [
                        "pico",
                        "nano",
                        "micro",
                        "milli"
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
            title: `${title}`,
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

//from https://github.com/alexa/alexa-cookbook/blob/master/handling-responses/dialog-directive-delegate/sample-nodejs-plan-my-trip/src/SampleWithoutTheSDK.js
function buildSpeechletResponseWithDirectiveNoIntent() {
    return {
      "outputSpeech" : null,
      "card" : null,
      "directives" : [ {
        "type" : "Dialog.Delegate"
      } ],
      "reprompt" : null,
      "shouldEndSession" : false
    }
  }

//from https://github.com/alexa/alexa-cookbook/blob/master/handling-responses/dialog-directive-delegate/sample-nodejs-plan-my-trip/src/SampleWithoutTheSDK.js
function buildSpeechletResponseDelegate(shouldEndSession) {
      return {
          outputSpeech:null,
          directives: [
                  {
                      "type": "Dialog.Delegate",
                      "updatedIntent": null
                  }
              ],
         reprompt: null,
          shouldEndSession: shouldEndSession
      }
}

// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome to CircuitBuddy';
    const speechOutput = 'Welcome to Circuit Buddy. ' +
        'You can ask me questions about circuits, such as resistor values!';
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'You can ask me questions about circuits, such as resistor values! ' +
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
function getResistorColors(request, session, callback){

    var intent = slotCollector(request, {}, callback);

    let cardTitle = intent.name;
    const resistanceSlot = intent.slots.resistance;
    const prefixSlot = intent.slots.prefix;
    let shouldEndSession = true;
    let speechOutput = '';
    let repromptText = '';

    if(resistanceSlot)
    {
        var resistance = handleNumber(resistanceSlot.value);
        var prefix = 0;
        if(prefixSlot && prefixSlot.value && prefixSlot.resolutions && prefixSlot.resolutions.resolutionsPerAuthority[0].status.code !== "ER_SUCCESS_NO_MATCH")
            prefix = prefixSlot.resolutions.resolutionsPerAuthority[0].values[0].value.id;

        if(resistance && !isNaN(resistance))
        {
            cardTitle = "Resistor: " + resistance;
            if(prefixSlot && prefixSlot.value && prefixSlot.resolutions && prefixSlot.resolutions.resolutionsPerAuthority[0].values[0].value.name)
                cardTitle += prefixSlot.resolutions.resolutionsPerAuthority[0].values[0].value.name +" ";
            cardTitle += "ohms";

            resistance = resistance * Math.pow(10, prefix);
            speechOutput = computeColorResponse(resistance);
        }
        else
        {
            speechOutput = "Sorry, I didn't understand the resistance you're looking for. Please try saying it in a different way.";
            repromptText = "I didn't quite catch the resistance you were looking for. You can try saying, what is the color code " +
                            "for five hundred kilohms.";
            shouldEndSession = false;
        }
    }
    else
    {
        speechOutput = "I'm not sure what that resistance value is. Please try again.";
        repromptText = "I'm not sure what that resistance value is. You can ask me to " +
            "get a resistor color code by saying, what resistor has a value of three ohms";
        shouldEndSession = false;
    }

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function getResistorValue(request, session, callback){

    var intent = slotCollector(request, {}, callback);

    let cardTitle = intent.name;
    let shouldEndSession = true;
    let speechOutput = '';
    let repromptText = '';
    const color1Slot = intent.slots.colorone;
    const color2Slot = intent.slots.colortwo;
    const color3Slot = intent.slots.colorthree;
    const toleranceSlot = intent.slots.tolerance;

    if(color1Slot && color2Slot && color3Slot)
    {
        if(color1Slot.resolutions && color2Slot.resolutions && color3Slot.resolutions && color1Slot.resolutions.resolutionsPerAuthority[0].values && color2Slot.resolutions.resolutionsPerAuthority[0].values && color3Slot.resolutions.resolutionsPerAuthority[0].values)
        {
            const color1 = parseInt(color1Slot.resolutions.resolutionsPerAuthority[0].values[0].value.id);
            const color2 = parseInt(color2Slot.resolutions.resolutionsPerAuthority[0].values[0].value.id);
            const color3 = parseInt(color3Slot.resolutions.resolutionsPerAuthority[0].values[0].value.id);

            var tolerance = null;
            if(toleranceSlot.value)
            {
                tolerance = toleranceSlot.resolutions.resolutionsPerAuthority[0].values[0].value.id;
            }

            if(!isNaN(color1) && !isNaN(color2) && !isNaN(color3))
            {
                const resistance = (color1*10 + color2)*Math.pow(10, color3);
                speechOutput = "That resistor has a value of " + resistance + " ohms";
                if(tolerance)
                {
                    speechOutput += " with a tolerance of " + tolerance + " percent.";
                }
                else
                {
                    speechOutput += ".";
                }
                cardTitle = "Resistor: " + color1Slot.value + " " + color2Slot.value + " " + color3Slot.value;
            }
            else
            {
                speechOutput = "Sorry, something went wrong. Please try asking me again.";
                repromptText = "";
            }
        }
        else
        {
            speechOutput = "Sorry, ";
            if(!color1Slot.resolutions)
                speechOutput += " the color of your first band, " + color1Slot.value;
            else if(!color2Slot.resolutions)
                speechOutput += " the color of your second band, " + color2Slot.value;
            else if(!color3Slot.resolutions)
                speechOutput += " the color of your third band, " + color3Slot.value;

            speechOutput += ", is not valid. Please use simple color names, such as blue or orange."
            repromptText = "To calculate resistance, try saying, what is the resistance of brown black red.";
        }
    }
    else
    {
        speechOutput = "Sorry, to calculate resistance I need to know all three color bands. You can also include a tolerance band.";
        repromptText = "To calculate resistance, try saying, what is the resistance of brown black red.";
        shouldEndSession = false;
    }

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function getCapacitorValue(request, session, callback)
{
    var intent = slotCollector(request, {}, callback);

    let cardTitle = intent.name;
    let shouldEndSession = true;
    let speechOutput = '';
    let repromptText = '';
    const codeSlot = intent.slots.capcode;
    const toleranceSlot = intent.slots.captol;

    if(codeSlot && codeSlot.value)
    {
        const code = codeSlot.value;
        var toleranceId = -1;
        if(toleranceSlot && toleranceSlot.resolutions && toleranceSlot.resolutions.resolutionsPerAuthority[0].status.code !== "ER_SUCCESS_NO_MATCH")
            toleranceId = toleranceSlot.resolutions.resolutionsPerAuthority[0].values[0].value.id;

        const capacitanceResponse = computeCapacitanceResponse(code);
        
        if(capacitanceResponse)
        {
            cardTitle = "Capacitor: " + toleranceSlot.value;
            speechOutput = "That capacitor has a capacitance of " + capacitanceResponse;
            if(toleranceId > -1)
                speechOutput += " with a tolerance of " + CAPTOL[toleranceId];
            speechOutput += ".";
        }
        else
        {
            speechOutput = "There was an error when computing the capacitance value. Please try again!";
            repromptText = "To calculate capacitance, try saying, what is the capacitance of 104 Z.";
            shouldEndSession = false;
        }
    }
    else
    {
        speechOutput = "To calculate capacitance, I need the code on the capacitor. Try saying, what is the capacitance of 104 Z.";
        repromptText = "To calculate capacitance, try saying, what is the capacitance of 104 Z.";
        shouldEndSession = false;
    }

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function getCapacitorCode(request, session, callback)
{
    var intent = slotCollector(request, {}, callback);

    let cardTitle = intent.name;
    let shouldEndSession = true;
    let speechOutput = '';
    let repromptText = '';
    const capacitanceSlot = intent.slots.capacitance;
    const prefixSlot = intent.slots.prefix;

    if(capacitanceSlot)
    {
        var capacitance = handleNumber(capacitanceSlot.value);
        var prefix = 0;
        if(prefixSlot && prefixSlot.value && prefixSlot.resolutions && prefixSlot.resolutions.resolutionsPerAuthority[0].status.code !== "ER_SUCCESS_NO_MATCH")
            prefix = prefixSlot.resolutions.resolutionsPerAuthority[0].values[0].value.id;

        if(capacitance && !isNaN(capacitance))
        {
            const capcode = computeCapCode(capacitance * Math.pow(10, prefix));
            if(capcode)
            {
                speechOutput = "The capacitor code for " + capacitance;

                if(prefixSlot.value && prefix != 0)
                    speechOutput += " " + prefixSlot.value;

                speechOutput += " farads is " + capcode + ".";
                cardTitle = "Capacitor: " + capacitance;
                if(prefixSlot.resolutions)
                    cardTitle += prefixSlot.resolutions.resolutionsPerAuthority[0].values[0].value.name + " ";
                cardTitle += "farads";
            }
            else
            {
                speechOutput = "The capacitance you provided does not have a code associated with it."
            }
        }
        else
        {
            speechOutput = "Sorry, I didn't understand the capacitance you're looking for. Please try saying it in a different way.";
            repromptText = "I didn't quite catch the capacitance you were looking for. You can try saying, what is the capacitor code " +
                            "for ten microfarads.";
            shouldEndSession = false;
        }
    }

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function getParallelResistance(request, session, callback)
{
    var intent = slotCollector(request, {}, callback);

    let cardTitle = intent.name;
    const resoneSlot = intent.slots.resone;
    const preoneSlot = intent.slots.preone;
    const restwoSlot = intent.slots.restwo;
    const pretwoSlot = intent.slots.pretwo;
    let shouldEndSession = true;
    let speechOutput = '';
    let repromptText = '';

    if(resoneSlot && restwoSlot && resoneSlot.value && restwoSlot.value)
    {
        var resone = handleNumber(resoneSlot.value);
        var restwo = handleNumber(restwoSlot.value);
        if(!isNaN(resone) && !isNaN(restwo))
        {
            if(preoneSlot && preoneSlot.value && preoneSlot.resolutions && preoneSlot.resolutions.resolutionsPerAuthority[0].status.code !== "ER_SUCCESS_NO_MATCH")
                resone = resone*Math.pow(10, preoneSlot.resolutions.resolutionsPerAuthority[0].values[0].value.id);
            if(pretwoSlot && pretwoSlot.value && pretwoSlot.resolutions && pretwoSlot.resolutions.resolutionsPerAuthority[0].status.code !== "ER_SUCCESS_NO_MATCH")
                restwo = restwo*Math.pow(10, pretwoSlot.resolutions.resolutionsPerAuthority[0].values[0].value.id);

            var parres = 1/((1/resone) + (1/restwo)); //use reciprocal method
            parres = roundDec(parres, 2);

            cardTitle = "Parallel Resistance: " + resone + "||" + restwo;
            speechOutput = resone + " ohms in parallel with " + restwo + " ohms has an equivalent resistance of " + parres + " ohms.";
        }else{
            speechOutput = "Sorry, I didn't understand one of the resistances you said. Please try again!";
            repromptText = "Try saying, what is the equivalent resistance of five ohms in parallel with ten ohms.";
            shouldEndSession = false;
        }
    }else{
        speechOutput = "To calculate equivalent parallel resistance, please tell me two resistances. Try saying, what is the equivalent resistance of five ohms in parallel with ten ohms.";
        repromptText = "Try saying, what is the equivalent resistance of five ohms in parallel with ten ohms.";
        shouldEndSession = false;
    }

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

// ------------------ Slot Collection Handlers -----------------------
// Handlers based off of https://github.com/alexa/alexa-cookbook/blob/master/handling-responses/dialog-directive-delegate/sample-nodejs-plan-my-trip/src/SampleWithoutTheSDK.js

/**
 * Primary slot collection handler
 */
function slotCollector(request, sessionAttributes, callback){
    if (request.dialogState === "STARTED") {
      var updatedIntent=request.intent;
      //optionally pre-fill slots: update the intent object with slot values for which
      //you have defaults, then return Dialog.Delegate with this updated intent
      // in the updatedIntent property
      callback(sessionAttributes,
          buildSpeechletResponseWithDirectiveNoIntent());
    } else if (request.dialogState !== "COMPLETED") {
      // return a Dialog.Delegate directive with no updatedIntent property.
      callback(sessionAttributes,
          buildSpeechletResponseWithDirectiveNoIntent());
    } else {;
      // Dialog is now complete and all required slots should be filled,
      // so call your normal intent handler.
        return request.intent;
    }
}


// ------------------ Response Helpers -----------------------

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

/**
 * Computes a capacitance from a capacitor code and gives a speech response
 */
function computeCapacitanceResponse(code)
{
    var digits = [],
    sNumber = code.toString();
    for (var i = 0, len = sNumber.length; i < len; i += 1) {
        digits.push(+sNumber.charAt(i));
    }

    var capacitance = -1;
    if(digits.length == 3)
        capacitance = (digits[0]*10 + digits[1]) * Math.pow(10, digits[2]);
    else if(digits.length == 2)
        capacitance = code;

    if(capacitance == -1)
        return null;
    else
    {
        digits = [];
        sNumber = capacitance.toString();
        for (var i = 0, len = sNumber.length; i < len; i += 1) {
            digits.push(+sNumber.charAt(i));
        }

        const si = Math.floor((digits.length-1)/3);
        capacitance = Math.round(capacitance/Math.pow(10, 3*si));
        return capacitance + " " + SIPREFIXCAP[si] + (capacitance == 1 ? " farad" : " farads");
    }
}

function computeCapCode(capacitance)
{
    var digits = [],
    exact = true,
    sNumber = capacitance.toString();

    if(capacitance < 1)
    {

        capacitance = capacitance.toExponential().toString().split("e-");

        const mp = (12-capacitance[1]-1);
        if(mp > 9 || mp < 0)
            return null;

        return parseInt(capacitance[0]*100) + mp;
    }
    else
    {
        return null;
    }
}

// ------------------ Other Helpers -----------------------
function handleNumber(num)
{
    return parseInt(num.toString().replace(",", ""))
}

function roundDec(num, dec)
{
    return Math.round(num*Math.pow(10, dec))/Math.pow(10, dec);
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
        getResistorColors(intentRequest, session, callback);
    } else if (intentName === 'GetResistorValue') {
        getResistorValue(intentRequest, session, callback);
    } else if (intentName === 'GetCapacitorValue') {
        getCapacitorValue(intentRequest, session, callback);
    } else if (intentName === 'GetCapacitorCode') {
        getCapacitorCode(intentRequest, session, callback);
    }else if(intentName === 'GetParallelResistance'){
        getParallelResistance(intentRequest, session, callback);
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
        if (event.session.application.applicationId !== KEYS.appid) {
             callback('Invalid Application ID');
        }

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
