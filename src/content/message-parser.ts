import type { ObservedDiscordMessage } from '../shared/types';
import {
  DISCORD_SELECTORS,
  extractMessageId,
  extractRouteScope,
  extractUserIdFromAvatarUrl,
  extractVisibleChannelName,
  findAuthorContext,
  findMessageElement,
  readText,
} from './discord-dom-adapter';

function readAuthorMetadata(authorContext: Element): {
  authorUserId?: string;
  authorUsername?: string;
  authorDisplayName?: string;
} {
  const avatar = authorContext.querySelector<HTMLImageElement>(DISCORD_SELECTORS.avatar);
  const authorElement = authorContext.querySelector(DISCORD_SELECTORS.author);
  const authorName = readText(authorElement) ?? avatar?.alt?.replace(/^@/, '').trim();

  return {
    authorUserId: extractUserIdFromAvatarUrl(avatar?.src),
    authorUsername: authorName,
    authorDisplayName: authorName,
  };
}

function readMessageContent(messageElement: Element): string | undefined {
  const contentElement = messageElement.querySelector(DISCORD_SELECTORS.messageContent);
  return readText(contentElement);
}

export function parseDiscordMessageNode(node: Node, locationHref = window.location.href):
  | ObservedDiscordMessage
  | undefined {
  const messageElement = findMessageElement(node);
  if (!messageElement) {
    return undefined;
  }

  const authorContext = findAuthorContext(messageElement);
  const routeScope = extractRouteScope(locationHref);

  return {
    messageId: extractMessageId(messageElement),
    ...readAuthorMetadata(authorContext),
    serverId: routeScope.serverId,
    channelId: routeScope.channelId,
    channelName: extractVisibleChannelName(),
    content: readMessageContent(messageElement),
    observedAt: Date.now(),
  };
}
