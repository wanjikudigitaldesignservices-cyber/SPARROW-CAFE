
import React, { useState } from 'react';
import { DashboardIcon } from './components/icons/DashboardIcon';
import { ReservationsIcon } from './components/icons/ReservationsIcon';
import { MenuIcon } from './components/icons/MenuIcon';
import { CreativeIcon } from './components/icons/CreativeIcon';
import { ChatIcon } from './components/icons/ChatIcon';
import { CloseIcon } from './components/icons/CloseIcon';
import Dashboard from './components/Dashboard';
import Reservations from './components/Reservations';
import Menu from './components/Menu';
import CreativeStudio from './components/CreativeStudio';
import Chatbot from './components/Chatbot';
import { View } from './types';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'reservations':
        return <Reservations />;
      case 'menu':
        return <Menu />;
      case 'creative':
        return <CreativeStudio />;
      default:
        return <Dashboard />;
    }
  };

  const NavItem: React.FC<{
    view: View;
    icon: React.ReactNode;
    label: string;
  }> = ({ view, icon, label }) => (
    <button
      onClick={() => {
        setActiveView(view);
        setIsSidebarOpen(false);
      }}
      className={`flex items-center w-full px-4 py-3 text-left transition-colors duration-200 rounded-lg ${
        activeView === view
          ? 'bg-sparrow-gold-500 text-white shadow-md'
          : 'text-gray-200 hover:bg-sparrow-blue-800 hover:text-white'
      }`}
    >
      {icon}
      <span className="ml-4 font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-sparrow-blue-50 font-sans">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 px-4 py-8 bg-sparrow-blue-900 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-center mb-12">
          <span className="text-3xl font-serif text-white">Sparrow Café</span>
        </div>
        <nav className="space-y-4">
          <NavItem view="dashboard" icon={<DashboardIcon />} label="Dashboard" />
          <NavItem view="reservations" icon={<ReservationsIcon />} label="Reservations" />
          <NavItem view="menu" icon={<MenuIcon />} label="Menu" />
          <NavItem view="creative" icon={<CreativeIcon />} label="Creative Studio" />
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200 md:justify-end">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-gray-500 focus:outline-none md:hidden"
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 6H20M4 12H20M4 18H11"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-sparrow-blue-900 capitalize md:hidden">{activeView}</h1>
          <div className="text-right">
              <p className="text-gray-800 font-semibold">Manager</p>
              <p className="text-sm text-gray-500">Lisbon, Portugal</p>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-sparrow-blue-50 p-4 md:p-8">
          {renderView()}
        </main>
      </div>
      
      {/* Chatbot */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsChatbotOpen(!isChatbotOpen)}
          className="bg-sparrow-blue-900 text-white p-4 rounded-full shadow-lg hover:bg-sparrow-blue-800 transition-transform transform hover:scale-110"
          aria-label={isChatbotOpen ? 'Close chat' : 'Open chat'}
        >
          {isChatbotOpen ? <CloseIcon /> : <ChatIcon />}
        </button>
      </div>
      {isChatbotOpen && <Chatbot onClose={() => setIsChatbotOpen(false)} />}
    </div>
  );
};

export default App;
