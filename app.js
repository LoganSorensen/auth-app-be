require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const multer = require('multer')

const app = express();

mongoose.connect(
  `mongodb+srv://LoganSorensen:${process.env.MONGO_ATLAS_PW}@cluster0.4vsca.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`,
  { useNewUrlParser: true, useUnifiedTopology: true }
);
mongoose.Promise = global.Promise;

// Middleware
app.use(morgan("dev"));
app.use('/uploads', express.static("uploads"))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.status(200).json({});
  }
  next();
});

// Routers
const userRoutes = require("./api/routes/users");

// Routes
app.use("/users", userRoutes);

module.exports = app;
