import { useState, useEffect, useRef } from 'react';
import './App.css';
import { conversation } from './mock/conversationData';
import api from './services/api';
import { transformMessagesToFrontend, createMessage, getNextBot } from './utils/dataTransform';

function App() {
  // UI State
  const [messages, setMessages] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [useBackend, setUseBackend] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Backend State
  const [conversationId, setConversationId] = useState(null);
  const [apiReady, setApiReady] = useState(false);

  // Check if API is configured on mount
  useEffect(() => {
    const ready = api.isReady();
    setApiReady(ready);
    if (!ready) {
      console.warn('⚠️ Backend mode disabled: API not configured');
      console.log('💡 To enable backend mode:');
      console.log('   1. Deploy your backend: cd backend && sam deploy');
      console.log('   2. Copy the API Gateway URL from outputs');
      console.log('   3. Update VITE_API_URL in .env file');
      console.log('   4. Restart dev server: npm run dev');
    } else {
      console.log('✅ Backend API configured:', api.getBaseURL());
    }
  }, []);

  // Mock data playback (original behavior)
  useEffect(() => {
    if (!isPlaying || useBackend) return;

    const timer = setInterval(() => {
      setMessages((prev) => {
        if (prev.length < conversation.length) {
          return [...prev, conversation[prev.length]];
        }
        setIsPlaying(false);
        return prev;
      });
    }, 2500);

    return () => clearInterval(timer);
  }, [isPlaying, useBackend]);

  // Backend conversation playback
  useEffect(() => {
    if (!isPlaying || !useBackend || !conversationId) return;

    const timer = setInterval(() => {
      generateNextMessage();
    }, 3000);

    return () => clearInterval(timer);
  }, [isPlaying, useBackend, conversationId, messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generate next AI message
  const generateNextMessage = async () => {
    if (loading) return;

    try {
      setLoading(true);
      
      // Determine who should speak next
      const lastBot = messages.length > 0 ? messages[messages.length - 1].bot : 'bob';
      const nextBot = getNextBot(lastBot);
      const nextMessage = `Hello, I'm ${nextBot}. This is message ${messages.length + 1}.`;

      console.log(`💬 Generating response for ${nextBot}...`);

      // Call backend to generate response
      const response = await api.generateResponse(nextMessage, conversationId);

      // Add the generated response to messages
      const newMessage = createMessage(nextBot, response.response);
      setMessages((prev) => [...prev, newMessage]);

      console.log('✅ Message generated:', newMessage);
    } catch (error) {
      console.error('❌ Failed to generate message:', error);
      setIsPlaying(false); // Stop on error
    } finally {
      setLoading(false);
    }
  };

  // Load existing conversation from backend
  const loadConversation = async (convId) => {
    try {
      setLoading(true);
      console.log(`📖 Loading conversation: ${convId}`);

      const data = await api.getConversationById(convId);
      
      if (data.messages) {
        const transformedMessages = transformMessagesToFrontend(data.messages);
        setMessages(transformedMessages);
        console.log(`✅ Loaded ${transformedMessages.length} messages`);
      }
    } catch (error) {
      console.error('❌ Failed to load conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  // Start a new backend conversation
  const startBackendConversation = async () => {
    try {
      setLoading(true);
      setMessages([]);
      console.log('🆕 Starting new backend conversation...');

      // Generate first message to create conversation
      const firstMessage = "Hi! I'm Alice, an AI assistant focused on creative problem-solving.";
      const response = await api.generateResponse(firstMessage, null);

      setConversationId(response.conversationId);
      setMessages([createMessage('alice', firstMessage)]);
      
      console.log('✅ Conversation created:', response.conversationId);
    } catch (error) {
      console.error('❌ Failed to start conversation:', error);
      // Fall back to mock mode
      setUseBackend(false);
    } finally {
      setLoading(false);
    }
  };

  // Toggle between mock and backend mode
  const toggleBackendMode = async () => {
    if (!apiReady) {
      console.warn('⚠️ Cannot enable backend mode: API not configured');
      alert('Backend not configured. Check console for setup instructions.');
      return;
    }

    const newMode = !useBackend;
    setUseBackend(newMode);
    setIsPlaying(false);
    
    if (newMode) {
      // Switching to backend mode
      await startBackendConversation();
      setIsPlaying(true);
    } else {
      // Switching to mock mode
      resetConversation();
    }
  };

  const resetConversation = () => {
    setMessages([]);
    setConversationId(null);
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>🤖 AI Conversation Simulator</h1>
        <p className="subtitle">Watch two AI personas discuss ideas</p>
        
        <div className="mode-toggle">
          <button 
            onClick={toggleBackendMode} 
            className={`mode-btn ${useBackend ? 'backend-mode' : 'mock-mode'}`}
            disabled={loading}
          >
            {useBackend ? '🌐 Backend Mode' : '🎭 Mock Mode'}
            {!apiReady && ' (Backend Not Configured)'}
          </button>
        </div>
      </header>

      <div className="personas-bar">
        <div className="persona alice-persona">
          <div className="avatar alice-avatar">A</div>
          <div className="persona-info">
            <h3>Alice</h3>
            <p>Creative Problem Solver</p>
          </div>
        </div>
        <div className="vs">VS</div>
        <div className="persona bob-persona">
          <div className="avatar bob-avatar">B</div>
          <div className="persona-info">
            <h3>Bob</h3>
            <p>Technical Architect</p>
          </div>
        </div>
      </div>

      <div className="chat-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.bot}-message`}>
            <div className="message-avatar">
              {msg.bot === 'alice' ? 'A' : 'B'}
            </div>
            <div className="message-content">
              <div className="message-header">
                {msg.bot === 'alice' ? 'Alice' : 'Bob'}
              </div>
              <div className="message-text">{msg.text}</div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="loading-message">
            <div className="spinner"></div>
            <span>Generating response...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="controls">
        <button 
          onClick={togglePlayPause} 
          className="control-btn"
          disabled={loading}
        >
          {isPlaying ? '⏸ Pause' : '▶ Resume'}
        </button>
        <button 
          onClick={resetConversation} 
          className="control-btn reset-btn"
          disabled={loading}
        >
          🔄 Reset
        </button>
      </div>

      <div className="stats">
        <span>
          Messages: {messages.length} {!useBackend && `/ ${conversation.length}`}
          {useBackend && conversationId && ` | ID: ${conversationId.substring(0, 8)}...`}
          {useBackend && ` | Mode: Backend`}
          {!useBackend && ` | Mode: Mock`}
        </span>
      </div>
    </div>
  );
}

export default App;
