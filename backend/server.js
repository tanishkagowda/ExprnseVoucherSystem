
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const voucherRoutes = require("./routes/voucherRoutes");

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Expense Voucher Management API is running",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/vouchers", voucherRoutes);

// Central error handler
app.use((err, req, res, next) => {
  console.error("Application error:", err.message);

  if (err.name === "MulterError") {
    return res.status(400).json({
      message:
        err.code === "LIMIT_FILE_SIZE"
          ? "The signature image must not exceed 2 MB."
          : "There was a problem uploading the signature image.",
    });
  }

  if (err.message === "Only PNG and JPEG images are allowed.") {
    return res.status(400).json({ message: err.message });
  }

  res.status(500).json({
    message: "An unexpected server error occurred.",
  });
});

// Start server
async function startServer() {
  try {
    if (
      !process.env.JWT_SECRET ||
      process.env.JWT_SECRET.length < 32
    ) {
      throw new Error(
        "JWT_SECRET must contain at least 32 characters."
      );
    }

    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log("Authentication routes: /api/auth");
      console.log("Voucher routes: /api/vouchers");
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
