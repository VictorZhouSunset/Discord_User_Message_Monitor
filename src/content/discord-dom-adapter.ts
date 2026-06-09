export const DISCORD_SELECTORS = {
  messageNode:
    '[id^="chat-messages-"], [data-list-item-id^="chat-messages___chat-messages-"], li[class*="messageListItem"]',
  messageGroup:
    '[class*="messageGroup"], [class*="messageListItem"], [id^="chat-messages-"], [data-list-item-id^="chat-messages___chat-messages-"]',
  messageContent: '[id^="message-content-"], [class*="messageContent"]',
  author:
    '[class*="username"], h3 [role="button"], h3 span, [data-text-variant="text-md/semibold"]',
  avatar:
    'img[src*="cdn.discordapp.com/avatars/"], img[src*="cdn.discordapp.com/embed/avatars/"]',
  chatContainer:
    '[data-list-id="chat-messages"], ol[class*="scrollerInner"], div[class*="chatContent"] [role="list"]',
  channelName:
    '[data-list-item-id^="channels___"], [aria-label*="Channel header"], h1, [class*="titleWrapper"] h1',
} as const;

export function findMessageElement(node: Node): Element | undefined {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return undefined;
  }

  const element = node as Element;
  if (element.matches(DISCORD_SELECTORS.messageNode)) {
    return element;
  }

  return element.querySelector(DISCORD_SELECTORS.messageNode) ?? undefined;
}

export function findMessageElements(node: Node): Element[] {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return [];
  }

  const element = node as Element;
  const messages = Array.from(element.querySelectorAll(DISCORD_SELECTORS.messageNode));
  if (element.matches(DISCORD_SELECTORS.messageNode)) {
    return [element, ...messages];
  }

  return messages;
}

export function findChatContainer(): Element | undefined {
  return document.querySelector(DISCORD_SELECTORS.chatContainer) ?? undefined;
}

export function extractMessageId(messageElement: Element): string | undefined {
  const candidates = [
    messageElement.id,
    messageElement.getAttribute('data-list-item-id'),
    messageElement.querySelector('[id^="message-content-"]')?.id,
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    const match = candidate.match(/chat-messages-\d+-(\d+)/) ?? candidate.match(/message-content-(\d+)/);
    if (match?.[1]) {
      return match[1];
    }
  }

  return undefined;
}

export function extractUserIdFromAvatarUrl(src: string | undefined): string | undefined {
  if (!src) {
    return undefined;
  }

  const match = src.match(/cdn\.discordapp\.com\/avatars\/([^/]+)\//);
  return match?.[1];
}

export function readText(element: Element | undefined | null): string | undefined {
  const text = element?.textContent?.replace(/\s+/g, ' ').trim();
  return text ? text : undefined;
}

function findPreviousAuthorContext(messageElement: Element): Element | undefined {
  let current: Element | null = messageElement;

  for (let depth = 0; depth < 4 && current; depth += 1) {
    let sibling = current.previousElementSibling;
    let inspected = 0;

    while (sibling && inspected < 12) {
      if (
        sibling.querySelector(DISCORD_SELECTORS.author) ||
        sibling.querySelector(DISCORD_SELECTORS.avatar)
      ) {
        return sibling;
      }

      sibling = sibling.previousElementSibling;
      inspected += 1;
    }

    current = current.parentElement;
  }

  return undefined;
}

export function findAuthorContext(messageElement: Element): Element {
  if (
    messageElement.querySelector(DISCORD_SELECTORS.author) ||
    messageElement.querySelector(DISCORD_SELECTORS.avatar)
  ) {
    return messageElement;
  }

  const closestGroup = messageElement.closest(DISCORD_SELECTORS.messageGroup);
  if (
    closestGroup &&
    (closestGroup.querySelector(DISCORD_SELECTORS.author) ||
      closestGroup.querySelector(DISCORD_SELECTORS.avatar))
  ) {
    return closestGroup;
  }

  return findPreviousAuthorContext(messageElement) ?? messageElement;
}

export function extractRouteScope(locationHref: string): {
  serverId?: string;
  channelId?: string;
} {
  try {
    const url = new URL(locationHref);
    const [, channelsSegment, serverId, channelId] = url.pathname.split('/');

    if (channelsSegment !== 'channels') {
      return {};
    }

    return {
      serverId: serverId && serverId !== '@me' ? serverId : undefined,
      channelId,
    };
  } catch {
    return {};
  }
}

export function extractVisibleChannelName(): string | undefined {
  const title = document.querySelector(DISCORD_SELECTORS.channelName);
  return readText(title);
}
