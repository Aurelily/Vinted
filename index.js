const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const morgan = require("morgan");
require("dotenv").config();

const app = express();
app.use(formidable());
app.use(morgan("dev"));

//Config cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//connect BDD
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

//import et activation des routes
const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");
app.use(userRoutes);
app.use(offerRoutes);

//gestion routes inexistantes
app.all("*", (req, res) => {
  res.json({ message: "Route inexistante!!" });
});

//Ecoute du port
app.listen(process.env.PORT, () => {
  console.log("Server started ! 😎");
});
