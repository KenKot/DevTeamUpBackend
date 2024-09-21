const User = require("../models/user");
const jwt = require("jsonwebtoken");

const userAuth = async (req, res, next) => {
  try {
    // read token from request cookies
    const { token } = req.cookies;
    if (!token) throw new Error("Invalid creds");

    //validate token
    const decodedObj = await jwt.verify(token, "TEMPSECRETKEY");
    const { _id } = decodedObj;

    //find the user
    const user = await User.findById(_id);

    if (!user) throw new Error("userAuth() failed");

    req.user = user;
    next();
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
};

const adminAuth = (req, res, next) => {
  const isAuthed = false;

  if (!isAuthed) {
    res.status(401).send("You're not user authed");
  }
  next();
};

module.exports = { userAuth, adminAuth };
