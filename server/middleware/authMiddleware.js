const jwt = require('jsonwebtoken');

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const TOKEN_EXPIRE = process.env.TOKEN_EXPIRE || '365d'; // Dieselbe Lebensdauer wie im authController

// Authentication middleware
const authenticate = (req, res, next) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required. Invalid token format.' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add user data to request
    req.user = decoded;
    
    // Pru00fcfen, ob das Token bald abläuft (weniger als 7 Tage Restgu00fcltigkeit)
    // In diesem Fall senden wir ein frisches Token zuru00fcck
    const tokenExp = decoded.exp;
    const currentTime = Math.floor(Date.now() / 1000);
    const sevenDaysInSeconds = 7 * 24 * 60 * 60; // 7 Tage in Sekunden
    
    // Wenn das Token in weniger als 7 Tagen abläuft, erstellen wir ein neues
    if (tokenExp - currentTime < sevenDaysInSeconds) {
      // Erstelle ein neues Token mit neuer Ablaufzeit
      const newToken = jwt.sign(
        { userId: decoded.userId, email: decoded.email },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRE }
      );
      
      // Setze das neue Token in einem Header, damit der Client es speichern kann
      res.setHeader('X-Refresh-Token', newToken);
      res.setHeader('Access-Control-Expose-Headers', 'X-Refresh-Token');
      
      console.log('Token refreshed for user:', decoded.userId);
    }
    
    // Continue to next middleware/route handler
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    res.status(401).json({ 
      message: 'Authentication failed. Invalid token.',
      code: error.name || 'INVALID_TOKEN'
    });
  }
};

module.exports = { authenticate };
