require("dotenv").config();
const connectDB = require("./config/database");

const express = require("express");
require("./config/database");
const app = express();

const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { userAuth } = require("./middlewares/auth");

// MODELS
const User = require("./models/user");

// UTILS
const { validateSignUpData } = require("./utils/validation");

// MIDDLEWARES
app.use(cookieParser());

app.use(express.json()); // converts POST request's JSON body to JS object

app.post("/signup", async (req, res) => {
  try {
    // Validation of Data
    validateSignUpData(req);

    const { firstName, lastName, emailId, password } = req.body;

    // Encrypt Password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create new instance of the User model
    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
    });

    await user.save();
    res.send("user added");
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    const user = await User.findOne({ emailId: emailId });
    if (!user) throw new Error("Invalid creds");

    const isPasswordValid = await user.validatePassword(password);

    if (isPasswordValid) {
      // create JWT
      // const token = await jwt.sign({ _id: user._id }, "TEMPSECRETKEY", {
      //   expiresIn: "1d",
      // });

      const token = await user.getJWT();

      // add token to cookie, send it and the response back to user
      // res.cookie('name', 'tobi', { domain: '.example.com', path: '/admin', secure: true })
      res.cookie("token", token);
      res.send("Login Successful");
    } else {
      throw new Error("PW unsuccessful");
    }
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

app.get("/profile", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

app.post("/sendConnectionRequest", userAuth, async (req, res) => {
  res.send("Sending connection request");
});

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
    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch((err) => {
    console.log("DB not connected");
  });
