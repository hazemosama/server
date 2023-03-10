const express = require("express");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user-model");
const authRouter = express.Router();
const authMiddleware = require("../middlewares/auth-middleware");

authRouter.post("/signup", async (req, res) => {
  const { email, name, password } = req.body;

  const existingUser = await User.findOne({ email });
  try {
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with same email already exists!" });
    }
    const hashedPassword = await bcryptjs.hash(password, 8);

    let user = new User({
      email,
      name,
      password: hashedPassword,
    });

    user = await user.save();

    res.json({ message: "Account created successfully", data: user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

authRouter.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  try {
    if (!user) {
      return res
        .status(400)
        .json({ message: "User with this email doesn't exist!" });
    }
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password!" });
    }

    const token = jwt.sign({ id: user._id }, "passwordKey");
    res.json({
      message: "Logged in successfully",
      data: { token, ...user._doc },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

authRouter.post("/token-verification", async (req, res) => {
  try {
    const token = req.header("x-auth-token");
    if (!token) return res.json(false);
    const isVerified = jwt.verify(token, "passwordKey");
    if (!isVerified) return res.json(false);
    const user = await User.findById(isVerified.id);
    if (!user) res.json(false);
    res.json(true);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

authRouter.get("/get-user-data", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user);
  for (let i = 0; i < user.cart.length; i++) {
    if (user.cart[i].product.quantity == 0) {
      user.cart.splice(i, 1);
      user = await user.save();
    }
  }
  res.json({
    message: "successfully get data",
    data: { ...user._doc, token: req.token },
  });
});

module.exports = authRouter;
