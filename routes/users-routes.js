const express = require("express");
const { check } = require("express-validator");

const {
  getUsers,
  postUser,
  postLogin,
  deleteUserByUserId,
} = require("../controllers/users-controller");

const router = express.Router();

router.get("/", getUsers);

router.post(
  "/signup",
  [
    check("name").notEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  postUser
);

router.post(
  "/login",
  [
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  postLogin
);

router.delete("/:userId", deleteUserByUserId);

module.exports = router;
