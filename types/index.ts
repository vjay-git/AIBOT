export interface NavItem {
  id: string;
  title: string;
  route: string;
}

export interface SubNavItem {
  id: string;
  title: string;
  parentId: string;
}

export interface DashboardDataType {
  metrics: {
    products: number;
    orders: number;
    customers: number;
  };
  chartData: {
    labels: string[];
    series: number[][];
  };
  customerList: {
    company: string;
    about: string;
  }[];
}

export interface DatabaseType {
  tables: {
    name: string;
    inputFolder: string;
    processedFolder: string;
  }[];
}

export interface DatabaseTableRow {
  id: string;
  name: string;
  inputFolder: string;
  processedFolder: string;
}

export interface AlignmentRow {
  id: string;
  aiTable: string;
  aiField1: string;
  aiField2: string;
  systemDefaultValue: string;
}

export interface SchemaType {
  fields: {
    id: string;
    name: string;
    selected: boolean;
  }[];
}

export interface UserType {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
}

export interface ReportType {
  id: string;
  name: string;
  email: string;
  role: string;
  lastModified: string;
}

export interface LLMModelType {
  availableModels: {
    id: string;
    name: string;
    provider: string;
  }[];
  selectedModel: string;
  configurations: {
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
  };
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  replyTo?: string; // for replies
  type?: 'text' | 'search_query' | 'search_result' | 'db_answer'; // message type for different modes
  bookmarked?: boolean; // whether message is bookmarked
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  bookmarked: boolean;
  createdAt: string;
  updatedAt: string;
  folderId?: string;
}

export interface ChatFolder {
  id: string;
  name: string;
}

export interface ChatbotDataType {
  username: string;
  chatSessions: ChatSession[];
  folders: ChatFolder[];
  activeChatId?: string;
}

export interface UserSettingsType {
  profile: {
    name: string;
    email: string;
    role: string;
  };
  customization: {
    companyLogo: string | null;
    themeColor: string;
    mode: 'light' | 'dark' | 'auto';
    language: string;
    welcomeMessage: string;
  };
  security: {
    twoFactorEnabled: boolean;
    lastPasswordChange: string;
    lastLogin: string;
  };
}