import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

export const App = () => {
  const [username, setUserName] = useState('');
  const [chatActive, setChatActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newmessage, setNewMessage] = useState('');

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await fetch('http://localhost:5000/messages');
        if (!response.ok) throw new Error('Failed to load chat history');
        const history = await response.json();
        setMessages(history);
      } catch (error) {
        console.error(error);
      }
    };

    loadMessages();
  }, []);

  useEffect(() => {
    const handleIncomingMessage = (message) => {
      setMessages((prev) =>
        prev.some((item) => item.id === message.id) ? prev : [...prev, message]
      );
    };

    socket.on('received-message', handleIncomingMessage);
    socket.on('chat-history', (history) => setMessages(history));

    return () => {
      socket.off('received-message', handleIncomingMessage);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedMessage = newmessage.trim();
    const trimmedUser = username.trim();

    if (!trimmedMessage) {
      alert('Massage connot be empty');
      return;
    }

    const messageData = {
      message: trimmedMessage,
      user: trimmedUser || 'Anonymous',
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    try {
      const response = await fetch('http://localhost:5000/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) throw new Error('Unable to save message');
      setNewMessage('');
    } catch (error) {
      console.error(error);
      alert('Unable to send message');
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-500 via-green-400 to-teal-500 flex items-center justify-center p-4">
      {chatActive ? (
        <div className="w-full max-w-2xl h-[90vh] bg-white/20 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-white/30">
          <div className="bg-white/30 backdrop-blur-md px-6 py-4 border-b border-white/30">
            <h1 className="text-2xl font-bold text-center text-white tracking-wider">
              💬 Squad Chat
            </h1>
          </div>

          <div className="h-[70vh] overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`flex ${
                  username === message.user ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex max-w-[80%] ${
                    username === message.user ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-lg">
                    {message.user?.charAt(0)?.toUpperCase()}
                  </div>

                  <div
                    className={`mx-3 px-4 py-2 rounded-2xl shadow-md ${
                      username === message.user
                        ? 'bg-emerald-500 text-white rounded-br-none'
                        : 'bg-white text-gray-800 rounded-bl-none'
                    }`}
                  >
                    <p className="text-xs font-semibold opacity-80">{message.user}</p>
                    <p className="font-medium wrap-break-word">{message.message}</p>
                    <p className="text-[10px] text-right mt-1 opacity-70">
                      {message.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-3 p-4 bg-white/20 backdrop-blur-md"
          >
            <input
              type="text"
              placeholder="Type your message..."
              value={newmessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 px-4 py-3 rounded-full bg-white outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <button
              type="submit"
              className="px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all duration-300 shadow-lg"
            >
              Send 🚀
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md text-center border border-white/30">
          <h1 className="text-3xl font-bold text-white mb-6">👋 Welcome</h1>

          <input
            type="text"
            value={username}
            placeholder="Enter your username"
            onChange={(e) => setUserName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl outline-none bg-white mb-5"
          />

          <button
            onClick={() => username.trim() && setChatActive(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold transition-all duration-300"
          >
            Start Chat 💬
          </button>
        </div>
      )}
    </div>
  );
};

export default App
