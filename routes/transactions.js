const express = require("express");
const router = express.Router();

const auth = require("../middleware/index");

const Transactions = require("../controllers/transactions");

router.post("/transfer", auth, Transactions.transfer);

module.exports = router;
