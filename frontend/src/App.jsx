import { useState, useEffect, useRef } from 'react';
import './App.css';
import { conversation } from './mock/conversationData';

function App() {
  const [messages, setMessages] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isPlaying) return;

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
  }, [isPlaying]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const resetConversation = () => {
    setMessages([]);
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
        <div ref={messagesEndRef} />
      </div>

      <div className="controls">
        <button onClick={togglePlayPause} className="control-btn">
          {isPlaying ? '⏸ Pause' : '▶ Resume'}
        </button>
        <button onClick={resetConversation} className="control-btn reset-btn">
          🔄 Reset
        </button>
      </div>

      <div className="stats">
        <span>
          Messages: {messages.length} / {conversation.length}
        </span>
      </div>
    </div>
  );
}

export default App;
