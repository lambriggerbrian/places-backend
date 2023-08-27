const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const HttpError = require("../models/http-error");

const API_KEY = process.env.GOOGLE_API_KEY;
const GEOCODE_API_URL = "https://maps.googleapis.com/maps/api/geocode";

async function getCoordinatesByAddress(address) {
  const encoded_address = encodeURIComponent(address);
  try {
    const response = await axios.get(
      `${GEOCODE_API_URL}/json?address=${encoded_address}&key=${API_KEY}`
    );

    const data = response.data;
    if (!data || data.status !== "OK") {
      throw new HttpError(
        "Could not find location for the specified address",
        404
      );
    }

    const coordinates = data.results[0].geometry.location;
    return coordinates;
  } catch (error) {
    console.log(error);
    throw new HttpError("Could not get coordinates for address");
  }
}

module.exports = getCoordinatesByAddress;
