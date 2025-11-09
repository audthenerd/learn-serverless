import { useState, useEffect, useRef } from 'react';
import './App.css';
import { conversation } from './mock/conversationData';
import api from './services/api';
import { createMessage } from './utils/dataTransform';

function App() {
  // UI State
  const [messages, setMessages] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [useBackend, setUseBackend] = useState(true);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Backend State
  const [conversationId, setConversationId] = useState(null);
  const [apiReady, setApiReady] = useState(false);

  // Topic Input State
  const [topic, setTopic] = useState('');
  const [debateSummary, setDebateSummary] = useState(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Determine whose turn it is
      // If no messages yet, it's the responder's turn (since initiator created the conversation)
      // Otherwise, alternate between initiator and responder
      const lastMessage =
        messages.length > 0 ? messages[messages.length - 1] : null;
      let turn, botName;

      if (!lastMessage) {
        // First response after creation
        turn = 'responder';
        botName = 'bob';
      } else {
        // Alternate turns
        if (lastMessage.bot === 'alice') {
          turn = 'responder';
          botName = 'bob';
        } else {
          turn = 'initiator';
          botName = 'alice';
        }
      }

      console.log(`💬 Generating response for ${botName} (${turn})...`);

      // Call backend to generate response
      const response = await api.generateResponse(conversationId, turn);

      // Response format: { from: 'initiator' | 'responder', message: string }
      // Transform to frontend format
      const transformedMessage = createMessage(
        turn === 'initiator' ? 'alice' : 'bob',
        response.message
      );

      setMessages((prev) => [...prev, transformedMessage]);

      console.log('✅ Message generated:', transformedMessage);
    } catch (error) {
      console.error('❌ Failed to generate message:', error);
      setIsPlaying(false); // Stop on error
    } finally {
      setLoading(false);
    }
  };

  // Start a debate with a custom topic
  const startDebateWithTopic = async () => {
    if (!topic.trim()) {
      alert('Please enter a debate topic');
      return;
    }

    try {
      setLoading(true);
      setMessages([]);
      setDebateSummary(null);
      console.log(`🎯 Starting debate with topic: "${topic}"`);

      // Create conversation with topic (this creates first message from initiator/Alice)
      const response = await api.createConversation(topic);
      setConversationId(response.conversationId);

      console.log('✅ Debate conversation created:', response.conversationId);

      // Add the initial message (topic from Alice/initiator)
      const initialMessage = createMessage('alice', topic);
      setMessages([initialMessage]);

      // Start generating debate responses (Bob will respond first)
      setIsPlaying(true);
    } catch (error) {
      console.error('❌ Failed to start debate:', error);
      alert('Failed to start debate. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Summarize the current debate
  const summarizeDebate = async () => {
    if (!conversationId) {
      console.warn('⚠️ No conversation to summarize');
      return;
    }

    try {
      setLoading(true);
      console.log('📝 Summarizing debate...');

      const response = await api.summarize(conversationId);
      setDebateSummary(response.summary || response);

      console.log('✅ Debate summarized:', response);
    } catch (error) {
      console.error('❌ Failed to summarize debate:', error);
      alert('Failed to summarize debate. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle between mock and backend mode
  const toggleBackendMode = async () => {
    const newMode = !useBackend;
    setUseBackend(newMode);
    setIsPlaying(false);

    if (!newMode) {
      // Switching to mock mode
      resetConversation();
      setTopic('');
      setDebateSummary(null);
    } else {
      // Switching to backend mode
      resetConversation();
    }
  };

  const resetConversation = () => {
    setMessages([]);
    setConversationId(null);
    setIsPlaying(false);
    setDebateSummary(null);
    if (useBackend) {
      setTopic('');
    }
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

      {/* Topic Input Section */}
      {useBackend && !conversationId && (
        <div className="topic-input-section">
          <h2>🎯 Start a Debate</h2>
          <p>Enter a topic for Alice and Bob to debate:</p>
          <div className="topic-input-container">
            <input
              type="text"
              className="topic-input-field"
              placeholder="e.g., Should AI replace human developers?"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && startDebateWithTopic()}
              disabled={loading}
              autoFocus
            />
            <button
              onClick={startDebateWithTopic}
              className="start-debate-btn"
              disabled={loading || !topic.trim()}
            >
              {loading ? '⏳ Starting...' : '🚀 Start Debate'}
            </button>
          </div>
          {!apiReady && (
            <p className="api-warning">
              ⚠️ Backend not configured. Update VITE_API_URL in .env
            </p>
          )}
        </div>
      )}

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
        {useBackend && conversationId && messages.length > 2 && (
          <button
            onClick={summarizeDebate}
            className="control-btn summarize-btn"
            disabled={loading}
          >
            📝 Summarize Debate
          </button>
        )}
      </div>

      {/* Debate Summary */}
      {debateSummary && (
        <div className="summary-container">
          <h3>📝 Debate Summary</h3>
          <div className="summary-content">
            {typeof debateSummary === 'string'
              ? debateSummary
              : JSON.stringify(debateSummary, null, 2)}
          </div>
        </div>
      )}

      <div className="stats">
        <span>
          Messages: {messages.length}{' '}
          {!useBackend && `/ ${conversation.length}`}
          {useBackend &&
            conversationId &&
            ` | ID: ${conversationId.substring(0, 8)}...`}
          {useBackend && ` | Mode: Backend`}
          {!useBackend && ` | Mode: Mock`}
        </span>
      </div>
    </div>
  );
}

export default App;
