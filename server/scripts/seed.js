require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../src/models/User");
const Product = require("../src/models/Product");

const users = [
  {
    name: "Mini D-Mart Admin",
    email: "admin@minidmart.com",
    password: "Admin@12345",
    role: "ADMIN",
  },
  {
    name: "Mini D-Mart Manager",
    email: "manager@minidmart.com",
    password: "Manager@12345",
    role: "MANAGER",
  },
  {
    name: "Mini D-Mart Staff",
    email: "staff@minidmart.com",
    password: "Staff@12345",
    role: "STAFF",
  },
  {
  name: "Test Customer",
  email: "customer@minidmart.com",
  password: "Customer@123",
  role: "CUSTOMER"
},
];

const products = [
  {
    name: "Amul Taaza Milk",
    description: "Fresh toned milk for everyday use.",
    category: "Dairy",
    price: 30,
    stock: 40,
    lowStockThreshold: 8,
    image:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150",
  },
  {
    name: "Harvest Brown Bread",
    description: "Soft and fresh whole wheat brown bread.",
    category: "Bakery",
    price: 45,
    stock: 25,
    lowStockThreshold: 5,
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff",
  },
  {
    name: "Fresh Bananas",
    description: "Naturally sweet fresh bananas.",
    category: "Fruits",
    price: 55,
    stock: 60,
    lowStockThreshold: 10,
    image:
      "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e",
  },
  {
    name: "Red Apples",
    description: "Crisp and juicy premium red apples.",
    category: "Fruits",
    price: 120,
    stock: 30,
    lowStockThreshold: 6,
    image:
      "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6",
  },
  {
    name: "Tata Salt",
    description: "Iodized salt for everyday cooking.",
    category: "Staples",
    price: 28,
    stock: 50,
    lowStockThreshold: 10,
    image:
      "https://images.unsplash.com/photo-1518110925495-5fe2e9e08d5e",
  },
  {
    name: "Aashirvaad Atta",
    description: "Whole wheat flour for soft homemade rotis.",
    category: "Staples",
    price: 285,
    stock: 20,
    lowStockThreshold: 5,
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff",
  },
  {
    name: "India Gate Basmati Rice",
    description: "Long-grain aromatic basmati rice.",
    category: "Staples",
    price: 180,
    stock: 35,
    lowStockThreshold: 7,
    image:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c",
  },
  {
    name: "Tata Tea Gold",
    description: "Rich and refreshing tea blend.",
    category: "Beverages",
    price: 230,
    stock: 18,
    lowStockThreshold: 5,
    image:
      "https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2",
  },
  {
    name: "Coca-Cola",
    description: "Classic chilled soft drink.",
    category: "Beverages",
    price: 45,
    stock: 30,
    lowStockThreshold: 8,
    image:
      "https://images.unsplash.com/photo-1554866585-cd94860890b7",
  },
  {
    name: "Lays Classic Chips",
    description: "Crispy potato chips with classic salted flavour.",
    category: "Snacks",
    price: 20,
    stock: 45,
    lowStockThreshold: 10,
    image:
      "https://images.unsplash.com/photo-1566478989037-eec170784d0b",
  },
  {
    name: "Dove Daily Shine Shampoo",
    description: "Gentle shampoo for everyday hair care.",
    category: "Personal Care",
    price: 190,
    stock: 15,
    lowStockThreshold: 5,
    image:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be",
  },
  {
    name: "Dettol Hand Wash",
    description: "Refreshing hand wash for everyday hygiene.",
    category: "Personal Care",
    price: 110,
    stock: 22,
    lowStockThreshold: 5,
    image:
      "https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f",
  },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    // -------------------------
    // USERS
    // -------------------------

    for (const userData of users) {
      const existingUser = await User.findOne({
        email: userData.email,
      });

      if (existingUser) {
          const hashedPassword = await bcrypt.hash(userData.password, 12);

          existingUser.name = userData.name;
          existingUser.password = hashedPassword;
          existingUser.role = userData.role;

          await existingUser.save();

          console.log(`Updated user: ${userData.email}`);
          continue;
        }
      const hashedPassword = await bcrypt.hash(
        userData.password,
        12
      );

      await User.create({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
      });

      console.log(`Created user: ${userData.email}`);
    }

    // -------------------------
    // PRODUCTS
    // -------------------------

    const productCount = await Product.countDocuments();

    if (productCount === 0) {
      await Product.insertMany(products);

      console.log(
        `Created ${products.length} starter products`
      );
    } else {
      console.log(
        `Products already exist: ${productCount}`
      );
    }

    console.log("Database seeding completed successfully");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedDatabase();