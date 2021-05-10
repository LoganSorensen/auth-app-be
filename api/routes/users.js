const router = require("express").Router();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    // accept a file
    cb(null, true);
  } else {
    // reject a file
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: fileFilter,
});

const checkAuth = require("../middleware/checkAuth");

const User = require("../models/user");

// Register a User
router.post("/register", (req, res) => {
  User.find({ email: req.body.email })
    .exec()
    .then((user) => {
      if (user.length > 0) {
        res.status(409).json({
          message: "A user with this email already exists",
        });
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).json({
              error: err,
            });
          } else {
            const user = new User({
              _id: new mongoose.Types.ObjectId(),
              email: req.body.email,
              password: hash,
              name: "",
              bio: "",
              phone: "",
              photo: "",
            });

            const token = jwt.sign(
              {
                email: user.email,
                userId: user._id,
              },
              process.env.JWT_KEY,
              {
                expiresIn: "1h",
              }
            );

            user
              .save()
              .then((result) => {
                console.log(result);
                res.status(201).json({
                  message: "User created",
                  token: token,
                  id: result._id,
                });
              })
              .catch((err) => {
                console.log(err);
                res.status(500).json({
                  error: err,
                });
              });
          }
        });
      }
    });
});

// Login
router.post("/login", (req, res) => {
  User.find({ email: req.body.email })
    .exec()
    .then((user) => {
      if (user.length < 1) {
        return res.status(401).json({
          message: "Auth failed",
        });
      }
      bcrypt.compare(req.body.password, user[0].password, (err, result) => {
        if (err) {
          return res.status(401).json({
            message: "Auth failed",
          });
        }

        if (result) {
          const token = jwt.sign(
            {
              email: user[0].email,
              userId: user[0]._id,
            },
            process.env.JWT_KEY,
            {
              expiresIn: "1h",
            }
          );
          return res.status(200).json({
            message: "Auth successful",
            token: token,
            id: user[0]._id,
          });
        }
        return res.status(401).json({
          message: "Auth failed",
        });
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

// Get Users
router.get("/", (req, res) => {
  User.find()
    // .select("-password -__v")
    .exec()
    .then((docs) => {
      const response = {
        count: docs.length,
        users: docs,
      };
      res.status(200).json(response);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

// Get User by Id
router.get("/:userId", checkAuth, (req, res) => {
  const id = req.params.userId;
  User.findById(id)
    .select("-password -__v -_id")
    .exec()
    .then((doc) => {
      if (doc) {
        res.status(200).json(doc);
      } else {
        res.status(404).json({ message: "No user found" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

// Update User
router.put("/:userId", checkAuth, upload.single("userImage"), (req, res) => {
  const id = req.params.userId;
  const updateOps = {};

  const data = JSON.parse(req.body.data);

  for (const ops of data) {
    updateOps[ops.propName] = ops.value;
  }

  if (req.file) updateOps.photo = `http://localhost:5000/${req.file.path}`;


  User.updateOne({ _id: id }, { $set: updateOps })
    .exec()
    .then((result) => {
      res.status(200).json({
        message: "User updated",
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

// Delete User
router.delete("/:userId", checkAuth, (req, res) => {
  const id = req.params.userId;
  User.remove({ _id: id })
    .exec()
    .then((result) => {
      res.status(200).json({ message: "User deleted" });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

module.exports = router;
