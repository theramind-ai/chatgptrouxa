'use client';

import { useState } from 'react';
import ChatBox from './components/ChatBox';
import Sidebar from './components/Sidebar';

export default function Home() {
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleNewConversation = (id: string) => {
    setCurrentConvId(id);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <main className="h-screen w-full bg-background overflow-hidden relative flex">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-0"></div>

      <Sidebar
        currentConvId={currentConvId}
        onSelect={(id) => setCurrentConvId(id)}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        shouldRefresh={refreshTrigger}
      />

      <div className="flex-1 w-full relative z-10 flex flex-col">
        {/* ChatBox takes the remaining width and handles its own internal layout */}
        <ChatBox
          conversationId={currentConvId}
          setConversationId={handleNewConversation}
        />
      </div>
    </main>
  );
}
