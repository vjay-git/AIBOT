// utils/llmApi.ts - Improved Real LLM API Service

export interface LLMSettings {
  // Model type fields
  action_model_type: string;
  embedding_model_type: string;
  primary_model_type: string;
  response_model_type: string;
  scrapper_model_type: string;
  secondary_model_type: string;
  
  // Ollama fields
  action_ollama_endpoint: string;
  action_ollama_model: string;
  embedding_ollama_endpoint: string;
  embedding_ollama_model: string;
  primary_ollama_endpoint: string;
  primary_ollama_model: string;
  response_ollama_endpoint: string;
  response_ollama_model: string;
  scrapper_ollama_endpoint: string;
  scrapper_ollama_model: string;
  secondary_ollama_endpoint: string;
  secondary_ollama_model: string;
  
  // GPT fields (global)
  gpt_api_base: string;
  gpt_api_key: string;
  gpt_api_version: string;
  gpt_deployment: string;
  gpt_model: string;
  
  // Optional fields for other providers (per model type)
  action_api_key?: string;
  action_api_base?: string;
  action_model?: string;
  embedding_api_key?: string;
  embedding_api_base?: string;
  embedding_model?: string;
  primary_api_key?: string;
  primary_api_base?: string;
  primary_model?: string;
  response_api_key?: string;
  response_api_base?: string;
  response_model?: string;
  scrapper_api_key?: string;
  scrapper_api_base?: string;
  scrapper_model?: string;
  scrapper_whitelisted_websites?: string;
  secondary_api_key?: string;
  secondary_api_base?: string;
  secondary_model?: string;
  
  // Allow dynamic fields
  [key: string]: string | undefined;
}

export const PROVIDER_OPTIONS = [
  { id: 'None', name: 'None', icon: '❌' },
  { id: 'Ollama', name: 'Ollama', icon: '🦙' },
  { id: 'GPT', name: 'GPT', icon: '🤖' },
  { id: 'HuggingFace', name: 'Hugging Face', icon: '🤗' },
  { id: 'Gemini', name: 'Gemini', icon: '💎' },
  { id: 'Claude', name: 'Claude', icon: '🎭' },
];

export const WHITELISTED_WEBSITES = [
  { id: 'cloud4c', name: 'www.cloud4c.com', url: 'https://www.cloud4c.com' },
  { id: 'github', name: 'github.com', url: 'https://github.com' },
  { id: 'stackoverflow', name: 'stackoverflow.com', url: 'https://stackoverflow.com' },
  { id: 'medium', name: 'medium.com', url: 'https://medium.com' },
  { id: 'techcrunch', name: 'techcrunch.com', url: 'https://techcrunch.com' },
  { id: 'hackernews', name: 'news.ycombinator.com', url: 'https://news.ycombinator.com' },
  { id: 'reddit', name: 'reddit.com', url: 'https://reddit.com' },
  { id: 'aws', name: 'aws.amazon.com', url: 'https://aws.amazon.com' },
  { id: 'azure', name: 'azure.microsoft.com', url: 'https://azure.microsoft.com' },
  { id: 'gcp', name: 'cloud.google.com', url: 'https://cloud.google.com' },
];

export class LLMApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://20.204.162.66:5001';
  }

  // Fetch current LLM settings from real API
  async getLLMSettings(): Promise<LLMSettings> {
    try {
      const response = await fetch(`${this.baseUrl}/llm_settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch LLM settings: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('LLM Settings loaded:', data);
      return data;
    } catch (error) {
      console.error('Error fetching LLM settings:', error);
      throw error;
    }
  }

  // Save LLM settings to real API
  async saveLLMSettings(settings: Partial<LLMSettings>): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Saving LLM settings:', settings);
      
      const response = await fetch(`${this.baseUrl}/llm_settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save LLM settings: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Settings saved successfully:', result);
      
      return {
        success: true,
        message: result.message || 'Settings saved successfully',
      };
    } catch (error) {
      console.error('Error saving LLM settings:', error);
      throw error;
    }
  }

  // Test connection to a specific model configuration
  async testConnection(modelType: string, provider: string): Promise<{ connected: boolean; message: string }> {
    try {
      const settings = await this.getLLMSettings();
      const config = getLLMConfigForModel(settings, modelType);
      
      let isConfigured = false;
      let message = '';

      if (provider === 'None') {
        isConfigured = false;
        message = 'No model provider selected';
      } else if (provider === 'Ollama') {
        isConfigured = !!(config.ollamaEndpoint && config.ollamaModel);
        message = isConfigured 
          ? `Ollama model "${config.ollamaModel}" configured with endpoint ${config.ollamaEndpoint}`
          : 'Ollama model or endpoint not configured';
      } else if (provider === 'GPT') {
        isConfigured = !!(settings.gpt_api_key && settings.gpt_model);
        message = isConfigured 
          ? `GPT model "${settings.gpt_model}" configured with API key`
          : 'GPT API key or model not configured';
      } else {
        // For other providers like HuggingFace, Gemini, Claude
        const prefix = modelType.toLowerCase();
        const apiKey = settings[`${prefix}_api_key`];
        const model = settings[`${prefix}_model`];
        
        isConfigured = !!(apiKey && model);
        message = isConfigured 
          ? `${provider} model "${model}" configured with API key`
          : `${provider} API key or model not configured`;
      }
      
      return {
        connected: isConfigured,
        message: message,
      };
    } catch (error) {
      console.error('Error testing connection:', error);
      return {
        connected: false,
        message: 'Failed to check connection status',
      };
    }
  }

  // Validate configuration for a specific model type and provider
  async validateConfiguration(modelType: string, provider: string): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const settings = await this.getLLMSettings();
      const errors: string[] = [];

      if (provider === 'None') {
        return { valid: true, errors: [] };
      }

      if (provider === 'Ollama') {
        const config = getLLMConfigForModel(settings, modelType);
        if (!config.ollamaEndpoint) {
          errors.push('Ollama endpoint is required');
        }
        if (!config.ollamaModel) {
          errors.push('Ollama model is required');
        }
      } else if (provider === 'GPT') {
        if (!settings.gpt_api_key) {
          errors.push('GPT API key is required');
        }
        if (!settings.gpt_model) {
          errors.push('GPT model is required');
        }
        if (!settings.gpt_api_base) {
          errors.push('GPT API base URL is required');
        }
      } else {
        // For other providers
        const prefix = modelType.toLowerCase();
        if (!settings[`${prefix}_api_key`]) {
          errors.push(`${provider} API key is required`);
        }
        if (!settings[`${prefix}_model`]) {
          errors.push(`${provider} model is required`);
        }
      }

      return {
        valid: errors.length === 0,
        errors: errors,
      };
    } catch (error) {
      return {
        valid: false,
        errors: ['Failed to validate configuration'],
      };
    }
  }
}

// Utility functions for working with LLM settings
export const getLLMConfigForModel = (settings: LLMSettings, modelType: string) => {
  const prefix = modelType.toLowerCase();
  
  return {
    modelType: settings[`${prefix}_model_type` as keyof LLMSettings] || 'None',
    ollamaEndpoint: settings[`${prefix}_ollama_endpoint` as keyof LLMSettings] || '',
    ollamaModel: settings[`${prefix}_ollama_model` as keyof LLMSettings] || '',
    apiKey: settings[`${prefix}_api_key` as keyof LLMSettings] || '',
    apiBase: settings[`${prefix}_api_base` as keyof LLMSettings] || '',
    model: settings[`${prefix}_model` as keyof LLMSettings] || '',
    // For GPT, use global fields
    gptApiKey: settings.gpt_api_key || '',
    gptApiBase: settings.gpt_api_base || '',
    gptModel: settings.gpt_model || '',
    gptDeployment: settings.gpt_deployment || '',
    gptApiVersion: settings.gpt_api_version || '',
  };
};

export const updateLLMConfigForModel = (
  settings: LLMSettings, 
  modelType: string, 
  config: {
    modelType?: string;
    ollamaEndpoint?: string;
    ollamaModel?: string;
    apiKey?: string;
    apiBase?: string;
    model?: string;
    gptApiKey?: string;
    gptApiBase?: string;
    gptModel?: string;
    gptDeployment?: string;
    gptApiVersion?: string;
    whitelistedWebsites?: string[];
  }
): Partial<LLMSettings> => {
  const prefix = modelType.toLowerCase();
  const updates: Partial<LLMSettings> = { ...settings };

  // Update model type
  if (config.modelType !== undefined) {
    updates[`${prefix}_model_type` as keyof LLMSettings] = config.modelType as any;
  }

  // Update Ollama fields
  if (config.ollamaEndpoint !== undefined) {
    updates[`${prefix}_ollama_endpoint` as keyof LLMSettings] = config.ollamaEndpoint as any;
  }
  if (config.ollamaModel !== undefined) {
    updates[`${prefix}_ollama_model` as keyof LLMSettings] = config.ollamaModel as any;
  }

  // Update GPT fields (global)
  if (config.gptApiKey !== undefined) {
    updates.gpt_api_key = config.gptApiKey;
  }
  if (config.gptApiBase !== undefined) {
    updates.gpt_api_base = config.gptApiBase;
  }
  if (config.gptModel !== undefined) {
    updates.gpt_model = config.gptModel;
  }
  if (config.gptDeployment !== undefined) {
    updates.gpt_deployment = config.gptDeployment;
  }
  if (config.gptApiVersion !== undefined) {
    updates.gpt_api_version = config.gptApiVersion;
  }

  // Update generic provider fields
  if (config.apiKey !== undefined) {
    updates[`${prefix}_api_key` as keyof LLMSettings] = config.apiKey as any;
  }
  if (config.apiBase !== undefined) {
    updates[`${prefix}_api_base` as keyof LLMSettings] = config.apiBase as any;
  }
  if (config.model !== undefined) {
    updates[`${prefix}_model` as keyof LLMSettings] = config.model as any;
  }

  // Update whitelisted websites for scrapper
  if (config.whitelistedWebsites !== undefined && modelType === 'scrapper') {
    updates[`${prefix}_whitelisted_websites` as keyof LLMSettings] = JSON.stringify(config.whitelistedWebsites) as any;
  }

  return updates;
};

// Helper function to get provider-specific field requirements
export const getProviderFieldRequirements = (provider: string): string[] => {
  switch (provider) {
    case 'Ollama':
      return ['ollamaEndpoint', 'ollamaModel'];
    case 'GPT':
      return ['gptApiKey', 'gptApiBase', 'gptModel'];
    case 'HuggingFace':
    case 'Gemini':
    case 'Claude':
      return ['apiKey', 'model'];
    default:
      return [];
  }
};

// Helper function to get default values for a provider
export const getProviderDefaults = (provider: string): Record<string, string> => {
  switch (provider) {
    case 'Ollama':
      return {
        ollamaEndpoint: 'http://localhost:11434/',
        ollamaModel: 'llama3.2:latest',
      };
    case 'GPT':
      return {
        gptApiBase: 'https://api.openai.com/v1',
        gptModel: 'gpt-4o',
        gptApiVersion: '2024-02-15-preview',
        gptDeployment: 'gpt-4o',
      };
    case 'HuggingFace':
      return {
        apiBase: 'https://api-inference.huggingface.co/models',
        model: 'microsoft/DialoGPT-medium',
      };
    case 'Gemini':
      return {
        apiBase: 'https://generativelanguage.googleapis.com/v1',
        model: 'gemini-pro',
      };
    case 'Claude':
      return {
        apiBase: 'https://api.anthropic.com/v1',
        model: 'claude-3-sonnet-20240229',
      };
    default:
      return {};
  }
};

export const llmApiService = new LLMApiService();