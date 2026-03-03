import React, { createContext, useState, useContext } from 'react';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const [isChatOpen, setIsChatOpen] = useState(false);

    const toggleChat = () => setIsChatOpen(prev => !prev);
    const openChat = () => setIsChatOpen(true);
    const closeChat = () => setIsChatOpen(false);

    return (
        <ChatContext.Provider value={{ isChatOpen, toggleChat, openChat, closeChat }}>
            {children}
        </ChatContext.Provider>
    );
};
