import OpenAI from 'openai';
import { getOpenAIConfig } from '@/lib/config';

// 获取OpenAI配置
const openaiConfig = getOpenAIConfig();

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!openaiConfig.enabled || !openaiConfig.apiKey) {
      throw new Error('OpenAI is not enabled or API key is not configured');
    }
    openaiClient = new OpenAI({
      apiKey: openaiConfig.apiKey,
    });
  }
  return openaiClient;
}

export interface TagInfo {
  id: number;
  name: string;
  code: string;
  color: string;
}

export interface RecordData {
  record_id: string;
  data: Record<string, any>;
}

export interface AIRecommendation {
  record_id: string;
  tag_id: number | null;
  tag_name: string | null;
  confidence: number;
  reason: string;
}

export async function generateTagRecommendations(
  records: RecordData[],
  prompt: string,
  availableTags: TagInfo[]
): Promise<AIRecommendation[]> {
  const client = getOpenAIClient();

  const tagDescriptions = availableTags
    .map(t => `- ID: ${t.id}, 名称: ${t.name}, 编码: ${t.code}`)
    .join('\n');

  const recordsText = records
    .map(r => `记录ID: ${r.record_id}, 数据: ${JSON.stringify(r.data, null, 2)}`)
    .join('\n\n');

  const systemPrompt = `你是一个智能打标助手。根据以下可用标签和用户提示词，为每条记录推荐最合适的标签。

可用标签：
${tagDescriptions}

请根据每条记录的原始数据，判断应该打哪个标签。返回JSON数组格式，每条记录一个推荐结果。
返回格式要求：
- 如果推荐某个标签，返回 tag_id（标签ID）、confidence（置信度0-1）、reason（推荐理由）
- 如果无法确定标签，返回 tag_id: null、confidence: 0、reason: "无法确定"

只返回JSON数组，不要包含其他文字。`;

  const userPrompt = `用户提示词: ${prompt}

需要打标的记录：
${recordsText}

请为每条记录推荐标签。`;

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await client.chat.completions.create({
        model: openaiConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: openaiConfig.temperature,
        max_tokens: openaiConfig.maxTokens,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      const result = JSON.parse(content);
      
      if (Array.isArray(result)) {
        return result.map((item: any, index: number) => ({
          record_id: records[index]?.record_id || `unknown_${index}`,
          tag_id: item.tag_id ?? null,
          tag_name: item.tag_name ?? null,
          confidence: item.confidence ?? 0,
          reason: item.reason ?? '',
        }));
      } else if (result.recommendations) {
        return result.recommendations.map((item: any, index: number) => ({
          record_id: records[index]?.record_id || `unknown_${index}`,
          tag_id: item.tag_id ?? null,
          tag_name: item.tag_name ?? null,
          confidence: item.confidence ?? 0,
          reason: item.reason ?? '',
        }));
      }

      throw new Error('Invalid response format from OpenAI');
    } catch (error) {
      lastError = error as Error;
      console.error(`OpenAI API error (attempt ${i + 1}/${maxRetries}):`, error);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  throw lastError || new Error('Failed to generate tag recommendations');
}

export async function callOpenAIWithRetry(prompt: string): Promise<string> {
  const client = getOpenAIClient();
  
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await client.chat.completions.create({
        model: openaiConfig.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: openaiConfig.temperature,
        max_tokens: openaiConfig.maxTokens,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      return content;
    } catch (error) {
      lastError = error as Error;
      console.error(`OpenAI API error (attempt ${i + 1}/${maxRetries}):`, error);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  throw lastError || new Error('Failed to call OpenAI');
}

export function isAIConfigured(): boolean {
  return openaiConfig.enabled && !!openaiConfig.apiKey;
}

export function getAIConfig() {
  return {
    model: openaiConfig.model,
    temperature: openaiConfig.temperature,
    maxTokens: openaiConfig.maxTokens,
    configured: isAIConfigured(),
  };
}
