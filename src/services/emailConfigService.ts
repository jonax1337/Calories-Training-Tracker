import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';

export interface EmailConfiguration {
  id: string;
  email_address: string;
  display_name?: string;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_security: 'none' | 'ssl' | 'tls';
  is_outbound: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateEmailConfigurationRequest {
  email_address: string;
  display_name?: string;
  smtp_host: string;
  smtp_port?: number;
  smtp_username: string;
  smtp_password: string;
  smtp_security?: 'none' | 'ssl' | 'tls';
  is_outbound?: boolean;
}

export interface UpdateEmailConfigurationRequest {
  email_address?: string;
  display_name?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  smtp_security?: 'none' | 'ssl' | 'tls';
  is_outbound?: boolean;
  is_active?: boolean;
}

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Get all email configurations for the current user
export const getUserEmailConfigurations = async (): Promise<EmailConfiguration[]> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/api/email-config`, { headers });
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Fehler beim Laden der E-Mail-Konfigurationen');
    }
  } catch (error) {
    console.error('Error fetching email configurations:', error);
    throw error;
  }
};

// Create a new email configuration
export const createEmailConfiguration = async (data: CreateEmailConfigurationRequest): Promise<{ id: string }> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/api/email-config`, data, { headers });
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Fehler beim Erstellen der E-Mail-Konfiguration');
    }
  } catch (error) {
    console.error('Error creating email configuration:', error);
    throw error;
  }
};

// Update an email configuration
export const updateEmailConfiguration = async (id: string, data: UpdateEmailConfigurationRequest): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.put(`${API_BASE_URL}/api/email-config/${id}`, data, { headers });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Fehler beim Aktualisieren der E-Mail-Konfiguration');
    }
  } catch (error) {
    console.error('Error updating email configuration:', error);
    throw error;
  }
};

// Delete an email configuration
export const deleteEmailConfiguration = async (id: string): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.delete(`${API_BASE_URL}/api/email-config/${id}`, { headers });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Fehler beim Löschen der E-Mail-Konfiguration');
    }
  } catch (error) {
    console.error('Error deleting email configuration:', error);
    throw error;
  }
};

// Set an email configuration as outbound
export const setOutboundEmail = async (id: string): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.put(`${API_BASE_URL}/api/email-config/${id}/outbound`, {}, { headers });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Fehler beim Setzen der ausgehenden E-Mail-Konfiguration');
    }
  } catch (error) {
    console.error('Error setting outbound email:', error);
    throw error;
  }
};

// Get the current outbound email configuration
export const getOutboundEmailConfiguration = async (): Promise<EmailConfiguration> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/api/email-config/outbound`, { headers });
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Keine ausgehende E-Mail-Konfiguration gefunden');
    }
  } catch (error) {
    console.error('Error fetching outbound email configuration:', error);
    throw error;
  }
};

// Send a test email using the outbound configuration
export const sendTestEmail = async (to: string, subject: string, message: string): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/api/email-config/send-test`, {
      to,
      subject,
      message
    }, { headers });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Fehler beim Senden der Test-E-Mail');
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    throw error;
  }
};

// Test SMTP connection for a specific email configuration
export const testEmailConfiguration = async (configId: string): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/api/email-config/${configId}/test`, { headers });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Fehler beim Testen der E-Mail-Konfiguration');
    }
  } catch (error) {
    console.error('Error testing email configuration:', error);
    throw error;
  }
};