
const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema(
  {
    voucherNumber: {
      type: String,
      unique: true,
      index: true
    },
    voucherDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    expenseDate: {
      type: Date,
      required: true
    },
    department: {
      type: String,
      required: true,
      trim: true
    },
    expenseTitle: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    employeeSignature: {
      type: String,
      default: null
    },
    directorSignature: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED"],
      default: "DRAFT",
      index: true
    },
    approvalDate: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Voucher", voucherSchema);
