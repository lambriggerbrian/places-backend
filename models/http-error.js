class HttpError extends Error {
  constructor(message, statusCode) {
    super(message); // Add a "message" property
    this.statusCode = statusCode;
  }
}

module.exports = HttpError;
