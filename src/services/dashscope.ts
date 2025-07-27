import axios from 'axios';
import { createConversation, saveMessage } from './supabase';
import { StreamTextCleaner } from '../utils/textCleaner';

const APP_ID = import.meta.env.VITE_DASHSCOPE_APP_ID;
const API_KEY = import.meta.env.VITE_DASHSCOPE_API_KEY;
const BASE_URL = APP_ID ? `https://dashscope.aliyuncs.com/api/v1/apps/${APP_ID}/completion` : '';

const SESSION_STORAGE_KEY = 'dashscope_session_id';
const CONVERSATION_ID_KEY = 'conversation_id';

export class DashscopeService {
  private sessionId: string | null = null;
  private conversationId: string | null = null;
  private textCleaner: StreamTextCleaner = new StreamTextCleaner();

  constructor() {
    this.sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    this.conversationId = localStorage.getItem(CONVERSATION_ID_KEY);
  }

  async clearSession() {
    this.sessionId = null;
    this.conversationId = null;
    this.textCleaner.reset();
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(CONVERSATION_ID_KEY);
    
    if (this.sessionId) {
      try {
        const newConversationId = await createConversation(this.sessionId);
        this.conversationId = newConversationId;
        localStorage.setItem(CONVERSATION_ID_KEY, newConversationId);
      } catch (error) {
        console.error('Error creating new conversation:', error);
      }
    }
  }

  async* streamMessage(prompt: string): AsyncGenerator<string> {
    if (!APP_ID || !API_KEY) {
      throw new Error('请在 .env 文件中配置 DashScope 环境变量');
    }

    // Reset text cleaner for new message
    this.textCleaner.reset();

    try {
      if (this.conversationId) {
        await saveMessage({
          conversation_id: this.conversationId,
          content: prompt,
          role: 'user',
          timestamp: new Date(),
        });
      }

      const data = {
        input: {
          prompt,
          ...(this.sessionId ? { session_id: this.sessionId } : {})
        },
        parameters: {
          incremental_output: true
        }
      };

      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'X-DashScope-SSE': 'enable'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is null');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) continue;

          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.slice(5));
              if (data.output?.session_id) {
                this.sessionId = data.output.session_id;
                localStorage.setItem(SESSION_STORAGE_KEY, this.sessionId);
                
                if (!this.conversationId) {
                  try {
                    const newConversationId = await createConversation(this.sessionId);
                    this.conversationId = newConversationId;
                    localStorage.setItem(CONVERSATION_ID_KEY, newConversationId);
                  } catch (error) {
                    console.error('Error creating new conversation:', error);
                  }
                }
              }
              if (data.output?.text) {
                const chunk = data.output.text;
                console.log('📨 Raw chunk from API:', JSON.stringify(chunk));
                const cleanedChunk = this.textCleaner.processChunk(chunk);
                console.log('🧽 Cleaned chunk:', JSON.stringify(cleanedChunk));
                fullResponse += cleanedChunk;
                if (cleanedChunk) {
                  yield cleanedChunk;
                }
              }
              if (data.output?.finish_reason === 'stop') {
                // Flush any remaining text
                const remaining = this.textCleaner.flush();
                if (remaining) {
                  console.log('🏁 Flushing remaining text:', JSON.stringify(remaining));
                  fullResponse += remaining;
                  yield remaining;
                }
                if (this.conversationId) {
                  await saveMessage({
                    conversation_id: this.conversationId,
                    content: fullResponse,
                    role: 'assistant',
                    timestamp: new Date(),
                  });
                }
                return;
              }
            } catch (e) {
              console.warn('Failed to parse line:', line);
            }
          }
        }
      }

      if (buffer) {
        try {
          const data = JSON.parse(buffer.slice(5));
          if (data.output?.text) {
            const chunk = data.output.text;
            console.log('📨 Final chunk from API:', JSON.stringify(chunk));
            const cleanedChunk = this.textCleaner.processChunk(chunk);
            console.log('🧽 Final cleaned chunk:', JSON.stringify(cleanedChunk));
            fullResponse += cleanedChunk;
            if (cleanedChunk) {
              yield cleanedChunk;
            }
          }
          
          // Flush any remaining text at the end
          const remaining = this.textCleaner.flush();
          if (remaining) {
            console.log('🏁 Final flush:', JSON.stringify(remaining));
            fullResponse += remaining;
            yield remaining;
          }
            
          if (this.conversationId) {
            await saveMessage({
              conversation_id: this.conversationId,
              content: fullResponse,
              role: 'assistant',
              timestamp: new Date(),
            });
          }
        } catch (e) {
          // Ignore parsing errors for the last chunk
        }
      }
    } catch (error) {
      console.error('Error in streamMessage:', error);
      throw error;
    }
  }
}