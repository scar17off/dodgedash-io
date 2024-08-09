import React, { useState, useEffect, useRef } from 'react';

const Chat = ({ messages, sendMessage }) => {
  const [inputMessage, setInputMessage] = useState('');
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      sendMessage(inputMessage);
      setInputMessage('');
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: '5px',
      left: '5px',
      width: '300px',
      zIndex: 1000,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: '5px',
    }}>
      <div ref={chatContainerRef} style={{
        height: '200px',
        overflowY: 'auto',
        marginBottom: '10px'
      }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ color: msg.color || 'white' }}>
            <strong>{msg.playerName}:</strong> {msg.message}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          style={{
            width: '100%',
            padding: '5px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            border: 'none',
            borderRadius: '3px'
          }}
          placeholder="Type your message..."
        />
      </form>
    </div>
  );
};

export default Chat;
