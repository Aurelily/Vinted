const mongoose = require("mongoose");
const User = require("./User");

const Offer = mongoose.model("Offer", {
  product_name: { type: String, match: /^.{0,20}$/ },
  product_description: { type: String, match: /^.{0,500}$/ },
  product_price: { type: Number, max: 100000 },
  product_details: Array,
  product_image: { type: mongoose.Schema.Types.Mixed, default: {} },
  product_pictures: Array,
  product_date: { type: Date, default: Date.now },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

//Export du model
module.exports = Offer;
