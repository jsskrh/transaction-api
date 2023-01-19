const express = require("express");
const router = express.Router();

const Users = require("../controllers/users");

const jwt = require("jsonwebtoken");

router.post("/", Users.createUser);

router.post("/login", Users.loginUser);

module.exports = router;
