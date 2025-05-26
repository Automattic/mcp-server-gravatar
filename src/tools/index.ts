// Import all tool definitions
import { getProfileByIdTool } from './get-profile-by-id.js';
import { getProfileByEmailTool } from './get-profile-by-email.js';
import { getInterestsByIdTool } from './get-interests-by-id.js';
import { getInterestsByEmailTool } from './get-interests-by-email.js';
import { getAvatarByIdTool } from './get-avatar-by-id.js';
import { getAvatarByEmailTool } from './get-avatar-by-email.js';

// Export all tool definitions
export const tools = [
  getProfileByIdTool,
  getProfileByEmailTool,
  getInterestsByIdTool,
  getInterestsByEmailTool,
  getAvatarByIdTool,
  getAvatarByEmailTool,
];
