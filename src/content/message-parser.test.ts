import { beforeEach, describe, expect, it, vi } from 'vitest';
import { extractUserIdFromAvatarUrl, findMessageElements } from './discord-dom-adapter';
import { parseDiscordMessageNode } from './message-parser';

function renderFixture(html: string): Element {
  document.body.innerHTML = `
    <h1>general</h1>
    <ol data-list-id="chat-messages">
      ${html}
    </ol>
  `;

  const element = document.querySelector('[id^="chat-messages-"]');
  if (!element) {
    throw new Error('Fixture did not render a message element');
  }
  return element;
}

describe('Discord message parser', () => {
  beforeEach(() => {
    vi.setSystemTime(1_700_000_000_000);
  });

  it('extracts a normal server message', () => {
    const node = renderFixture(`
      <li id="chat-messages-111-222">
        <img src="https://cdn.discordapp.com/avatars/111/avatarhash.webp" alt="@alice" />
        <h3><span class="username">Alice</span></h3>
        <div id="message-content-222">Hello world</div>
      </li>
    `);

    expect(parseDiscordMessageNode(node, 'https://discord.com/channels/server-1/channel-1')).toMatchObject({
      messageId: '222',
      authorUserId: '111',
      authorUsername: 'Alice',
      authorDisplayName: 'Alice',
      serverId: 'server-1',
      channelId: 'channel-1',
      channelName: 'general',
      content: 'Hello world',
    });
  });

  it('walks backward for grouped consecutive messages without author DOM', () => {
    document.body.innerHTML = `
      <h1>general</h1>
      <ol data-list-id="chat-messages">
        <li id="chat-messages-111-222">
          <img src="https://cdn.discordapp.com/avatars/111/avatarhash.webp" alt="@alice" />
          <h3><span class="username">Alice</span></h3>
          <div id="message-content-222">First</div>
        </li>
        <li id="chat-messages-111-223">
          <div id="message-content-223">Second</div>
        </li>
      </ol>
    `;

    const grouped = document.querySelector('#chat-messages-111-223');
    expect(grouped).toBeTruthy();
    expect(parseDiscordMessageNode(grouped as Element, 'https://discord.com/channels/server-1/channel-1')).toMatchObject({
      messageId: '223',
      authorUserId: '111',
      authorUsername: 'Alice',
      content: 'Second',
    });
  });

  it('handles attachment-only or no-text messages', () => {
    const node = renderFixture(`
      <li id="chat-messages-111-224">
        <img src="https://cdn.discordapp.com/avatars/111/avatarhash.webp" alt="@alice" />
        <h3><span class="username">Alice</span></h3>
        <a href="https://example.test/file.png">file.png</a>
      </li>
    `);

    expect(parseDiscordMessageNode(node, 'https://discord.com/channels/server-1/channel-1')?.content).toBeUndefined();
  });

  it('extracts direct-message channel IDs without server IDs', () => {
    const node = renderFixture(`
      <li id="chat-messages-111-225">
        <img src="https://cdn.discordapp.com/avatars/111/avatarhash.webp" alt="@alice" />
        <h3><span class="username">Alice</span></h3>
        <div id="message-content-225">DM</div>
      </li>
    `);

    expect(parseDiscordMessageNode(node, 'https://discord.com/channels/@me/dm-1')).toMatchObject({
      serverId: undefined,
      channelId: 'dm-1',
    });
  });

  it('does not infer user IDs from default avatars', () => {
    expect(extractUserIdFromAvatarUrl('https://cdn.discordapp.com/embed/avatars/1.png')).toBeUndefined();
  });

  it('finds every message element inside a batched wrapper node', () => {
    document.body.innerHTML = `
      <div id="batch">
        <li id="chat-messages-111-226">
          <div id="message-content-226">First batch message</div>
        </li>
        <li id="chat-messages-111-227">
          <div id="message-content-227">Second batch message</div>
        </li>
      </div>
    `;

    const batch = document.querySelector('#batch');
    expect(batch).toBeTruthy();
    expect(findMessageElements(batch as Element).map((element) => element.id)).toEqual([
      'chat-messages-111-226',
      'chat-messages-111-227',
    ]);
  });
});
