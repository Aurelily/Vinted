const express = require("express");
const cloudinary = require("cloudinary").v2;
const router = express.Router();

//Je déclare les packages utilisés pour l'encryptage des mdp
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

//import des models utilisés
const User = require("../models/User");

//Route POST : /user/signup : inscription des users à la bdd
router.post("/user/signup", async (req, res) => {
  try {
    //Je destructure mon body
    const { email, username, phone, password } = req.fields;

    // Etape1 : vérifier qu'il n'y a pas déjà un user qui possède cet email
    const user = await User.findOne({ email: email });

    if (!user) {
      // Etape2 : encrypter le mot de passe (uid2, crypto-js)et générer le token
      const salt = uid2(16);
      const hash = SHA256(salt + password).toString(encBase64);
      const token = uid2(64);

      //Etape3 : créer un nouvel user dans la BDD
      //upload de l'image de l'avatar

      const newUser = new User({
        email: email,
        account: {
          username: username,
          phone: phone,
          password: password,
          avatar: req.files.avatar.name,
        },
        token: token,
        hash: hash,
        salt: salt,
      });
      const resultUpload = await cloudinary.uploader.upload(
        req.files.avatar.path,
        {
          folder: `/vinted/users/${newUser._id.toString()}`,
        }
      );

      if (username) {
        await newUser.save();
        // Etape4 : répondre au client
        res.status(200).json({
          _id: newUser._id,
          token: newUser.token,
          account: newUser.account,
          avatar: resultUpload.secure_url,
        });
      } else {
        res.status(400).json({ error: "Missing parameters" });
      }
    } else {
      res.status(409).json({ message: "This email already has an account" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//Route POST : /user/login : se logguer à partir d'un mail + password
router.post("/user/login", async (req, res) => {
  try {
    //Je destructure mon body
    const { email, password } = req.fields;
    // Etape1 : chercher le user qui souhaite se connecter
    const user = await User.findOne({ email: email });
    if (user) {
      // Etape2 : vérifier que le mot de passe est le bon
      //nouveau hash à partir du salt de la bdd pour ce user + le password qu'il vient de rentrer
      const newHash = SHA256(`${user.salt}${password}`).toString(encBase64);

      if (newHash === user.hash) {
        // Etape3 : répondre au client OK
        //console.log("On peut se connecter");
        res.status(200).json({
          _id: user._id,
          token: user.token,
          account: user.account,
        });
      } else {
        //console.log("On ne peut pas se connecter");
        res.status(401).json({ message: "Unauthorized" });
      }
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//export du fichier routes
module.exports = router;
