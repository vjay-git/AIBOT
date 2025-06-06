# NextJS Chatbot UI

This project implements a modern chatbot interface built using NextJS and React.

## Recent Updates

### 🛠️ Chatbot UI Enhancements

The chatbot UI has been refactored and enhanced to address existing bugs, layout issues, and state inconsistencies:

1. ✅ **Delete Functionality Fixed**
   - Delete buttons for chats and folders now immediately update the UI without page refresh
   - Added local state management to reflect deletions instantly
   - Implemented proper confirmation dialogs

2. ✅ **Active Tab Highlighting**
   - Added tabbed navigation between Folders, Chats, and Bookmarks sections
   - Improved visual feedback for active tab with proper styling and transitions
   - Each tab maintains its own view state

3. ✅ **Bookmarking System**
   - Implemented seamless unbookmarking functionality in the Bookmarks view
   - Bookmark state syncs across all views (Chats, Folders, Bookmarks)
   - Added visual feedback for bookmarked items

4. ✅ **State Management**
   - Fixed state inconsistencies to ensure UI updates without refresh
   - Implemented optimistic updates for better user experience
   - Added proper error handling with state rollback on API failures

5. ✅ **Layout Improvements**
   - Expanded chat window to take better advantage of available space
   - Fixed scrolling and padding issues for a smoother experience
   - Added sticky search bar for message filtering

6. ✅ **Search Functionality**
   - Added floating search bar above the chat window
   - Implemented real-time message filtering
   - Improved visual design with proper spacing and animations

## Project Structure

```
components/
  ├── Chatbot/
  │   ├── styles/
  │   │   ├── ChatWindow.css     # Styles for chat window
  │   │   ├── MessageBubble.css  # Styles for message bubbles
  │   │   └── ChatMainContent.css # Main layout styles
  │   ├── ChatMainContent.tsx    # Main chat container component
  │   ├── ChatWindow.tsx         # Messages display area
  │   ├── MessageBubble.tsx      # Individual message component
  │   ├── InputBar.tsx           # Message input component
  │   └── ChatHeader.tsx         # Chat header with title/actions
  ├── SubcontentBar/
  │   ├── SubcontentBar.css      # Styles for sidebar
  │   └── SubcontentBar.tsx      # Sidebar component with folder/chat lists
types/
  └── index.ts                   # TypeScript type definitions
utils/
  ├── apiMocks.ts                # Mock API functions
  └── audio.ts                   # Audio utilities for notifications
```

## Key Features

- **Folder Organization**: Create and manage folders for chats
- **Bookmark System**: Save important chats for quick access
- **Search**: Filter chat history by content
- **Reply Threading**: Reply to specific messages in context
- **Drag and Drop**: Move chats between folders easily

## Mock API Integration

The current implementation uses mock API functions to simulate backend behaviors:

- `fetchChatById` - Load chat data
- `sendMessage` - Send a message and get a response
- `toggleBookmark` - Toggle bookmark status
- `createFolder` - Create a new folder
- `deleteChat` - Remove a chat
- `deleteFolder` - Remove a folder

## State Management

The UI implements a hybrid approach to state management:

1. **Local Component State**: For UI-specific states (active tabs, expandable sections)
2. **Optimistic Updates**: For immediate UI feedback before API confirmation
3. **Mock API Responses**: Simulating backend responses with realistic delays

## Future Improvements

Potential areas for future enhancement:

- Add proper backend integration with real API endpoints
- Implement full-text search indexing for faster message filtering
- Add theming support (light/dark mode)
- Implement user preferences and settings
- Add file/image attachments to messages #   E c h o  
 