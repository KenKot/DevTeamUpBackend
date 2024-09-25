const express = require("express");
const userRouter = express.Router();

const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

const USER_SAFE_DATA = [
  "firstName",
  "lastName",
  "age",
  "gender",
  "photoUrl",
  "about",
  "skills",
];

userRouter.get("/user/feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit >= 50 ? 50 : limit;

    const skip = (page - 1) * limit;

    //people I DON'T want in feed:
    // user's own card, connections, ignored, already sent connectionRequest
    const connectionRequests = await ConnectionRequest.find({
      $or: [
        {
          toUserId: loggedInUser,
        },
        {
          fromUserId: loggedInUser,
        },
      ],
    }).select("toUserId fromUserId");

    const usersToHide = new Set();

    connectionRequests.forEach((item) => {
      usersToHide.add(item.fromUserId.toString());
      usersToHide.add(item.toUserId.toString());
    });

    const users = await User.find({
      $and: [
        { _id: { $nin: Array.from(usersToHide) } },
        { _id: { $ne: loggedInUser._id } },
      ],
    })
      .select(USER_SAFE_DATA)
      .skip(skip)
      .limit(limit);

    console.log(usersToHide);

    res.json({ message: "Data sent succesfully", data: users });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

userRouter.get("/user/requests/receieved", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested",
    }).populate("fromUserId", USER_SAFE_DATA);

    res.json({ message: "Data sent succesfully", data: connectionRequests });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// get all pending connection requests
userRouter.get("/user/requests/accepted", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      $or: [{ toUserId: loggedInUser._id }, { fromUserId: loggedInUser._id }],

      status: "accepted",
    })
      .populate("fromUserId", USER_SAFE_DATA)
      .populate("toUserId", USER_SAFE_DATA);

    const filteredData = connectionRequests.map((item) => {
      if (item.fromUserId._id.toString() === loggedInUser._id.toString()) {
        return item.toUserId;
      } else {
        return item.fromUserId;
      }
    });

    res.json({ message: "Data sent succesfully", data: filteredData });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

module.exports = userRouter;
