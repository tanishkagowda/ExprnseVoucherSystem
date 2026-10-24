
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const Voucher = require("../models/Voucher");
const Counter = require("../models/Counter");
const User = require("../models/User");

const {
  authenticateToken,
  authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

// ======================================================
// UPLOAD DIRECTORY AND MULTER CONFIGURATION
// ======================================================

const uploadDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const filename = `${Date.now()}-${crypto.randomUUID()}${extension}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/png", "image/jpeg"];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only PNG and JPEG signature images are allowed."));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024
  }
});

// Every route in this file requires authentication.
router.use(authenticateToken);

// ======================================================
// VALIDATION HELPERS
// ======================================================

function validateVoucher(data) {
  const {
    department,
    expenseTitle,
    expenseDate,
    category,
    amount
  } = data;

  if (
    !department ||
    !String(department).trim() ||
    !expenseTitle ||
    !String(expenseTitle).trim() ||
    !expenseDate ||
    !category ||
    !String(category).trim() ||
    amount === undefined ||
    amount === null ||
    String(amount).trim() === ""
  ) {
    return "Department, expense title, expense date, category and amount are required.";
  }

  const parsedAmount = Number(amount);

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return "Amount must be a number greater than zero.";
  }

  const parsedDate = new Date(expenseDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Please provide a valid expense date.";
  }

  return null;
}

function voucherInput(body) {
  return {
    department: String(body.department || "").trim(),
    expenseTitle: String(body.expenseTitle || "").trim(),
    expenseDate: body.expenseDate,
    category: String(body.category || "").trim(),
    description: String(body.description || "").trim(),
    amount: Number(body.amount)
  };
}

function isValidObjectId(id) {
  return /^[a-f\d]{24}$/i.test(id);
}

// ======================================================
// GENERATE UNIQUE VOUCHER NUMBER
// Format: EV-2026-0001
// ======================================================

async function generateVoucherNumber() {
  const year = new Date().getFullYear();

  const counter = await Counter.findOneAndUpdate(
    { _id: `voucher-${year}` },
    { $inc: { sequence: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );

  return `EV-${year}-${String(counter.sequence).padStart(4, "0")}`;
}

// ======================================================
// CREATE VOUCHER - EMPLOYEE
// POST /api/vouchers
// ======================================================

router.post(
  "/",
  authorizeRoles("EMPLOYEE"),
  async (req, res) => {
    try {
      const data = voucherInput(req.body);
      const validationError = validateVoucher(data);

      if (validationError) {
        return res.status(400).json({
          message: validationError
        });
      }

      const voucherNumber = await generateVoucherNumber();

      const voucher = await Voucher.create({
        ...data,
        voucherNumber,
        employee: req.user.id,
        status: "DRAFT"
      });

      const populatedVoucher = await Voucher.findById(voucher._id)
        .populate("employee", "name employeeId email department");

      return res.status(201).json({
        message: "Voucher saved as draft.",
        voucher: populatedVoucher
      });
    } catch (error) {
      console.error("Create voucher error:", error.message);

      return res.status(500).json({
        message: "Unable to create voucher."
      });
    }
  }
);

// ======================================================
// GET VOUCHERS WITH SEARCH, FILTERS AND SORTING
// GET /api/vouchers
// ======================================================

router.get(
  "/",
  authorizeRoles("EMPLOYEE", "DIRECTOR", "ACCOUNTS"),
  async (req, res) => {
    try {
      const {
        status,
        department,
        category,
        search,
        from,
        to,
        minAmount,
        maxAmount,
        sort
      } = req.query;

      const filter = {};

      // Employees can only access their own vouchers.
      if (req.user.role === "EMPLOYEE") {
        filter.employee = req.user.id;
      }

      if (status) {
        const allowedStatuses = [
          "DRAFT",
          "PENDING_APPROVAL",
          "APPROVED",
          "REJECTED"
        ];

        if (!allowedStatuses.includes(status)) {
          return res.status(400).json({
            message: "Invalid voucher status."
          });
        }

        filter.status = status;
      }

      if (department) {
        filter.department = {
          $regex: String(department).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          $options: "i"
        };
      }

      if (category) {
        filter.category = {
          $regex: String(category).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          $options: "i"
        };
      }

      // Expense date range.
      if (from || to) {
        filter.expenseDate = {};

        if (from) {
          const fromDate = new Date(from);

          if (Number.isNaN(fromDate.getTime())) {
            return res.status(400).json({
              message: "Invalid start date."
            });
          }

          fromDate.setHours(0, 0, 0, 0);
          filter.expenseDate.$gte = fromDate;
        }

        if (to) {
          const toDate = new Date(to);

          if (Number.isNaN(toDate.getTime())) {
            return res.status(400).json({
              message: "Invalid end date."
            });
          }

          toDate.setHours(23, 59, 59, 999);
          filter.expenseDate.$lte = toDate;
        }

        if (
          filter.expenseDate.$gte &&
          filter.expenseDate.$lte &&
          filter.expenseDate.$gte > filter.expenseDate.$lte
        ) {
          return res.status(400).json({
            message: "Start date cannot be after end date."
          });
        }
      }

      // Amount range.
      if (minAmount !== undefined || maxAmount !== undefined) {
        filter.amount = {};

        if (minAmount !== undefined && minAmount !== "") {
          const min = Number(minAmount);

          if (!Number.isFinite(min) || min < 0) {
            return res.status(400).json({
              message: "Minimum amount must be zero or greater."
            });
          }

          filter.amount.$gte = min;
        }

        if (maxAmount !== undefined && maxAmount !== "") {
          const max = Number(maxAmount);

          if (!Number.isFinite(max) || max < 0) {
            return res.status(400).json({
              message: "Maximum amount must be zero or greater."
            });
          }

          filter.amount.$lte = max;
        }

        if (
          filter.amount.$gte !== undefined &&
          filter.amount.$lte !== undefined &&
          filter.amount.$gte > filter.amount.$lte
        ) {
          return res.status(400).json({
            message: "Minimum amount cannot exceed maximum amount."
          });
        }
      }

      // Search voucher number, title, department, category and employee name.
      if (search && String(search).trim()) {
        const escapedSearch = String(search)
          .trim()
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        const regex = new RegExp(escapedSearch, "i");

        const matchingUsers = await User.find({
          $or: [
            { name: regex },
            { employeeId: regex },
            { email: regex }
          ]
        }).select("_id");

        const matchingEmployeeIds = matchingUsers.map((user) => user._id);

        const searchConditions = [
          { voucherNumber: regex },
          { expenseTitle: regex },
          { department: regex },
          { category: regex },
          { description: regex }
        ];

        if (matchingEmployeeIds.length > 0) {
          searchConditions.push({
            employee: { $in: matchingEmployeeIds }
          });
        }

        filter.$or = searchConditions;
      }

      let sortOption = { createdAt: -1 };

      if (sort === "oldest") {
        sortOption = { createdAt: 1 };
      } else if (sort === "amount") {
        sortOption = { amount: -1, createdAt: -1 };
      } else if (sort === "date") {
        sortOption = { expenseDate: -1, createdAt: -1 };
      }

      const vouchers = await Voucher.find(filter)
        .populate("employee", "name employeeId email department")
        .populate("reviewedBy", "name email role")
        .sort(sortOption)
        .lean();

      return res.json({
        count: vouchers.length,
        vouchers
      });
    } catch (error) {
      console.error("Get vouchers error:", error.message);

      return res.status(500).json({
        message: "Unable to retrieve vouchers."
      });
    }
  }
);

// ======================================================
// GET ONE VOUCHER
// GET /api/vouchers/:id
// ======================================================

router.get(
  "/:id",
  authorizeRoles("EMPLOYEE", "DIRECTOR", "ACCOUNTS"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid voucher ID."
        });
      }

      const voucher = await Voucher.findById(id)
        .populate("employee", "name employeeId email department")
        .populate("reviewedBy", "name email role");

      if (!voucher) {
        return res.status(404).json({
          message: "Voucher not found."
        });
      }

      if (
        req.user.role === "EMPLOYEE" &&
        voucher.employee._id.toString() !== req.user.id
      ) {
        return res.status(403).json({
          message: "You cannot access this voucher."
        });
      }

      return res.json({ voucher });
    } catch (error) {
      console.error("Get voucher error:", error.message);

      return res.status(500).json({
        message: "Unable to retrieve voucher."
      });
    }
  }
);

// ======================================================
// SECURE SIGNATURE RETRIEVAL
// GET /api/vouchers/:id/signature/:kind
// kind = employee or director
// ======================================================

router.get(
  "/:id/signature/:kind",
  authorizeRoles("EMPLOYEE", "DIRECTOR", "ACCOUNTS"),
  async (req, res) => {
    try {
      const { id, kind } = req.params;

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid voucher ID."
        });
      }

      if (!["employee", "director"].includes(kind)) {
        return res.status(400).json({
          message: "Invalid signature type."
        });
      }

      const voucher = await Voucher.findById(id);

      if (!voucher) {
        return res.status(404).json({
          message: "Voucher not found."
        });
      }

      // Employees can only access signatures on their own vouchers.
      if (
        req.user.role === "EMPLOYEE" &&
        voucher.employee.toString() !== req.user.id
      ) {
        return res.status(403).json({
          message: "You cannot access this voucher."
        });
      }

      const signaturePath =
        kind === "employee"
          ? voucher.employeeSignature
          : voucher.directorSignature;

      if (!signaturePath) {
        return res.status(404).json({
          message: "Signature has not been uploaded."
        });
      }

      // Use only the stored filename, not a requested filesystem path.
      const filename = path.basename(signaturePath);
      const fullPath = path.join(uploadDir, filename);

      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({
          message: "Signature file not found."
        });
      }

      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");

      return res.sendFile(fullPath);
    } catch (error) {
      console.error("Signature retrieval error:", error.message);

      return res.status(500).json({
        message: "Unable to retrieve signature."
      });
    }
  }
);

// ======================================================
// UPDATE DRAFT VOUCHER - EMPLOYEE
// PUT /api/vouchers/:id
// ======================================================

router.put(
  "/:id",
  authorizeRoles("EMPLOYEE"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid voucher ID."
        });
      }

      const voucher = await Voucher.findById(id);

      if (!voucher) {
        return res.status(404).json({
          message: "Voucher not found."
        });
      }

      if (voucher.employee.toString() !== req.user.id) {
        return res.status(403).json({
          message: "You cannot edit another employee's voucher."
        });
      }

      if (voucher.status !== "DRAFT") {
        return res.status(400).json({
          message: "Only draft vouchers can be edited."
        });
      }

      const data = voucherInput(req.body);
      const validationError = validateVoucher(data);

      if (validationError) {
        return res.status(400).json({
          message: validationError
        });
      }

      Object.assign(voucher, data);
      await voucher.save();

      return res.json({
        message: "Draft voucher updated successfully.",
        voucher
      });
    } catch (error) {
      console.error("Update voucher error:", error.message);

      return res.status(500).json({
        message: "Unable to update voucher."
      });
    }
  }
);

// ======================================================
// DELETE DRAFT VOUCHER - EMPLOYEE
// DELETE /api/vouchers/:id
// ======================================================

router.delete(
  "/:id",
  authorizeRoles("EMPLOYEE"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid voucher ID."
        });
      }

      const voucher = await Voucher.findById(id);

      if (!voucher) {
        return res.status(404).json({
          message: "Voucher not found."
        });
      }

      if (voucher.employee.toString() !== req.user.id) {
        return res.status(403).json({
          message: "You cannot delete another employee's voucher."
        });
      }

      if (voucher.status !== "DRAFT") {
        return res.status(400).json({
          message: "Only draft vouchers can be deleted."
        });
      }

      // Remove the associated employee signature file, if present.
      if (voucher.employeeSignature) {
        const filename = path.basename(voucher.employeeSignature);
        const fullPath = path.join(uploadDir, filename);

        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      await voucher.deleteOne();

      return res.json({
        message: "Draft voucher deleted successfully."
      });
    } catch (error) {
      console.error("Delete voucher error:", error.message);

      return res.status(500).json({
        message: "Unable to delete voucher."
      });
    }
  }
);

// ======================================================
// UPLOAD EMPLOYEE SIGNATURE
// PATCH /api/vouchers/:id/employee-signature
// ======================================================

router.patch(
  "/:id/employee-signature",
  authorizeRoles("EMPLOYEE"),
  (req, res, next) => {
    upload.single("signature")(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          message: error.message
        });
      }

      next();
    });
  },
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid voucher ID."
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "Please upload a PNG or JPEG signature image."
        });
      }

      const voucher = await Voucher.findById(id);

      if (!voucher) {
        fs.unlinkSync(req.file.path);

        return res.status(404).json({
          message: "Voucher not found."
        });
      }

      if (voucher.employee.toString() !== req.user.id) {
        fs.unlinkSync(req.file.path);

        return res.status(403).json({
          message: "You cannot sign another employee's voucher."
        });
      }

      if (voucher.status !== "DRAFT") {
        fs.unlinkSync(req.file.path);

        return res.status(400).json({
          message: "Only draft vouchers can receive an employee signature."
        });
      }

      // Remove the old signature file after a replacement is uploaded.
      if (voucher.employeeSignature) {
        const oldFilename = path.basename(voucher.employeeSignature);
        const oldPath = path.join(uploadDir, oldFilename);

        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      voucher.employeeSignature = `/uploads/${req.file.filename}`;
      await voucher.save();

      return res.json({
        message: "Employee signature uploaded successfully.",
        voucher
      });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      console.error("Employee signature upload error:", error.message);

      return res.status(500).json({
        message: "Unable to upload employee signature."
      });
    }
  }
);

// ======================================================
// SUBMIT VOUCHER FOR APPROVAL
// PATCH /api/vouchers/:id/submit
// ======================================================

router.patch(
  "/:id/submit",
  authorizeRoles("EMPLOYEE"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid voucher ID."
        });
      }

      const voucher = await Voucher.findById(id);

      if (!voucher) {
        return res.status(404).json({
          message: "Voucher not found."
        });
      }

      if (voucher.employee.toString() !== req.user.id) {
        return res.status(403).json({
          message: "You cannot submit another employee's voucher."
        });
      }

      if (voucher.status !== "DRAFT") {
        return res.status(400).json({
          message: "Only draft vouchers can be submitted."
        });
      }

      const validationError = validateVoucher(voucher);

      if (validationError) {
        return res.status(400).json({
          message: validationError
        });
      }

      if (!voucher.employeeSignature) {
        return res.status(400).json({
          message: "Employee signature is required before submission."
        });
      }

      voucher.status = "PENDING_APPROVAL";
      await voucher.save();

      return res.json({
        message: "Voucher submitted for approval.",
        voucher
      });
    } catch (error) {
      console.error("Submit voucher error:", error.message);

      return res.status(500).json({
        message: "Unable to submit voucher."
      });
    }
  }
);

// ======================================================
// DIRECTOR APPROVAL WITH SIGNATURE
// PATCH /api/vouchers/:id/approve
// ======================================================

router.patch(
  "/:id/approve",
  authorizeRoles("DIRECTOR"),
  (req, res, next) => {
    upload.single("signature")(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          message: error.message
        });
      }

      next();
    });
  },
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        if (req.file) fs.unlinkSync(req.file.path);

        return res.status(400).json({
          message: "Invalid voucher ID."
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "Director signature is required for approval."
        });
      }

      const voucher = await Voucher.findById(id);

      if (!voucher) {
        fs.unlinkSync(req.file.path);

        return res.status(404).json({
          message: "Voucher not found."
        });
      }

      if (voucher.status !== "PENDING_APPROVAL") {
        fs.unlinkSync(req.file.path);

        return res.status(400).json({
          message: "Only pending vouchers can be approved."
        });
      }

      voucher.directorSignature = `/uploads/${req.file.filename}`;
      voucher.status = "APPROVED";
      voucher.approvalDate = new Date();
      voucher.reviewedBy = req.user.id;

      await voucher.save();

      return res.json({
        message: "Voucher approved successfully.",
        voucher
      });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      console.error("Approve voucher error:", error.message);

      return res.status(500).json({
        message: "Unable to approve voucher."
      });
    }
  }
);

// ======================================================
// DIRECTOR REJECTION WITH REQUIRED REASON
// PATCH /api/vouchers/:id/reject
// ======================================================

router.patch(
  "/:id/reject",
  authorizeRoles("DIRECTOR"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const reason =
        typeof req.body.reason === "string"
          ? req.body.reason.trim()
          : "";

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid voucher ID."
        });
      }

      if (!reason) {
        return res.status(400).json({
          message: "A rejection reason is required."
        });
      }

      const voucher = await Voucher.findById(id);

      if (!voucher) {
        return res.status(404).json({
          message: "Voucher not found."
        });
      }

      if (voucher.status !== "PENDING_APPROVAL") {
        return res.status(400).json({
          message: "Only pending vouchers can be rejected."
        });
      }

      voucher.status = "REJECTED";
      voucher.rejectionReason = reason;
      voucher.reviewedBy = req.user.id;

      await voucher.save();

      return res.json({
        message: "Voucher rejected successfully.",
        voucher
      });
    } catch (error) {
      console.error("Reject voucher error:", error.message);

      return res.status(500).json({
        message: "Unable to reject voucher."
      });
    }
  }
);

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;
