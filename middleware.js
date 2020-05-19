const jwt = require('jsonwebtoken');

const authenticateToken = function(req, res, next) {

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]

  if(token == null) return res.status(401).send('Unauthorized: No token provided');

  jwt.verify(token, process.env.JWT_SECRET, function(err, user) {

    if (err || !user) {
      res.status(401).send('Unauthorized: Invalid token');
    } 

    if(!user) {
      res.status(403).send('Expired');
    } else if(user.iss !== process.env.JWT_ISSUER) {
      res.status(403).send('Wrong');
    }

    req.email = user.email;
    next();
    
  });

  }

module.exports = authenticateToken;