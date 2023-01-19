const Users = require("../models/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const createUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const userExists = await Users.findOne({ username });
    if (userExists) {
      return res.status(409).json({
        status: false,
        message: "User already exists",
      });
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    const result = await Users.create({ username, password: hashedPassword });
    console.log(result);
    return res.status(201).json({
      status: true,
      message: "Users created successfully",
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      status: true,
      message: `Unable to create user. Please try again. \n Error: ${err}`,
    });
  }
};

const loginUser = async (req, res) => {
  const user = await Users.findOne({ username: req.body.username });
  if (user == null) {
    return res.status(400).send("User does not exist.");
  }
  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      const accessToken = jwt.sign(
        { username: user.username },
        process.env.ACCESS_TOKEN
      );
      user.token = accessToken;
      res.status(200).send(user);
    } else {
      res.status(400).send("Invalid Credentials");
    }
  } catch (error) {
    res.status(500).send(error);
  }
};

module.exports = { createUser, loginUser };
