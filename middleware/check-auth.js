const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error");

const validateToken = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  const { TOKEN_SECRET } = process.env;
  let token;
  try {
    token = req.headers.authorization.split(" ")[1];
    if (!token) {
      throw new Error("Could not parse auth token");
    }
  } catch {
    return next(
      new HttpError("No Authorization token in request headers.", 401)
    );
  }

  try {
    const { userId, email } = jwt.verify(token, TOKEN_SECRET);
    req.userData = { userId, email };
    next();
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
