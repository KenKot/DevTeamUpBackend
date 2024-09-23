const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 50,
    },
    lastName: {
      type: String,
    },
    emailId: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) throw new Error("Invalid email");
      },
    },
    password: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      min: 18,
    },
    gender: {
      type: String,
      enum: {
        values: ["male", "female", "other"],
      },
      // validate(value) {
      //   if (!["male", "female", "other"].includes(value)) {
      //     throw new Error("Gender data is not valid");
      //   }
      // },
    },
    photoUrl: {
      type: String,
      default:
        "https://i.pinimg.com/736x/0d/64/98/0d64989794b1a4c9d89bff571d3d5842.jpg",
      validate(value) {
        if (!validator.isURL(value)) throw new Error("Invalid photo url");
      },
    },
    about: {
      type: String,
      default:
        "We don't know much about this person, but we're sure they're great!",
    },
    skills: {
      type: [String],
    },
  },
  { timestamps: true }
);

userSchema.methods.getJWT = async function () {
  const user = this;

  const token = await jwt.sign({ _id: user._id }, "TEMPSECRETKEY", {
    expiresIn: "1d",
  });

  return token;
};

userSchema.methods.validatePassword = async function (password) {
  const user = this;
  const passwordHash = user.password;

  const isPasswordValid = await bcrypt.compare(password, passwordHash);
  return isPasswordValid;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
