// Import all tool definitions and handlers
import { getProfileByIdTool, handler as getProfileByIdHandler } from './get-profile-by-id.js';
import {
  getProfileByEmailTool,
  handler as getProfileByEmailHandler,
} from './get-profile-by-email.js';
import { getInterestsByIdTool, handler as getInterestsByIdHandler } from './get-interests-by-id.js';
import {
  getInterestsByEmailTool,
  handler as getInterestsByEmailHandler,
} from './get-interests-by-email.js';
import { getAvatarByIdTool, handler as getAvatarByIdHandler } from './get-avatar-by-id.js';
import { getAvatarByEmailTool, handler as getAvatarByEmailHandler } from './get-avatar-by-email.js';

// Export all tool definitions
export const tools = [
  getProfileByIdTool,
  getProfileByEmailTool,
  getInterestsByIdTool,
  getInterestsByEmailTool,
  getAvatarByIdTool,
  getAvatarByEmailTool,
];

// Export a map of tool names to handlers
export const handlers = {
  [getProfileByIdTool.name]: getProfileByIdHandler,
  [getProfileByEmailTool.name]: getProfileByEmailHandler,
  [getInterestsByIdTool.name]: getInterestsByIdHandler,
  [getInterestsByEmailTool.name]: getInterestsByEmailHandler,
  [getAvatarByIdTool.name]: getAvatarByIdHandler,
  [getAvatarByEmailTool.name]: getAvatarByEmailHandler,
};
