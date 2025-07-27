const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

// Get all email configurations for a user
const getUserEmailConfigurations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [rows] = await pool.execute(
      `SELECT id, email_address, display_name, smtp_host, smtp_port, 
              smtp_username, smtp_security, is_outbound, is_active, 
              created_at, updated_at 
       FROM email_configurations 
       WHERE user_id = ? 
       ORDER BY is_outbound DESC, created_at ASC`,
      [userId]
    );
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching email configurations:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der E-Mail-Konfigurationen'
    });
  }
};

// Create a new email configuration
const createEmailConfiguration = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      email_address,
      display_name,
      smtp_host,
      smtp_port = 587,
      smtp_username,
      smtp_password,
      smtp_security = 'tls',
      is_outbound = false
    } = req.body;

    // Validate required fields
    if (!email_address || !smtp_host || !smtp_username || !smtp_password) {
      return res.status(400).json({
        success: false,
        message: 'E-Mail-Adresse, SMTP-Host, Benutzername und Passwort sind erforderlich'
      });
    }

    // Check if email already exists for this user
    const [existingEmail] = await pool.execute(
      'SELECT id FROM email_configurations WHERE user_id = ? AND email_address = ?',
      [userId, email_address]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Diese E-Mail-Adresse ist bereits konfiguriert'
      });
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // If this should be the outbound email, remove outbound flag from others
      if (is_outbound) {
        await connection.execute(
          'UPDATE email_configurations SET is_outbound = FALSE WHERE user_id = ?',
          [userId]
        );
      }

      // Encrypt the password
      const hashedPassword = await bcrypt.hash(smtp_password, 10);

      // Create new email configuration
      const configId = uuidv4();
      await connection.execute(
        `INSERT INTO email_configurations 
         (id, user_id, email_address, display_name, smtp_host, smtp_port, 
          smtp_username, smtp_password, smtp_security, is_outbound, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [configId, userId, email_address, display_name, smtp_host, smtp_port,
         smtp_username, hashedPassword, smtp_security, is_outbound, true]
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'E-Mail-Konfiguration erfolgreich erstellt',
        data: { id: configId }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating email configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erstellen der E-Mail-Konfiguration'
    });
  }
};

// Update an email configuration
const updateEmailConfiguration = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      email_address,
      display_name,
      smtp_host,
      smtp_port,
      smtp_username,
      smtp_password,
      smtp_security,
      is_outbound,
      is_active
    } = req.body;

    // Check if configuration exists and belongs to user
    const [existing] = await pool.execute(
      'SELECT id FROM email_configurations WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'E-Mail-Konfiguration nicht gefunden'
      });
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // If this should be the outbound email, remove outbound flag from others
      if (is_outbound) {
        await connection.execute(
          'UPDATE email_configurations SET is_outbound = FALSE WHERE user_id = ? AND id != ?',
          [userId, id]
        );
      }

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];

      if (email_address !== undefined) {
        updateFields.push('email_address = ?');
        updateValues.push(email_address);
      }
      if (display_name !== undefined) {
        updateFields.push('display_name = ?');
        updateValues.push(display_name);
      }
      if (smtp_host !== undefined) {
        updateFields.push('smtp_host = ?');
        updateValues.push(smtp_host);
      }
      if (smtp_port !== undefined) {
        updateFields.push('smtp_port = ?');
        updateValues.push(smtp_port);
      }
      if (smtp_username !== undefined) {
        updateFields.push('smtp_username = ?');
        updateValues.push(smtp_username);
      }
      if (smtp_password !== undefined) {
        updateFields.push('smtp_password = ?');
        const hashedPassword = await bcrypt.hash(smtp_password, 10);
        updateValues.push(hashedPassword);
      }
      if (smtp_security !== undefined) {
        updateFields.push('smtp_security = ?');
        updateValues.push(smtp_security);
      }
      if (is_outbound !== undefined) {
        updateFields.push('is_outbound = ?');
        updateValues.push(is_outbound);
      }
      if (is_active !== undefined) {
        updateFields.push('is_active = ?');
        updateValues.push(is_active);
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(id, userId);

        await connection.execute(
          `UPDATE email_configurations SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
          updateValues
        );
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'E-Mail-Konfiguration erfolgreich aktualisiert'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating email configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Aktualisieren der E-Mail-Konfiguration'
    });
  }
};

// Delete an email configuration
const deleteEmailConfiguration = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM email_configurations WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'E-Mail-Konfiguration nicht gefunden'
      });
    }

    res.json({
      success: true,
      message: 'E-Mail-Konfiguration erfolgreich gelöscht'
    });
  } catch (error) {
    console.error('Error deleting email configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Löschen der E-Mail-Konfiguration'
    });
  }
};

// Set outbound email (ensure only one is outbound)
const setOutboundEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if configuration exists and belongs to user
    const [existing] = await pool.execute(
      'SELECT id FROM email_configurations WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'E-Mail-Konfiguration nicht gefunden'
      });
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Remove outbound flag from all user's email configurations
      await connection.execute(
        'UPDATE email_configurations SET is_outbound = FALSE WHERE user_id = ?',
        [userId]
      );

      // Set the specified configuration as outbound
      await connection.execute(
        'UPDATE email_configurations SET is_outbound = TRUE WHERE id = ? AND user_id = ?',
        [id, userId]
      );

      await connection.commit();

      res.json({
        success: true,
        message: 'Ausgehende E-Mail-Konfiguration erfolgreich gesetzt'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error setting outbound email:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Setzen der ausgehenden E-Mail-Konfiguration'
    });
  }
};

// Get outbound email configuration for sending emails
const getOutboundEmailConfiguration = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [rows] = await pool.execute(
      `SELECT id, email_address, display_name, smtp_host, smtp_port, 
              smtp_username, smtp_password, smtp_security 
       FROM email_configurations 
       WHERE user_id = ? AND is_outbound = TRUE AND is_active = TRUE 
       LIMIT 1`,
      [userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Keine ausgehende E-Mail-Konfiguration gefunden'
      });
    }

    // Don't return the password in the response for security
    const config = { ...rows[0] };
    delete config.smtp_password;

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching outbound email configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der ausgehenden E-Mail-Konfiguration'
    });
  }
};

module.exports = {
  getUserEmailConfigurations,
  createEmailConfiguration,
  updateEmailConfiguration,
  deleteEmailConfiguration,
  setOutboundEmail,
  getOutboundEmailConfiguration
};