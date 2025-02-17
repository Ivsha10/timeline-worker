const ScheduledStep = require('../models/ScheduledStep');
const ProactiveRoadmap = require('../models/ProactiveRoadmap');
const Unit = require('../models/Unit');
const moment = require('moment');
const momentTimeZone = require('moment-timezone');
const { default: axios } = require('axios');
const TimelineSettings = require('../models/TimelineSettings');

require('dotenv').config();

const runScheduledSteps = async () => {


    const runTime = momentTimeZone().tz('America/Denver').hour();
    const env = process.env.LOCAL;

    if ((runTime < 11 && env == 'PROD') || runTime < 8) {



        console.log('Steps only run after 13:00 in Prod or 10:001 in Dev')
        return;
    }

    const stepToRun = await ScheduledStep.query().
        where('scheduled_at', '<', moment().endOf('day').toISOString()).
        where('completed', 0).first();

    if (!stepToRun) {
        console.log('No Steps To Run Today');
        return;
    }

    const foundUnit = await Unit.query().where('id', stepToRun.unit_id).first();

    if (foundUnit.status == 0) {
        console.log('Unit is Off. Step Rescheduled');
        await ScheduledStep.query().where('id', stepToRun.id).update({
            scheduled_at: moment().add({ days: 1 }).toDate(),
            updated_at: moment().toDate()
        })

        return;
    }






    await ScheduledStep.query().where('id', stepToRun.id).update({ completed: 2 }); // Awaiting Completion



    const sendResult = await sendCommunicationToService(stepToRun.unit_id, stepToRun.proactive_id);


    if (sendResult == true) {
        await ScheduledStep.query().where('id', stepToRun.id).update({ completed: 1 }); // Completed
    } else {
        await ScheduledStep.query().where('id', stepToRun.id).update({
            scheduled_at: moment().add({ days: 1 }).toDate(),
            updated_at: moment().toDate()
        })
    }
}


const sendCommunicationToService = async (unitId, proactiveId) => {


    try {

        const foundStep = await ProactiveRoadmap.query().where('id', proactiveId).first();

        const communicationType = foundStep.communication

        let baseUrl = 'https://tc-communications.onrender.com/private';
        //let baseUrl = 'http://localhost:7500/private';

        let urls = [];

        if (communicationType.includes('Call')) {
            console.log('Sending Communication via Call');

            const url = `${baseUrl}/calls/sendCommunicationCall`;
            urls.push(url);

        }

        if (communicationType.includes('Letter')) {
            console.log('Sending Communication via Letter');

            const url = `${baseUrl}/letters/sendCommunicationLetter`;
            urls.push(url);
        }

        if (communicationType === 'Email') {
            console.log('Sending Communication via Email');

            const url = `${baseUrl}/emails/sendCommunicationEmail`;
            urls.push(url);

        }
        if (communicationType === 'SMS') {
            console.log('Sending Communication via SMS');
            const url = `${baseUrl}/sms/sendCommunicationSMS`;
            urls.push(url);

        }


        const promises = urls.map(async url => {

            console.log(url);
            try {
                const response = await axios.post(url, {
                    unitId: unitId,
                    proactiveId: proactiveId
                }, {
                    headers: {
                        'x-api-key': process.env.COMMUNICATION_API_KEY
                    }
                });

            } catch (error) {


                console.log('Error Sending Communication', JSON.stringify({ url: url }))

            }


        });

        await Promise.all(promises);

        return true;

    } catch (error) {

        console.log(error);
        return false;
    }


}






module.exports = { runScheduledSteps };