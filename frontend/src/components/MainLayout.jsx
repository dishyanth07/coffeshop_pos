import React from 'react';
import Sidebar from './Sidebar';

const MainLayout = ({ children }) => {
    return (
        <div className="flex h-screen bg-brand-bg overflow-hidden font-sans">
            <Sidebar />
            {/* Main content: add pb-20 on mobile so content doesn't hide behind the bottom nav */}
            <main className="flex-1 overflow-auto p-3 md:p-8 pb-20 md:pb-8 animate-fade-in-up">
                {children}
            </main>
        </div>
    );
};

export default MainLayout;
