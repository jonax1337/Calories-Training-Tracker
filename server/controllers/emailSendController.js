const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

// Mock email service to demonstrate outbound email functionality
// In a real implementation, you would use nodemailer or similar
const sendTestEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Empfänger, Betreff und Nachricht sind erforderlich'
      });
    }

    // Get the outbound email configuration
    const [outboundConfigs] = await pool.execute(
      `SELECT id, email_address, display_name, smtp_host, smtp_port, 
              smtp_username, smtp_password, smtp_security 
       FROM email_configurations 
       WHERE user_id = ? AND is_outbound = TRUE AND is_active = TRUE 
       LIMIT 1`,
      [userId]
    );

    if (outboundConfigs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Keine ausgehende E-Mail-Konfiguration gefunden. Bitte konfigurieren Sie zuerst ein ausgehendes E-Mail-Konto.'
      });
    }

    const config = outboundConfigs[0];

    // In a real implementation, you would decrypt the password and use it to send emails
    // For demonstration purposes, we'll just simulate sending
    console.log('Simulating email send with configuration:', {
      from: config.email_address,
      to,
      subject,
      smtp_host: config.smtp_host,
      smtp_port: config.smtp_port,
      smtp_security: config.smtp_security
    });

    // Simulate email sending (replace with actual nodemailer implementation)
    const emailResult = await simulateEmailSend({
      from: config.email_address,
      to,
      subject,
      text: message,
      config
    });

    if (emailResult.success) {
      res.json({
        success: true,
        message: 'E-Mail erfolgreich gesendet',
        data: {
          from: config.email_address,
          to,
          subject,
          sentAt: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'E-Mail konnte nicht gesendet werden: ' + emailResult.error
      });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Senden der E-Mail'
    });
  }
};

// Test SMTP connection for an email configuration
const testEmailConfiguration = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Get the email configuration
    const [configs] = await pool.execute(
      `SELECT id, email_address, smtp_host, smtp_port, 
              smtp_username, smtp_password, smtp_security 
       FROM email_configurations 
       WHERE id = ? AND user_id = ? AND is_active = TRUE 
       LIMIT 1`,
      [id, userId]
    );

    if (configs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'E-Mail-Konfiguration nicht gefunden'
      });
    }

    const config = configs[0];

    // Simulate connection test (replace with actual SMTP connection test)
    const testResult = await simulateConnectionTest(config);

    if (testResult.success) {
      res.json({
        success: true,
        message: 'SMTP-Verbindung erfolgreich getestet',
        data: {
          smtp_host: config.smtp_host,
          smtp_port: config.smtp_port,
          smtp_security: config.smtp_security,
          response_time: testResult.responseTime
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'SMTP-Verbindungstest fehlgeschlagen: ' + testResult.error
      });
    }
  } catch (error) {
    console.error('Error testing email configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Testen der E-Mail-Konfiguration'
    });
  }
};

// Simulate email sending (replace with real implementation)
async function simulateEmailSend({ from, to, subject, text, config }) {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      // Simulate success/failure based on configuration
      const success = Math.random() > 0.1; // 90% success rate for demo
      
      if (success) {
        resolve({
          success: true,
          messageId: 'demo-' + Date.now()
        });
      } else {
        resolve({
          success: false,
          error: 'Simulierter Netzwerkfehler'
        });
      }
    }, 1000 + Math.random() * 2000); // 1-3 second delay
  });
}

// Simulate SMTP connection test (replace with real implementation)
async function simulateConnectionTest(config) {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      // Simulate success/failure based on configuration
      const success = Math.random() > 0.2; // 80% success rate for demo
      
      if (success) {
        resolve({
          success: true,
          responseTime: Math.round(100 + Math.random() * 500) // 100-600ms
        });
      } else {
        resolve({
          success: false,
          error: 'Verbindung zum SMTP-Server fehlgeschlagen'
        });
      }
    }, 500 + Math.random() * 1500); // 0.5-2 second delay
  });
}

module.exports = {
  sendTestEmail,
  testEmailConfiguration
};