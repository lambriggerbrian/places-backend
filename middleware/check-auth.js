const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error");

const validateToken = (req, res, next) => {
  // Ignore automatic browser OPTIONS request
  if (req.method === "OPTIONS") {
    return next();
  }
  const TOKEN_SECRET = process.env.TOKEN_SECRET;
  // Parse token
  let token;
  try {
    token = req.headers.authorization.split(" ")[1];
    if (!token) {
      throw new Error("Could not parse auth token");
    }
  } catch {
    return next(new HttpError("Not authenticated.", 403));
  }
  // Verify token and add decoded data to request object
  try {
    const { userId, email } = jwt.verify(token, TOKEN_SECRET);
    req.userData = { userId, email };
    return next();
  } catch (error) {
    return next(
      new HttpError(
        `Authentication failed, please check credentials and try again.`,
        401
      )
    );
  }
};

module.exports = validateToken;
