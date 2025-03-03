import React from 'react';
import { Bot, User } from 'lucide-react';
import { Message } from '../types';
import clsx from 'clsx';

interface ChatMessageProps {
  message: Message;
  isFirst?: boolean;
  isLast?: boolean;
}

export function ChatMessage({ message, isFirst, isLast }: ChatMessageProps) {
  const isBot = message.role === 'assistant';

  return (
    <div
      className={clsx(
        'flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl transition-all duration-300',
        isBot ? 'bg-blue-50/50 hover:bg-blue-50' : 'bg-white hover:bg-gray-50/50',
        isFirst && 'animate-fade-in',
        isLast && message.content && 'animate-slide-in'
      )}
    >
      <div className={clsx(
        'w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-md transition-transform duration-300 hover:scale-110',
        isBot ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-green-500 to-green-600'
      )}>
        {isBot ? (
          <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        ) : (
          <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-medium text-gray-900 mb-1">
          {isBot ? 'AI小助手' : '您'}
        </p>
        <div className="prose prose-blue max-w-none">
          <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>
      <time className="text-[10px] sm:text-xs text-gray-400 tabular-nums whitespace-nowrap">
        {new Date(message.timestamp).toLocaleTimeString()}
      </time>
    </div>
  );
}