const { matchedData, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const HttpError = require("../models/http-error");
const User = require("../models/user");
const Place = require("../models/place");

const checkValidation = (req, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid input", 422));
  }
};

const findUserByUserId = async (userId) => {
  let user;
  try {
    user = await User.findById(userId, "-password").exec();
  } catch (error) {
    console.log(error);
    throw new HttpError("Could not get user", 500);
  }
  if (!user) {
    throw new HttpError("No user with given ID found", 404);
  }
  return user;
};

const generateToken = async (user) => {
  const { TOKEN_SECRET, TOKEN_EXPIRY } = process.env;
  try {
    return jwt.sign({ userId: user.id, email: user.email }, TOKEN_SECRET, {
      expiresIn: TOKEN_EXPIRY || "1h",
    });
  } catch {
    throw new HttpError("Could not generate token for user.", 500);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}, "-password").exec();
    if (!users.length) {
      return next(new HttpError("No users found", 404));
    }
    res.json({
      count: users.length,
      users: users.map((user) => user.toObject({ getters: true })),
    });
  } catch (error) {
    console.log(error);
    return next(new HttpError("Could not get users", 500));
  }
};

const postUser = async (req, res, next) => {
  checkValidation(req, next);
  const { name, email, password } = matchedData(req);
  const image = req.file.path;
  if (!image) {
    return next(new HttpError("Could not get image for new user.", 500));
  }
  // Check for existing user
  try {
    const existingUser = await User.findOne({ email }).exec();
    if (existingUser) {
      return next(
        new HttpError(
          "User with email already exists, please login instead",
          422
        )
      );
    }
  } catch {
    return next(
      new HttpError(
        "Error finding if user wtih email already exists, please try again.",
        500
      )
    );
  }
  // Create new user
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = User({
      name,
      email,
      password: hashedPassword,
      image,
      places: [],
    });
    await newUser.save();
    // Generate token and respond
    const token = await generateToken(newUser);
    res.status(201).json({
      message: "User created",
      userId: newUser.id,
      email: newUser.email,
      token,
    });
  } catch (error) {
    return next(new HttpError("Could not create user, please try again.", 500));
  }
};

const postLogin = async (req, res, next) => {
  checkValidation(req, next);
  const { email, password } = matchedData(req);
  // Check for existing user
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return next(
        new HttpError("Could not find user with the given email.", 404)
      );
    }
    // Validate password
    let isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return next(new HttpError("Invalid credentials, could not log in.", 401));
    }
    // Generate token and respond
    const token = await generateToken(user);
    res.json({
      message: "Login successful",
      userId: user.id,
      email: user.email,
      token,
    });
  } catch (error) {
    return next(
      new HttpError(
        "Could not login, please check your credentials and try again.",
        500
      )
    );
  }
};

const deleteUserByUserId = async (req, res, next) => {
  const userId = req.params.userId;

  // Find the user to delete and its places
  let user;
  try {
    user = await User.findById(userId).populate("places").exec();
    if (!user) {
      return next(new HttpError("Could not find user to delete", 404));
    }
  } catch (error) {
    // Pass errors specific to finding the user
    return next(error);
  }

  const imagePath = user.image;

  // Delete the user and its places
  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    for (const place of user.places) {
      place.deleteOne({ session });
    }
    //await Place.deleteMany({ creator: userId }, { session });
    await user.deleteOne({ session });
    await session.commitTransaction();
    fs.unlink(imagePath, (err) => {
      console.log(`File ${imagePath} deleted.`);
    });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.log(error);
    return next(new HttpError("Could not delete user", 500));
  }
};

exports.findUserByUserId = findUserByUserId;
exports.getUsers = getUsers;
exports.postUser = postUser;
exports.postLogin = postLogin;
exports.deleteUserByUserId = deleteUserByUserId;
