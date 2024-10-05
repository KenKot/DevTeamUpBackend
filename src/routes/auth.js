const express = require("express");
const authRouter = express.Router();

const { validateSignUpData } = require("../utils/validation");
const User = require("../models/user");
const bcrypt = require("bcrypt");

authRouter.post("/signup", async (req, res) => {
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

    const savedUser = await user.save();
    const token = await savedUser.getJWT();

    res.cookie("token", token);
    res.json({ message: "Signed up succesfully", data: savedUser });
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

authRouter.post("/login", async (req, res) => {
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
      // res.send("Login Successful");

      // res.send(user);
      res.json({ message: "Logged in succesfully", data: user });
    } else {
      throw new Error("PW unsuccessful");
    }
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

authRouter.post("/logout", async (req, res) => {
  //   res.cookie("token", null, {
  //     expires: new Date(Date.now()),
  //   });
  //   res.send();

  res
    .cookie("token", null, {
      expires: new Date(Date.now()),
    })
    .send();
});

module.exports = authRouter;
