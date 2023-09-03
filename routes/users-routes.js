const express = require("express");
const { check } = require("express-validator");
const fileUpload = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");

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
  fileUpload.single("image"),
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
    check("password").isLength({ min: 8 }),
  ],
  postLogin
);

router.use(checkAuth);

router.delete("/:userId", deleteUserByUserId);

module.exports = router;
