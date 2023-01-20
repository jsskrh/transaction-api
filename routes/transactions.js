const express = require("express");
const router = express.Router();

const auth = require("../middleware/index");

const Transactions = require("../controllers/transactions");

router.post("/transfer", auth, Transactions.transfer);
router.post("/deposit", auth, Transactions.deposit);

module.exports = router;