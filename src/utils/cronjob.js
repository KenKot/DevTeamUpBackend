const cron = require("node-cron");
const { subDays, startOfDay, endOfDay } = require("date-fns");
const ConnectionRequest = require("../models/connectionRequest");

const sendEmail = require("./sendEmail");

cron.schedule("57 19 * * *", async () => {
  // send emails to all people who got requests the previous day
  console.log("cron fired");

  try {
    const yesterday = subDays(new Date(), 1);

    const yesterdayStart = startOfDay(yesterday);
    const yesterdayEnd = endOfDay(yesterday);

    const pendingRequests = await ConnectionRequest.find({
      status: "interested",
      createdAt: {
        $gte: yesterdayStart,
        $lt: yesterdayEnd,
      },
    }).populate("fromUserId toUserId");

    console.log("pending requests: ", pendingRequests);

    const listOfEmails = [
      ...new Set(pendingRequests.map((req) => req.toUserId.emailId)),
    ];

    console.log("listOfEmails: ", listOfEmails);
    return;

    for (const email of listOfEmails) {
      //send email
      try {
        const res = await sendEmail.run(
          "New Friend Request pending ",
          "BODY",
          process.env.EMAIL2
          //   emailId
        );
      } catch (error) {
        console.log(error);
      }
    }
  } catch (error) {
    console.log("Error: ", error);
  }
});
