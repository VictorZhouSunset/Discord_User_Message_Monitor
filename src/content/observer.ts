import type {
  CheckDiscordStructureResponse,
  DiscordMessageObservedRuntimeMessage,
  RuntimeMessage,
} from '../shared/types';
import { findChatContainer, findMessageElements } from './discord-dom-adapter';
import { parseDiscordMessageNode } from './message-parser';

let observer: MutationObserver | undefined;
let observedContainer: Element | undefined;
let currentHref = window.location.href;
let reconnectTimer: number | undefined;

function sendObservedMessage(message: DiscordMessageObservedRuntimeMessage['payload']): void {
  chrome.runtime.sendMessage({
    type: 'discord-message-observed',
    payload: message,
  } satisfies DiscordMessageObservedRuntimeMessage);
}

function processAddedNode(node: Node): void {
  for (const messageElement of findMessageElements(node)) {
    const message = parseDiscordMessageNode(messageElement);
    if (message) {
      sendObservedMessage(message);
    }
  }
}

function connectObserver(): void {
  const container = findChatContainer();
  if (!container || container === observedContainer) {
    return;
  }

  observer?.disconnect();
  observedContainer = container;
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        processAddedNode(node);
      }
    }
  });

  observer.observe(container, {
    childList: true,
    subtree: true,
  });
}

function scheduleReconnect(): void {
  if (reconnectTimer !== undefined) {
    clearTimeout(reconnectTimer);
  }

  reconnectTimer = window.setTimeout(() => {
    observedContainer = undefined;
    observer?.disconnect();
    connectObserver();
  }, 250);
}

function watchRouteChanges(): void {
  window.addEventListener('popstate', scheduleReconnect);

  window.setInterval(() => {
    if (window.location.href !== currentHref) {
      currentHref = window.location.href;
      scheduleReconnect();
      return;
    }

    if (observedContainer && !document.contains(observedContainer)) {
      scheduleReconnect();
    }
  }, 750);
}

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  if (message.type === 'check-discord-structure') {
    sendResponse({ ok: Boolean(findChatContainer()) } satisfies CheckDiscordStructureResponse);
  }

  return false;
});

connectObserver();
watchRouteChanges();
