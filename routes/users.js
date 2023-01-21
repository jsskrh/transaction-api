const express = require("express");
const router = express.Router();

const Users = require("../controllers/users");

const auth = require("../middleware/index");

router.post("/", Users.createUser);
router.post("/login", Users.loginUser);
router.get("/:username", auth, Users.getUser);

module.exports = router;
