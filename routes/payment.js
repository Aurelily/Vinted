const express = require("express");
const formidable = require("express-formidable");
const cloudinary = require("cloudinary").v2;
const router = express.Router();
//Installation de cors pour pouvoir envoyer des requetes d'une page à une autre
const cors = require("cors");
//declaration de Stripe avec clé secrète
const stripe = require("stripe")(process.env.STRIPE_API_SECRET);

const app = express();
app.use(formidable());

//route POST : /payment : Paiement d'un produit via Stripe
router.post("/payment", async (req, res) => {
  try {
    // Recevoir un stripeToken
    console.log(req.fields.stripeToken);
    const response = await stripe.charges.create({
      amount: req.fields.amount * 100, // req.fields.price * 100 (car amount est exprimé en centimes dans Stripe)
      currency: "eur",
      description: req.fields.title,
      source: req.fields.stripeToken,
    });
    //Recevoir une reponse de Stripe
    console.log(response);
    if (response.status === "succeeded") {
      res.status(200).json({ message: "Paiement validé" });
    } else {
      res.status(400).json({ message: "An error occured" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//export du fichier routes
module.exports = router;
