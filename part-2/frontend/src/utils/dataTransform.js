/**
 * Data transformation utilities
 * Converts between backend and frontend data formats
 */

/**
 * Transform backend messages to frontend format
 * Backend: messages: ["text1", "text2", "text3"]
 * Frontend: [{ bot: 'alice', text: 'text1' }, { bot: 'bob', text: 'text2' }, ...]
 * 
 * @param {string[]} messages - Array of message strings from backend
 * @returns {Array<{bot: string, text: string}>} - Array of message objects for frontend
 */
export const transformMessagesToFrontend = (messages) => {
  if (!Array.isArray(messages)) {
    console.warn('⚠️ Expected messages array, got:', typeof messages);
    return [];
  }

  return messages.map((text, index) => ({
    bot: index % 2 === 0 ? 'alice' : 'bob', // Alternate between alice and bob
    text: text,
  }));
};

/**
 * Transform frontend messages to backend format
 * Frontend: [{ bot: 'alice', text: 'text1' }, { bot: 'bob', text: 'text2' }]
 * Backend: messages: ["text1", "text2"]
 * 
 * @param {Array<{bot: string, text: string}>} messages - Array of message objects from frontend
 * @returns {string[]} - Array of message strings for backend
 */
export const transformMessagesToBackend = (messages) => {
  if (!Array.isArray(messages)) {
    console.warn('⚠️ Expected messages array, got:', typeof messages);
    return [];
  }

  return messages.map((msg) => msg.text);
};

/**
 * Create a new message object for the frontend
 * 
 * @param {string} bot - Bot identifier ('alice' or 'bob')
 * @param {string} text - Message text
 * @returns {{bot: string, text: string}} - Message object
 */
export const createMessage = (bot, text) => {
  return { bot, text };
};

/**
 * Get the next bot in the conversation (alternates between alice and bob)
 * 
 * @param {string} currentBot - Current bot ('alice' or 'bob')
 * @returns {string} - Next bot
 */
export const getNextBot = (currentBot) => {
  return currentBot === 'alice' ? 'bob' : 'alice';
};

/**
 * Get the bot based on message index
 * 
 * @param {number} index - Message index (0-based)
 * @returns {string} - Bot identifier ('alice' or 'bob')
 */
export const getBotByIndex = (index) => {
  return index % 2 === 0 ? 'alice' : 'bob';
};

