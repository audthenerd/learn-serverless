/**
 * API Service for backend communication
 * Handles all HTTP requests to the serverless backend
 */

class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL;
    this.isConfigured = this.baseURL && !this.baseURL.includes('placeholder');
  }

  /**
   * Generic request handler with error logging
   */
  async request(endpoint, options = {}) {
    if (!this.isConfigured) {
      console.error('❌ API not configured. Update VITE_API_URL in .env file');
      throw new Error('API endpoint not configured');
    }

    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    console.log(`🚀 API Request: ${options.method || 'GET'} ${url}`);

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error (${response.status}):`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ API Response:', data);
      return data;
    } catch (error) {
      console.error('❌ API Request Failed:', error);
      throw error;
    }
  }

  /**
   * Get all conversation IDs
   * GET /conversations
   * Returns: { conversations: string[], count: number }
   */
  async getConversations() {
    return this.request('/conversations');
  }

  /**
   * Get a specific conversation by ID with all messages
   * GET /conversations/{id}
   * Returns: { conversation-id: string, messages: string[], timestamp: string, updatedAt: string }
   */
  async getConversationById(conversationId) {
    return this.request(`/conversations/${conversationId}`);
  }

  /**
   * Generate AI response for a conversation
   * POST /generateResponse
   * Body: { conversationId?: string, message: string }
   * Returns: { conversationId: string, response: string, timestamp: string }
   */
  async generateResponse(message, conversationId = null) {
    return this.request('/generateResponse', {
      method: 'POST',
      body: JSON.stringify({
        conversationId,
        message,
      }),
    });
  }

  /**
   * Summarize a conversation
   * POST /summarize
   * Body: { conversationId: string }
   * Returns: Summary data
   */
  async summarize(conversationId) {
    return this.request('/summarize', {
      method: 'POST',
      body: JSON.stringify({
        conversationId,
      }),
    });
  }

  /**
   * Check if API is properly configured
   */
  isReady() {
    return this.isConfigured;
  }

  /**
   * Get the configured API URL
   */
  getBaseURL() {
    return this.baseURL;
  }
}

// Export singleton instance
export default new ApiService();

