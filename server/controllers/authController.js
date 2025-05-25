const { pool } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const TOKEN_EXPIRE = process.env.TOKEN_EXPIRE || '365d'; // Token ist jetzt 1 Jahr gu00fcltig statt 7 Tage
const SALT_ROUNDS = 10;

// Check if an email already exists
exports.checkEmailExists = async (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({ message: 'Email parameter is required' });
  }
  
  try {
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    return res.status(200).json({ exists: existingUsers.length > 0 });
  } catch (error) {
    console.error('Error checking email:', error);
    return res.status(500).json({ message: 'Server error when checking email' });
  }
};

// Register a new user
exports.register = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { email, password, name, birthDate } = req.body;
    
    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, password and name are required' });
    }
    
    // Check if email already exists
    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Create user ID
    const userId = uuidv4();
    
    // Insert user with minimal required fields
    await connection.query(
      `INSERT INTO users (
        id, email, password_hash, name, birth_date
      ) VALUES (?, ?, ?, ?, ?)`,
      [userId, email, passwordHash, name, birthDate]
    );
    
    // Generate JWT token
    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRE });
    
    await connection.commit();
    
    // Return success with token and user info
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        email,
        name,
        birthDate
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find user by email
    const [users] = await pool.query(
      'SELECT id, email, name, password_hash, birth_date FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const user = users[0];
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRE }
    );
    
    // Return success with token and user info
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        birthDate: user.birth_date
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get current user profile
exports.getCurrentUser = async (req, res) => {
  try {
    // User ID would be added to the request by the auth middleware
    const userId = req.user.userId;
    
    const [users] = await pool.query(
      'SELECT id, email, name, birth_date FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = users[0];
    
    res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      birthDate: user.birth_date
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
