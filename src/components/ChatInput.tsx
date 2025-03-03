import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2 sm:gap-3">
      <div className="flex-1 relative group">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入您的问题..."
          disabled={disabled}
          className="w-full p-3 sm:p-4 rounded-xl border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 resize-none h-[60px] sm:h-[80px] transition-all duration-300 bg-white shadow-sm text-sm sm:text-base"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <div className="hidden sm:block absolute bottom-2 right-2 text-xs text-gray-400">
          按 Enter 发送，Shift + Enter 换行
        </div>
      </div>
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="h-[60px] sm:h-[80px] px-4 sm:px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 group flex items-center justify-center"
      >
        <Send className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform duration-300" />
      </button>
    </form>
  );
}