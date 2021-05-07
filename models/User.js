const mongoose = require("mongoose");

const User = mongoose.model("User", {
  email: {
    unique: true,
    type: String,
  },
  account: {
    username: {
      require: true,
      type: String,
    },
    phone: String,
    // avatar: { type: mongoose.Schema.Types.Mixed, default: {} }, //voir plus tard avec react
    avatar: Object,
    avatarPath: String,
  },
  token: String,
  hash: String,
  salt: String,
});

//export du model
module.exports = User;
