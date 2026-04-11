'use client';
import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from '@/app/context/SessionContext';
import styles from './ChatWidget.module.css';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'System initialized. How can I assist with your medical data today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  
  const params = useParams();
  const formId = params?.formId as string | undefined;
  const { sessionId } = useSession();
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          formId: formId,
          sessionId: sessionId,
        }),
      });

      if (!response.ok) throw new Error('Stream failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      let accumulatedResponse = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedResponse += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: accumulatedResponse,
          };
          return updated;
        });
      }
    } catch (err) {
        console.error('Chat error:', err);
        setMessages((prev) => [
          ...prev, 
          { role: 'assistant', content: 'Sorry, I am having trouble connecting right now.' }
        ]);
      } finally {
        setIsTyping(false);
      }
  };

  return (
    <div className={styles.container}>
      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.header}>
            <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
              <span style={{fontSize: 20}}>🧙‍♂️</span>
              <span className={styles.headerTitle}>AI Medical Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} style={{background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize: 18}}>✕</button>
          </div>
          
          <div className={styles.messageList} ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`${styles.bubble} ${m.role === 'user' ? styles.user : styles.assistant}`}>
                {m.content}
              </div>
            ))}
            {isTyping && messages[messages.length-1].role === 'user' && (
              <div className={`${styles.bubble} ${styles.assistant}`}>
                <div className={styles.typingIndicator}>
                   <span></span><span></span><span></span>
                </div>
              </div>
            )}
          </div>

          <div className={styles.inputArea}>
            <input 
              className={styles.input}
              placeholder={sessionId ? "Ask a question about your procedure..." : "Please wait for details to load..."}
              value={input}
              disabled={!sessionId || isTyping}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              className="btn-primary" 
              style={{padding: '10px 15px', fontSize: '14px'}}
              onClick={handleSend}
              disabled={!sessionId || isTyping || !input.trim()}
            >
              {isTyping ? '...' : 'Send'}
            </button>
          </div>
        </div>
      )}

      <button className={styles.toggleBtn} onClick={() => setIsOpen(!isOpen)} style={{position: 'relative'}}>
        {isOpen ? (
          <span style={{fontSize: '24px', color: 'white'}}>✕</span>
        ) : (
          <span style={{fontSize: '24px', color: 'white'}}>💬</span>
        )}
        {!isOpen && !sessionId && (
           <span className={styles.notificationDot}></span>
        )}
      </button>
    </div>
  );
}
