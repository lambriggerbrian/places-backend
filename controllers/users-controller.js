const { matchedData, validationResult } = require("express-validator");
const mongoose = require("mongoose");

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
    const newUser = User({
      name,
      email,
      password,
      image: "https://dummyimage.com/300x300/000/fff",
      places: [],
    });
    await newUser.save();
    res.status(201).json({ message: "User created" });
  } catch (error) {
    return next(new HttpError("Could not create user", 500));
  }
};

const postLogin = async (req, res, next) => {
  checkValidation(req, next);
  const { email, password } = matchedData(req);

  try {
    const user = await User.findOne({ email, password });
    if (!user) {
      return next(new HttpError("Incorrect login information", 401));
    }
    res.json({ message: "Login successful" });
  } catch (error) {
    return next(new HttpError("Could not login", 500));
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
