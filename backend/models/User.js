
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    employeeId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    department: {
      type: String,
      trim: true,
      default: ""
    },
    role: {
      type: String,
      enum: ["EMPLOYEE", "DIRECTOR", "ACCOUNTS"],
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
