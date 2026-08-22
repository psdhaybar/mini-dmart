const express = require("express");

const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Public storefront
router.get("/", getProducts);

router.get("/:id", getProduct);

// Manager/Admin product management
router.post(
  "/",
  protect,
  authorize("MANAGER", "ADMIN"),
  createProduct
);

router.patch(
  "/:id",
  protect,
  authorize("MANAGER", "ADMIN"),
  updateProduct
);

router.delete(
  "/:id",
  protect,
  authorize("MANAGER", "ADMIN"),
  deleteProduct
);

module.exports = router;