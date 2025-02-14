const connectToDB = require("./config/db.Conn");
const { runScheduledSteps } = require("./controllers/scheduleController");

connectToDB();

const mainFunction = async () => {

    await runScheduledSteps();
}

setInterval(mainFunction, 10000)