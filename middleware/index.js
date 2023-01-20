const jwt = require("jsonwebtoken");

function authToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  const token =
    req.body.token ||
    req.query.token ||
    req.headers["x-access-token"] ||
    authHeader.split(" ")[1];

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    const user = jwt.verify(token, process.env.ACCESS_TOKEN);
    req.user = user;
  } catch (err) {
    return res.status(401).send("Invalid Token");
  }
  return next();
}

module.exports = authToken;
