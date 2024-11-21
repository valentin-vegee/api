const jwt = require("jsonwebtoken");
const config = require("../config/key.js");
const User = require("../models/user.js");

// Middleware pour vérifier le token
const validateToken = (req, res, next) => {
  const authToken = req.headers["x-access-token"];

  if (!authToken) {
    return res.status(403).json({ message: "Token non fourni !" });
  }

  jwt.verify(authToken, config.secret, (error, payload) => {
    if (error) {
      return res.status(401).json({
        message: "Accès non autorisé !",
      });
    }
    req.userId = payload.id;
    next();
  });
};

// Middleware pour vérifier l'existence de l'utilisateur
const checkUserExistence = async (req, res, next) => {
  try {
    const existingUser = await User.findById(req.userId);
    if (!existingUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la vérification de l'utilisateur" });
  }
};

// Middleware pour vérifier le rôle de l'utilisateur
const enforceRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur introuvable" });
      }
      if (user.role !== requiredRole) {
        return res.status(403).json({ message: "Accès interdit : droits insuffisants" });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la vérification des droits" });
    }
  };
};

// Export des middlewares
const authMiddleware = {
  validateToken,
  checkUserExistence,
  enforceRole,
};

module.exports = authMiddleware;
