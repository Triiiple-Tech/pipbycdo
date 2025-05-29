import React from 'react';

const MessageBubble = ({ message }) => {
  const { text, sender, agent, timestamp, file, isUser, agentType } = message;

  const bubbleClasses = isUser
    ? 'bg-blue-500 text-white self-end rounded-lg rounded-br-none'
    : 'bg-gray-200 text-gray-800 self-start rounded-lg rounded-bl-none';

  const agentColors = {
    Estimator: 'bg-green-100 text-green-800',
    RFI: 'bg-yellow-100 text-yellow-800',
    Exporter: 'bg-teal-100 text-teal-800',
    Manager: 'bg-purple-100 text-purple-800',
    Validator: 'bg-indigo-100 text-indigo-800',
    default: 'bg-gray-100 text-gray-700'
  };

  const agentBadgeClasses = agentColors[agentType] || agentColors.default;

  return (
    <div className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl p-3 shadow-md ${bubbleClasses}`}>
      {!isUser && agent && (
        <div className="flex items-center mb-1">
          {/* Placeholder for agent icon */}
          <span className="w-5 h-5 bg-gray-400 rounded-full mr-2 inline-flex items-center justify-center text-xs text-white">
            {agentType ? agentType.charAt(0) : 'A'}
          </span>
          <span className={`text-sm font-semibold ${agentBadgeClasses} px-2 py-0.5 rounded-full`}>{agent}</span>
        </div>
      )}
      <p className="text-sm whitespace-pre-wrap">{text}</p>
      {file && (
        <div className="mt-2 p-2 border border-gray-300 rounded bg-gray-50">
          <p className="text-xs text-gray-600">File: {file.name}</p>
          {/* Add thumbnail/preview logic here */}
        </div>
      )}
      {timestamp && (
        <p className="text-xs text-gray-400 mt-1 text-right opacity-75 hover:opacity-100">
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
  );
};

export default MessageBubble;
