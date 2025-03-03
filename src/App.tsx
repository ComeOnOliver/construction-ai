import React, { useState, useRef, useEffect } from 'react';
import { Bot, RefreshCw } from 'lucide-react';
import { Message } from './types';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { DashscopeService } from './services/dashscope';
import { getChatHistory } from './services/supabase';

const dashscope = new DashscopeService();
const CONVERSATION_ID_KEY = 'conversation_id';

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "您好！我是您的建筑知识小助手，请问我可以怎么帮您?",
      role: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadChatHistory = async () => {
      const conversationId = localStorage.getItem(CONVERSATION_ID_KEY);
      if (conversationId) {
        try {
          const history = await getChatHistory(conversationId);
          if (history.length > 0) {
            setMessages(history);
          }
        } catch (error: any) {
          console.error('加载聊天历史失败:', error);
          setError('加载聊天历史失败，但您仍可以继续新的对话。');
        }
      }
      setIsLoadingHistory(false);
    };

    loadChatHistory();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewSession = () => {
    if (isLoading) return;
    
    dashscope.clearSession();
    setMessages([
      {
        id: Date.now().toString(),
        content: "您好！我是您的建筑知识小助手，请问我可以怎么帮您?",
        role: 'assistant',
        timestamp: new Date(),
      },
    ]);
    setError(null);
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    try {
      setError(null);
      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        role: 'user',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);

      const aiMessageId = (Date.now() + 1).toString();
      const initialAiMessage: Message = {
        id: aiMessageId,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, initialAiMessage]);

      let fullResponse = '';
      try {
        for await (const chunk of dashscope.streamMessage(content)) {
          if (chunk) {
            fullResponse += chunk;
            setMessages(prev => 
              prev.map(msg => 
                msg.id === aiMessageId 
                  ? { ...msg, content: fullResponse }
                  : msg
              )
            );
            requestAnimationFrame(scrollToBottom);
          }
        }
      } catch (streamError: any) {
        console.error('Streaming error:', streamError);
        setError(streamError.message || '抱歉，生成回答时出现错误，请稍后重试。');
        setMessages(prev => 
          prev.filter(msg => msg.id !== aiMessageId)
        );
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.message || '抱歉，发送消息时出现错误，请稍后重试。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-2 sm:py-4 flex flex-col h-screen">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 transform hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform duration-300">
                <Bot className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  AI 建筑小助手
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Powered by DeepSeek R1</p>
              </div>
            </div>
            <button
              onClick={handleNewSession}
              disabled={isLoading}
              className="p-2 sm:p-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
              title="开始新会话"
            >
              <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden backdrop-blur-sm backdrop-filter flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}
                {messages.map((message, index) => (
                  <ChatMessage 
                    key={message.id} 
                    message={message}
                    isFirst={index === 0}
                    isLast={index === messages.length - 1}
                  />
                ))}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Area */}
          <div className="border-t border-blue-100 p-4 sm:p-6 bg-gradient-to-b from-white to-blue-50">
            <ChatInput onSendMessage={handleSendMessage} disabled={isLoading || isLoadingHistory} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;