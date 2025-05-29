import React, { useState } from 'react';
import { PlusIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid'; // Using Heroicons

const ChatInput = ({ onSendMessage, onFileUpload }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleAttachClick = () => {
    // Trigger file input click or open a modal for more options
    // For now, let's assume a hidden file input
    document.getElementById('chat-file-input').click();
  };

  const handleFileSelected = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      onFileUpload(event.target.files);
      event.target.value = null; // Reset file input
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-100 border-t border-gray-300 flex items-center sticky bottom-0 z-10">
      <button
        type="button"
        onClick={handleAttachClick}
        className="p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-gray-200 mr-2"
        aria-label="Attach files or smart actions"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
      <input
        id="chat-file-input"
        type="file"
        multiple
        onChange={handleFileSelected}
        className="hidden"
        // accept=".pdf,.docx, etc."
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a prompt, mention files, or use / for commands..."
        className="flex-grow p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-150 ease-in-out"
        rows="1"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      />
      <button
        type="submit"
        disabled={!message.trim()}
        className="ml-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-400 transition-colors duration-150 ease-in-out shadow-md hover:shadow-lg disabled:shadow-none"
        aria-label="Send message"
      >
        <PaperAirplaneIcon className="h-6 w-6" />
      </button>
    </form>
  );
};

export default ChatInput;
