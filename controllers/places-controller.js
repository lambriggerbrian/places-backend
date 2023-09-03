const { matchedData, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const getCoordinatesByAddress = require("../util/location");
const { findUserByUserId } = require("./users-controller");
const Place = require("../models/place");
const User = require("../models/user");
const fs = require("fs");

const findPlaceByPlaceId = async (placeId) => {
  try {
    const place = await Place.findById(placeId).exec();
    if (!place) {
      throw new HttpError("Could not find place for provided place id", 404);
    }
    return place;
  } catch (error) {
    console.log(error);
    throw new HttpError("Encountered an error finding place by id", 500);
  }
};

const getPlaceByPlaceId = async (req, res, next) => {
  const placeId = req.params.placeId;
  try {
    const place = await findPlaceByPlaceId(placeId);
    res.json({ place: place.toObject({ getters: true }) });
  } catch (error) {
    return next(error);
  }
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.userId;
  // Verify userId exists
  try {
    const user = await User.findById(userId).exec();
    if (!user) {
      throw new HttpError("No user with that userId found", 404);
    }
  } catch (error) {
    return next(error);
  }
  // Get places for the userId
  try {
    const places = await Place.find({ creator: userId }).exec();
    res.json({
      count: places.length,
      places: places.map((place) => place.toObject({ getters: true })),
    });
  } catch (error) {
    console.log(error);
    return next(new HttpError("Could not find places by user id", 500));
  }
};

const getPlacesByUserIdPopulate = async (req, res, next) => {
  const userId = req.params.userId;
  try {
    const user = await User.findById(userId).populate("places");
    const places = user.places;
    if (places.length === 0) {
      return next(
        new HttpError("Could not find places for provided user id", 404)
      );
    }
    res.json({
      count: places.length,
      places: places.map((place) => place.toObject({ getters: true })),
    });
  } catch (error) {
    console.log(error);
    return next(new HttpError("Could not find places by user id", 500));
  }
};

const postPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Invalid input", 422));
  }
  const { title, description, address } = matchedData(req);
  const userId = req.userData.userId;
  const image = req.file.path;
  // Get creator exists as user model
  let user;
  try {
    user = await User.findById(userId);
  } catch (error) {
    console.log(error);
    return next(new HttpError("Could not find creator by user id"), 422);
  }
  // Get coordinates of address
  let coordinates;
  try {
    coordinates = await getCoordinatesByAddress(address);
  } catch (error) {
    console.log(error);
    return next(new HttpError("Could not get coordinates for address"));
  }
  // Create place model
  const newPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image,
    creator: userId,
  });
  user.places.push(newPlace);
  // Commit transaction
  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await newPlace.save({ session });
    await user.save({ session });
    await session.commitTransaction();
    res.status(201).json({ newPlace });
  } catch (error) {
    console.log(error);
    return next(new HttpError("Could not create place", 500));
  }
};

const patchPlaceByPlaceId = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid input", 422));
  }
  const { title, description } = matchedData(req);
  // Find the place to patch
  const placeId = req.params.placeId;
  let place;
  try {
    place = await Place.findById(placeId);
    if (place.creator !== req.userData.userId) {
      return next(
        new HttpError("User is not authorized to edit this place.", 401)
      );
    }
  } catch (error) {
    return next(error);
  }
  // Update place values
  try {
    place.title = title;
    place.description = description;
    await place.save();
    res.json({ place: place.toObject({ getters: true }) });
  } catch (error) {
    console.log(error);
    return next(new HttpError("Could not update place", 500));
  }
};

const deletePlaceById = async (req, res, next) => {
  const placeId = req.params.placeId;
  const userId = req.userData.userId;
  // Find the place to delete and its creator
  let place, user, imagePath;
  try {
    place = await Place.findById(placeId).populate("creator");
    user = place.creator;
    imagePath = place.image;
    if (user.id !== userId) {
      return next(
        new HttpError("User is not authorized to delete this place.", 401)
      );
    }
    // Remove place reference from its creator
    user.places.pull(placeId);
  } catch (error) {
    // Pass errors specific to finding the place
    return next(error);
  }
  // Delete the place
  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await place.deleteOne({ session });
    await user.save({ session });
    await session.commitTransaction();
    fs.unlink(imagePath, (err) => {
      console.log(`File ${imagePath} deleted.`);
    });
    res.json({ message: "Place deleted successfully" });
  } catch (error) {
    return next(new HttpError("Could not delete place", 500));
  }
};

exports.getPlaceByPlaceId = getPlaceByPlaceId;
exports.getPlacesByUserId = getPlacesByUserId;
exports.postPlace = postPlace;
exports.patchPlaceByPlaceId = patchPlaceByPlaceId;
exports.deletePlaceById = deletePlaceById;
