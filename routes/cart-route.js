const express = require("express");
const cartRouter = express.Router();
const authMiddleware = require("../middlewares/auth-middleware");
const Product = require("../models/product-model").Product;
const User = require("../models/user-model");

cartRouter.post("/add", authMiddleware, async (req, res) => {
  try {
    const id = req.body.id;
    const product = await Product.findById(id);
    let user = await User.findById(req.user);
    if (product.quantity == 0) {
      return res.json({ message: "Product out of stock", data: user });
    }
    if (user.cart.length == 0) {
      user.cart.push({ product, quantity: 1 });
      user = await user.save();
      return res.json({ message: "Successfully added to cart", data: user });
    } else {
      let productIndex;
      let productInCart = false;
      for (i in user.cart) {
        if (user.cart[i].product.quantity == 0) {
          user.cart.splice(i, 1);
        }
        if (user.cart[i].product._id.equals(product._id)) {
          productIndex = i;
          productInCart = true;
          break;
        }
      }
      if (productInCart) {
        if (
          user.cart[productIndex].quantity <
          user.cart[productIndex].product.quantity
        ) {
          user.cart[productIndex].quantity += 1;
          user = await user.save();
          res.json({ message: "Quantity increased", data: user });
        } else {
          user = await user.save();
          return res.json({ message: "Quantity not enough!", data: user });
        }
      } else {
        user.cart.push({ product, quantity: 1 });
        user = await user.save();
        return res.json({ message: "Successfully added to cart", data: user });
      }
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

cartRouter.delete("/decrease/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id);
    let user = await User.findById(req.user);
    for (i in user.cart) {
      if (user.cart[i].product._id.equals(product._id)) {
        if (user.cart[i].quantity == 1) {
          user.cart.splice(i, 1);
          user = await user.save();
          return res.json({ message: "Product removed from cart", data: user });
        } else {
          user.cart[i].quantity = user.cart[i].quantity - 1;
          user = await user.save();
          return res.json({ message: "Quantity decreased", data: user });
        }
      } else {
        return res.json(404).json({ message: "Product not in cart!" });
      }
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

cartRouter.delete("/remove/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id);
    let user = await User.findById(req.user);

    for (i in user.cart) {
      if (user.cart[i].product._id.equals(product._id)) {
        user.cart.splice(i, 1);
        user = await user.save();
        res.json({ message: "Product removed from cart", data: user });
      } else {
        res.json(404).json({ message: "Product not in cart!" });
      }
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = cartRouter;
