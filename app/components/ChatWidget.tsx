'use client';
import { useState, useRef, useEffect } from 'react';
import styles from './ChatWidget.module.css';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'System initialized. How can I assist with your medical data today?' }
  ]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const newMsg = { role: 'user', content: input };
    const newMessages = [...messages, newMsg];
    setMessages(newMessages);
    setInput('');

    try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: newMessages }),
        });
    
        const data = await response.json();
    
        if (data.error) throw new Error(data.error);
    
        // Add the AI's reply to the chat
        setMessages((prev) => [...prev, { role: 'assistant', content: data.content }]);
        
      } catch (err) {
        setMessages((prev) => [
          ...prev, 
          { role: 'assistant', content: 'Sorry, I am having trouble connecting right now.' }
        ]);
      }
  };

  return (
    <div className={styles.container}>
      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.header}>
            <span className={styles.headerTitle}>AI Medical Assistant</span>
            <button onClick={() => setIsOpen(false)} style={{background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer'}}>✕</button>
          </div>
          
          <div className={styles.messageList} ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`${styles.bubble} ${m.role === 'user' ? styles.user : styles.assistant}`}>
                {m.content}
              </div>
            ))}
          </div>

          <div className={styles.inputArea}>
            <input 
              className={styles.input}
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              className="btn-primary" 
              style={{padding: '10px 15px', fontSize: '14px'}}
              onClick={handleSend}
            >
              Send
            </button>
          </div>
        </div>
      )}

      <button className={styles.toggleBtn} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? (
          <span style={{fontSize: '24px', color: 'white'}}>✕</span>
        ) : (
          <span style={{fontSize: '24px', color: 'white'}}>💬</span>
        )}
      </button>
    </div>
  );
}
