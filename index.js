const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const morgan = require("morgan");
require("dotenv").config();
let cors = require("cors");

const app = express();

app.use(formidable());

app.use(morgan("dev"));

//Cette ligne fait bénifier de CORS à toutes les requêtes de notre serveur
app.use(cors());

//Config cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//Route d'accueil pour MongoDB ATLAS
app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to Vinted API by Lily !" });
});

//connect BDD
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
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
