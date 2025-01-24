require("dotenv").config();
const connectDB = require("./config/database");

const express = require("express");
require("./config/database");
const app = express();

require("./utils/cronjob");

const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

// MODELS
const User = require("./models/user");

// UTILS

// MIDDLEWARES
const cors = require("cors");
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(cookieParser());

app.use(express.json()); // converts POST request's JSON body to JS object

// ROUTERS
const authRouter = require("./routes/auth");
const requestsRouter = require("./routes/requests");
const profileRouter = require("./routes/profile");
const userRouter = require("./routes/user");

app.use("/", authRouter);
app.use("/", requestsRouter);
app.use("/", profileRouter);
app.use("/", userRouter);

// get user by email
app.get("/user", async (req, res) => {
  const userEmail = req.body.emailId;

  try {
    // const user = await User.findOne({ emailId: userEmail });
    // if (!user) res.status(400).send("User not found");

    const users = await User.find({ emailId: userEmail });
    if (users.length === 0) res.status(400).send("User not found");

    res.send(users);
  } catch (err) {
    res.status(400).send("Something went wrong.");
  }
});

// GET /feed
app.get("/feed", async (req, res) => {
  try {
    const users = await User.find({});
    if (users.length === 0) res.status(400).send("Users not found");

    res.send(users);
  } catch (err) {
    res.status(400).send("Something went wrong.");
  }
});

app.delete("/user", async (req, res) => {
  const userId = req.body.userId;

  try {
    const user = await User.findByIdAndDelete(userId);
    res.send("User deleted succesfully");
  } catch (err) {
    res.status(400).send("something went wrong");
  }
});

app.patch("/user/:userId", async (req, res) => {
  const userId = req.params?.userId;

  try {
    const ALLOWED_UPDATES = ["photoUrl", "about", "gender", "age", "skills"];
    const isUpdatedAllowed = Object.keys(req.body).every((key) =>
      ALLOWED_UPDATES.includes(key)
    );
    if (!isUpdatedAllowed) {
      throw new Error("Update not allowed");
    }

    if (req.body.skills.length > 10) {
      throw new Error("Skills can't be more than 10");
    }

    await User.findByIdAndUpdate(userId, req.body, {
      returnDocument: "after",
      runValidators: true,
    });
    res.send("User updated succesfully");
  } catch (err) {
    res.status(400).send("Update failed: ", err.message);
  }
});

connectDB()
  .then(() => {
    console.log("DB connection successful");
    app.listen(process.env.PORT, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch((err) => {
    console.log("DB not connected");
  });
