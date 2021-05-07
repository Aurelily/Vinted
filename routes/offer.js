const express = require("express");
const formidable = require("express-formidable");
const cloudinary = require("cloudinary").v2;
const router = express.Router();

const isAuthenticated = require("../middlewares/isAuthenticated");

const app = express();
app.use(formidable());

//import des models utilisés
const User = require("../models/User");
const Offer = require("../models/Offer");

//route POST : /offer/publish : Publier une offre
router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    const user = req.user;
    //Deconstruction du body
    const {
      title,
      description,
      price,
      condition,
      city,
      brand,
      size,
      color,
    } = req.fields;
    const picture = req.files.picture.path;
    const secPicture = req.files.secPicture.path;

    if (title && price && picture) {
      //Créer la nouvelle offre (sans l'image)
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { MARQUE: brand },
          { TAILLE: size },
          { ETAT: condition },
          { COULEUR: color },
          { EMPLACEMENT: city },
        ],
        owner: req.user,
      });
      //upload de l'image principale du produit définie dans postman
      const resultUpload = await cloudinary.uploader.upload(picture, {
        folder: `/vinted/offers/${newOffer._id}`,
      });
      //upload de l'image secondaire du produit définie dans postman
      const resultSecUpload = await cloudinary.uploader.upload(secPicture, {
        folder: `/vinted/offers/${newOffer._id}`,
      });
      // Ajouter le result des upload à newOffer
      newOffer.product_image = resultUpload;
      newOffer.product_pictures = resultSecUpload;
      //sauver l'annonce
      await newOffer.save();
      //répondre au client
      res.status(200).json(newOffer);
    } else {
      res
        .status(400)
        .json({ message: "title, price and picture are required" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ message: error.message });
  }
});

//route PUT : /offer/modify/:_id => Permet de modifier une offre à partir de son id en paramètre => A FINIR
router.put("/offer/modify/:id", isAuthenticated, async (req, res) => {
  try {
    //offre que l'on veut modifier
    const offerToModify = await Offer.findById(req.params.id);
    if (req.fields.title) {
      offerToModify.product_name = req.fields.title;
    }
    if (req.fields.description) {
      offerToModify.product_description = req.fields.description;
    }
    if (req.fields.price) {
      offerToModify.product_price = req.fields.price;
    }
    //Product_detail est un tableau composé d'objet que l'on doit parcourir :
    const details = offerToModify.product_details;
    for (let i = 0; i < details.length; i++) {
      if (details[i].MARQUE) {
        if (req.fields.brand) {
          details[i].MARQUE = req.fields.brand;
        }
      }
      if (details[i].TAILLE) {
        if (req.fields.size) {
          details[i].TAILLE = req.fields.size;
        }
      }
      if (details[i].ÉTAT) {
        if (req.fields.condition) {
          details[i].ÉTAT = req.fields.condition;
        }
      }
      if (details[i].COULEUR) {
        if (req.fields.color) {
          details[i].COULEUR = req.fields.color;
        }
      }
      if (details[i].EMPLACEMENT) {
        if (req.fields.city) {
          details[i].EMPLACEMENT = req.fields.city;
        }
      }
    }
    // Notifie Mongoose que l'on a modifié le tableau product_details
    offerToModify.markModified("product_details");

    //Gère la modification de l'image uploadée

    if (req.files.picture) {
      //J'upload la nouvelle image
      const resultUpload = await cloudinary.uploader.upload(
        req.files.picture.path,
        {
          folder: `/vinted/offers/${req.params.id}`,
        }
      );
      offerToModify.product_image = resultUpload;
    }

    //On sauve et on répond au client

    await offerToModify.save();
    res.status(200).json("Offer modified succesfully !");
  } catch (error) {
    res.json({ error: error.message });
  }
});

//route DELETE : /offer/delete/:_id => Permet de supprimer une offre => A FINIR
router.delete("/offer/delete/:id", isAuthenticated, async (req, res) => {
  try {
    const offerToDelete = await Offer.findById(req.params.id);
    const publicId = offerToDelete.product_image.public_id;

    //Je supprime les images du dossier de l'offre à supprimer
    await cloudinary.api.delete_resources_by_prefix(
      `vinted/offers/${req.params.id}`
    );

    //Une fois le dossier vide, je peux le supprimer !
    await cloudinary.api.delete_folder(`vinted/offers/${req.params.id}`);

    //Je supprime l'offre

    await offerToDelete.delete();

    res.status(200).json("Offer deleted succesfully !");
  } catch (error) {
    res.json({ error: error.message });
  }
});

//route GET : /offers => Renvoi la liste d'annonce correspondant à la recherche filtrée
router.get("/offers", async (req, res) => {
  try {
    //Définir les différentes sortes de requetes/recherches possibles
    const reqTitle = req.query.title;
    const reqPriceMin = req.query.priceMin;
    const reqPriceMax = req.query.priceMax;
    const reqSort = req.query.sort;
    const reqPage = req.query.page;

    // Je décide de mettre un type de tri par défaut croissant par prix
    let sortType = { product_price: 1 };

    //Je crée un objet vide qui contiendra mes clés de filtre
    let filters = {};

    //si il y a un title j'ajoute la clé product_name à mon objet filters'
    if (reqTitle) {
      filters.product_name = new RegExp(reqTitle, "i");
    }

    //si il y a une notion de prix min et/ou max j'ajoute la clé product_price à l'objet filters
    if (reqPriceMin && reqPriceMax) {
      filters.product_price = { $lte: reqPriceMax, $gte: reqPriceMin };
    } else if (reqPriceMin) {
      filters.product_price = { $gte: reqPriceMin };
    } else if (reqPriceMax) {
      filters.product_price = { $lte: reqPriceMax };
    }
    console.log(filters);

    //si il y a un sort je tri selon ce qui est demandé : price-desc ou price-asc
    if (reqSort) {
      if (reqSort === "price-desc") {
        sortType.product_price = -1;
      } else if (reqSort === "price-asc") {
        sortType.product_price = 1;
      } else {
        res.status(400).json({ error: "Invalid sort !" });
      }
    }

    //Je gère ma PAGINATION :

    // Je mets un nombre de page à ignorer par defaut (skip)
    let pageToSkip = 0;

    // Je mets le nombre limite (limit)d'offres par page que je décide par defaut dans une variable (si on a besoin de la modifier plus tard)
    let pageLimit = 5;

    if (reqPage > 1) {
      pageToSkip = pageLimit * reqPage - pageLimit;
    }

    //Je mets mon objet filters dans ma requete find() pour obtenir mon résultat et y ajoute mon sort et ma pagination
    let offers = await Offer.find(filters)
      // .select("product_name product_price")
      .sort(sortType)
      .populate({
        path: "owner",
        select: "account",
      })
      .skip(pageToSkip)
      .limit(pageLimit);

    // calculer le nombre de résultats
    const count = await Offer.countDocuments(filters);

    //réponse au client
    res.status(200).json({
      count: count,
      offers: offers,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//route GET : /offer/:id => Récupérer les détails d'une annonce en fonction de son id en params
router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await (await Offer.findById(req.params.id)).populated({
      path: "owner",
      select: "account",
    });
    if (offer) {
      return res.status(200).json({ offer });
    } else {
      res.status(404).json({ error: "There is no corresponding offer !" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//export du fichier routes
module.exports = router;
