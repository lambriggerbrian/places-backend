const express = require("express");

const { check } = require("express-validator");

const {
  getPlaceByPlaceId,
  getPlacesByUserId,
  postPlace,
  patchPlaceByPlaceId,
  deletePlaceById,
} = require("../controllers/places-controller");

const router = express.Router();

router.get("/:placeId", getPlaceByPlaceId);

router.get("/user/:userId", getPlacesByUserId);

router.post(
  "/",
  [
    check("title").notEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").notEmpty(),
    check("creator").notEmpty(),
  ],
  postPlace
);

router.patch(
  "/:placeId",
  [check("title").notEmpty(), check("description").isLength({ min: 5 })],
  patchPlaceByPlaceId
);

router.delete("/:placeId", deletePlaceById);

module.exports = router;
