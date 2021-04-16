//Fonction middleware vérifiant si la personne est authentifiée avant de rentrer dans le async(req, res)...etc

const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  try {
    //Récupération du token posté depuis Postman
    const token = req.headers.authorization.replace("Bearer ", "");
    //Quel est le user qui possède ce token ?
    const user = await User.findOne({ token: token });
    if (user.token === token) {
      //ajouter à req l'objet user
      req.user = user;
      //Si il existe
      next();
    } else {
      //sinon : unauthorized
      res.status(401).json({ message: "Unauthorized" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//On exporte la fonction middleware
module.exports = isAuthenticated;
