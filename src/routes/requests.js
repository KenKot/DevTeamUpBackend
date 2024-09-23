const express = require("express");
const requestsRouter = express.Router();

const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

requestsRouter.post(
  "/request/send/:status/:toUserId",
  userAuth,
  async (req, res) => {
    try {
      const fromUserId = req.user._id;
      const toUserId = req.params.toUserId;
      const status = req.params.status;

      const allowedStatus = ["ignored", "interested"];

      // Validate if toUserId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(toUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ message: "Invalid status type" });
      }

      const toUser = await User.findById(toUserId);
      if (!toUser) return res.status(400).json({ message: "User not found" });

      // if there's an existing ConnectionRequest
      const existingConnectionRequest = await ConnectionRequest.findOne({
        $or: [
          {
            fromUserId,
            toUserId,
          },
          {
            fromUserId: toUserId,
            toUserId: fromUserId,
          },
        ],
      });

      if (existingConnectionRequest)
        return res.status(400).json({ message: "Connection already exists" });

      const connectionRequest = new ConnectionRequest({
        fromUserId,
        toUserId,
        status,
      });

      const data = await connectionRequest.save();

      res.json({
        message: `${req.user.firstName} is ${status} in ${toUser.firstName}`,
        data,
      });
    } catch (err) {
      res.status(400).send("ERROR " + err.message);
    }
  }
);

module.exports = requestsRouter;
