const Product = require("../models/Product");
const audit = require("../utils/audit");

// GET ALL PRODUCTS
const getProducts = async (req, res) => {
  try {
    const {
      search = "",
      category,
      minPrice,
      maxPrice,
      inStock,
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {
      isActive: true,
    };

    // Search
    if (search.trim()) {
      filter.$text = {
        $search: search.trim(),
      };
    }

    // Category
    if (category) {
      filter.category = category;
    }

    // Price range
    if (minPrice || maxPrice) {
      filter.price = {};

      if (minPrice) {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    // Stock filter
    if (inStock === "true") {
      filter.stock = {
        $gt: 0,
      };
    }

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Number(limit), 50);
    const skip = (pageNumber - 1) * limitNumber;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),

      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      products,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch products",
    });
  }
};

// GET SINGLE PRODUCT
const getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID",
    });
  }
};

// CREATE PRODUCT
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      stock,
      lowStockThreshold,
      image,
    } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, category and price are required",
      });
    }

    const product = await Product.create({
      name,
      description,
      category,
      price,
      stock: stock ?? 0,
      lowStockThreshold: lowStockThreshold ?? 5,
      image: image ?? "",
    });

    await audit({ req, action: "CREATE_PRODUCT", entityType: "PRODUCT", entityId: product._id, metadata: { name: product.name, category: product.category } });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create product",
    });
  }
};

// UPDATE PRODUCT
const updateProduct = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "description",
      "category",
      "price",
      "stock",
      "lowStockThreshold",
      "image",
      "isActive",
    ];
    const updates = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid product fields supplied",
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await audit({ req, action: "UPDATE_PRODUCT", entityType: "PRODUCT", entityId: product._id, metadata: { name: product.name, stock: product.stock } });

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update product error:", error);

    return res.status(400).json({
      success: false,
      message: "Unable to update product",
    });
  }
};

// SOFT DELETE PRODUCT
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        isActive: false,
      },
      {
        new: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product removed successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID",
    });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};