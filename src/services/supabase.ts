import { createClient } from '@supabase/supabase-js';
import { Message } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('请在 .env 文件中配置 Supabase 环境变量');
}

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export interface DBConversation {
  id: string;
  session_id: string;
  created_at: string;
  updated_at: string;
}

export interface DBMessage {
  id: string;
  conversation_id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  created_at: string;
}

export async function createConversation(sessionId: string): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase 客户端未初始化，请检查环境变量配置');
  }

  const { data, error } = await supabase
    .from('conversations')
    .insert([{ session_id: sessionId }])
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function saveMessage(message: {
  conversation_id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase 客户端未初始化，请检查环境变量配置');
  }

  const { error } = await supabase
    .from('messages')
    .insert([message]);

  if (error) throw error;
}

export async function getChatHistory(conversationId: string): Promise<Message[]> {
  if (!supabase) {
    throw new Error('Supabase 客户端未初始化，请检查环境变量配置');
  }

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: true });

  if (error) throw error;

  return data.map(message => ({
    id: message.id,
    content: message.content,
    role: message.role,
    timestamp: new Date(message.timestamp)
  }));
}