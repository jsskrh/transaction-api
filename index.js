const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const userRoutes = require("./routes/users");
const transactionRoutes = require("./routes/transactions");
dotenv.config();

const app = express();
app.use(express.json());

const uri =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/transaction_api";

mongoose.set("strictQuery", false);
mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successfully connected to Database.");
  })
  .catch((err) => {
    console.log("Unable to connect to Database.", err);
  });

app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
