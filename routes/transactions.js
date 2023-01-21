const express = require("express");
const router = express.Router();

const Transactions = require("../controllers/transactions");
const authToken = require("../middleware/index");

router.post("/transfer", authToken, Transactions.transfer);
router.post("/deposit", authToken, Transactions.deposit);
router.post("/withdraw", authToken, Transactions.withdraw);

module.exports = router;
