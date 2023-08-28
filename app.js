const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");

// Parse environment variables
const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");
dotenvExpand.expand(dotenv.config());

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  next();
});

app.use(bodyParser.json());

// Register routes
app.use("/api/places", placesRoutes); // => /api/places/...
app.use("/api/users", usersRoutes); // => /api/users/...

// Default unsupported route handler
app.use((req, res, next) => {
  const error = new HttpError("Route not supported", 404);
  throw error;
});

// Default error handler
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }
  res.status(error.statusCode || 500);
  res.json({ message: error.message || "An unknown error occurred", error });
});

// Connect to database and start server
console.log(`Connecting to db at ${process.env.MONGODB_TARGET}...`);
mongoose
  .connect(process.env.MONGODB_CONNECTION_STRING)
  .then(() => {
    console.log("Connected to database.");
    app.listen(process.env.LISTEN_PORT || 5000);
    console.log("Server started!");
  })
  .catch((error) => {
    console.log(error);
  });
