const ScheduledStep = require('../models/ScheduledStep');
const ProactiveRoadmap = require('../models/ProactiveRoadmap');
const Unit = require('../models/Unit');
const moment = require('moment');
const momentTimeZone = require('moment-timezone');
const { default: axios } = require('axios');

require('dotenv').config();

const runScheduledSteps = async () => {


    const runTime = momentTimeZone().tz('America/Denver').hour();
    const env = process.env.DB_ENV;
    let companyId = 0;

    const stepToRun = await ScheduledStep.query().
        where('scheduled_at', '<', moment().endOf('day').toISOString()).
        where('completed', 0).first();


    if (!stepToRun) {


        console.log('No Steps Scheduled To Run Today');

        return;
    }


    if (env == 'PROD') {

        const unitId = stepToRun.unit_id;

        const foundUnit = await Unit.query().where('id', unitId).first();
        companyId = foundUnit.company_id;
        if (companyId != 447) {

            console.log('Testing in prod. Only with a company_id of 447');
            return;

        }
    }

    if ((runTime < 11 && env == 'PROD' && companyId != 447) || runTime < 8) {

        console.log('Steps only run after 13:00 in Prod or 10:001 in Dev')
        return;
    }








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
        const communicationType = foundStep.communication;

        let baseUrl = 'https://tc-communication-service-1.onrender.com/private';
        let urls = [];

        if (communicationType.includes('Call')) {
            console.log('Sending Communication via Call');
            urls.push(`${baseUrl}/calls/sendCommunicationCall`);
        }
        if (communicationType.includes('Letter')) {
            console.log('Sending Communication via Letter');
            urls.push(`${baseUrl}/letters/sendCommunicationLetter`);
        }
        if (communicationType === 'Email') {
            console.log('Sending Communication via Email');
            urls.push(`${baseUrl}/emails/sendCommunicationEmail`);
        }
        if (communicationType === 'SMS') {
            console.log('Sending Communication via SMS');
            urls.push(`${baseUrl}/sms/sendCommunicationSMS`);
        }

        // Process URLs one-by-one with a small delay
        for (const url of urls) {
            console.log(`Sending request to: ${url}`);
            try {
                await axios.post(url, {
                    unitId: unitId,
                    proactiveId: proactiveId
                }, {
                    headers: {
                        'x-api-key': process.env.COMMUNICATION_API_KEY
                    }
                });

                await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay
            } catch (error) {
                console.log('Error Sending Communication:', JSON.stringify({ url: url }));
                return false; // Stop on first failure
            }
        }

        return true;

    } catch (error) {
        console.log(error);
        return false;
    }
};








module.exports = { runScheduledSteps };