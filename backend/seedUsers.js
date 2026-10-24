
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const testUsers = [
      {
        name: "Demo Employee",
        employeeId: "EMP001",
        email: "employee@demo.com",
        password: "Employee@123",
        department: "IT",
        role: "EMPLOYEE"
      },
      {
        name: "Demo Director",
        email: "director@demo.com",
        password: "Director@123",
        department: "Management",
        role: "DIRECTOR"
      },
      {
        name: "Demo Accounts",
        email: "accounts@demo.com",
        password: "Accounts@123",
        department: "Accounts",
        role: "ACCOUNTS"
      }
    ];

    for (const data of testUsers) {
      const password = await bcrypt.hash(data.password, 12);

      await User.findOneAndUpdate(
        { email: data.email },
        { $set: { ...data, password } },
        { upsert: true, runValidators: true }
      );

      console.log(`Seeded: ${data.email}`);
    }
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedUsers();
