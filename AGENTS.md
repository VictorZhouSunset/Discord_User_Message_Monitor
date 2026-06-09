````markdown

\# AGENTS.md



\## Project Overview



This project is a local browser extension for monitoring messages in Discord Web.



The extension observes messages that Discord has already rendered in the browser. When a configured Discord user sends a new message in a selected scope, the extension creates a local desktop notification.



The extension must work on both Windows and macOS through a Chromium-based browser such as:



\- Google Chrome

\- Microsoft Edge

\- Brave



The project should use browser extension APIs rather than platform-specific Windows or macOS APIs whenever possible.



\## Primary Goal



Allow the user to configure one or more Discord users to track through a graphical interface.



A tracked user may be identified by:



\- Discord user ID

\- Display name

\- Username



Discord user ID should be treated as the preferred and most reliable identifier. Username and display-name matching may be provided as fallback options.



When a matching user posts a message, the extension should display a local notification containing appropriate information such as:



\- Sender name

\- Server or group name

\- Channel name

\- A short message preview



The extension must remain read-only and must not perform Discord account actions.



\## Core User Flow



1\. The user installs the extension locally.

2\. The user opens Discord Web and signs in normally.

3\. The user opens the extension settings UI.

4\. The user adds a Discord username or user ID to the tracking list.

5\. The user optionally limits tracking to a server, group, or channel.

6\. The extension observes newly rendered Discord messages.

7\. When a tracked user sends a message, the extension creates a desktop notification.

8\. The user can enable, disable, edit, or remove tracked users from the UI.



\## Functional Requirements



\### Tracking Configuration



Provide a UI that allows the user to:



\- Add a tracked user

\- Remove a tracked user

\- Enable or disable a tracked user

\- Edit an existing tracked user

\- Enter a Discord user ID

\- Enter a username or display name

\- Select the preferred matching method

\- Optionally restrict tracking to a server

\- Optionally restrict tracking to a channel

\- Enable or disable message previews

\- Enable or disable notification sounds



The configuration should support multiple tracked users.



A possible configuration model is:



```ts

type TrackedUser = {

&#x20; id: string;

&#x20; enabled: boolean;



&#x20; discordUserId?: string;

&#x20; username?: string;

&#x20; displayName?: string;



&#x20; matchMode: "user-id" | "username" | "display-name";



&#x20; serverId?: string;

&#x20; channelId?: string;



&#x20; showMessagePreview: boolean;

&#x20; playSound: boolean;

};

```



The internal `id` is an extension-generated configuration ID and is separate from the Discord user ID.



\### Configuration UI



The extension should provide an Options page as the primary management interface.



A popup may provide quick access to:



\- Current monitoring status

\- Number of enabled tracked users

\- Pause or resume monitoring

\- Open Settings

\- Test notification



The Options page should contain:



\- A form for adding a tracked user

\- A list of current tracked users

\- Edit and delete controls

\- Enable and disable controls

\- Scope settings

\- Notification preferences

\- Clear local data control



The UI should work at common desktop window sizes on both Windows and macOS.



\### Discord Page Monitoring



Use a Manifest V3 content script on:



```text

https://discord.com/channels/\*

```



The content script should:



\- Run in the isolated extension world

\- Observe newly added DOM nodes with `MutationObserver`

\- Detect newly rendered Discord messages

\- Extract the sender identity

\- Extract the message text when available

\- Determine the current server and channel

\- Send normalized message metadata to the extension service worker



The content script must not:



\- Send messages through Discord

\- Click Discord controls

\- Modify messages

\- Add reactions

\- Automatically navigate between channels

\- Read authentication tokens

\- Access Discord cookies

\- Intercept Discord WebSocket traffic

\- Hook Discord internal JavaScript modules

\- Inject code into the page's main JavaScript world



\### Message Normalization



Convert detected messages into a stable internal format before matching:



```ts

type ObservedDiscordMessage = {

&#x20; messageId?: string;



&#x20; authorUserId?: string;

&#x20; authorUsername?: string;

&#x20; authorDisplayName?: string;



&#x20; serverId?: string;

&#x20; serverName?: string;



&#x20; channelId?: string;

&#x20; channelName?: string;



&#x20; content?: string;

&#x20; observedAt: number;

};

```



Matching logic should be separated from DOM extraction logic.



Do not spread Discord-specific DOM selectors throughout the codebase. Keep them in a dedicated adapter or parser module.



Suggested structure:



```text

src/

&#x20; content/

&#x20;   observer.ts

&#x20;   discord-dom-adapter.ts

&#x20;   message-parser.ts



&#x20; background/

&#x20;   service-worker.ts

&#x20;   notification-service.ts



&#x20; matching/

&#x20;   match-message.ts

&#x20;   normalize-identifier.ts



&#x20; storage/

&#x20;   settings-repository.ts

&#x20;   schema.ts



&#x20; options/

&#x20;   OptionsApp.tsx



&#x20; popup/

&#x20;   PopupApp.tsx



&#x20; shared/

&#x20;   types.ts

&#x20;   constants.ts

```



\### Identifier Matching



Use Discord user ID matching whenever a reliable user ID can be obtained.



Matching priority:



1\. Discord user ID

2\. Exact username

3\. Exact display name



Username and display-name matching should:



\- Trim whitespace

\- Be case-insensitive by default

\- Avoid substring matching

\- Avoid fuzzy matching unless explicitly enabled



Display names are not guaranteed to be unique. The UI should explain this limitation when the user selects display-name matching.



Do not infer that two users are the same based only on similar names.



\### Scope Matching



A tracked-user configuration may apply to:



\- Every visible Discord channel

\- A specific server

\- A specific channel

\- A direct-message conversation



Scope matching should use server IDs and channel IDs when available.



Names may be displayed in the UI but should not be the primary stored identifiers when stable IDs are available.



\### Notifications



Use the browser extension notifications API where supported.



Required permission:



```json

{

&#x20; "permissions": \[

&#x20;   "storage",

&#x20;   "notifications"

&#x20; ]

}

```



Notifications should be created by the extension service worker, not directly by the content script.



Notification behavior should:



\- Avoid duplicate notifications

\- Respect disabled tracking entries

\- Respect server and channel restrictions

\- Respect the message-preview setting

\- Avoid exposing full private messages by default

\- Limit preview length

\- Handle missing sender or channel information gracefully



Example notification:



```text

Discord activity



Alice posted in Project Server / general



“Deployment finished successfully.”

```



The extension should provide a Test Notification button so the user can verify Windows or macOS notification permissions.



\### Duplicate Prevention



Discord may rerender existing messages. A rerender must not create another notification.



Use one or more of:



\- Discord message ID

\- A short-lived in-memory cache

\- A bounded cache stored in extension session storage

\- A composite hash of sender, channel, message content, and timestamp



Prefer a Discord message ID when available.



Caches must have a maximum size and expiration policy.



\### Storage



Store all configuration locally with:



```ts

chrome.storage.local

```



Do not require a backend service.



Do not upload tracked usernames, IDs, or message content.



Storage access should be wrapped in a repository abstraction so it can be tested independently.



Validate loaded storage data before using it. Invalid or outdated data should fall back safely.



Include a schema version to support future migrations:



```ts

type StoredSettings = {

&#x20; schemaVersion: number;

&#x20; monitoringEnabled: boolean;

&#x20; trackedUsers: TrackedUser\[];

};

```

````markdown



\## Default Tracked Users



A tracked user may be marked as a default tracking target.



Default tracked users must remain configured across:



\- Discord channel changes

\- Browser restarts

\- Extension reloads

\- Computer restarts

\- Extension updates, when storage migration succeeds



The user should not need to re-enter or reselect default tracked users each time Discord Web is opened.



The Options page should allow the user to:



\- Mark or unmark a tracked user as default

\- Have multiple default tracked users

\- Temporarily disable a default tracked user without deleting it

\- Restore default tracking after monitoring is paused

\- See which users are currently active and which are saved but disabled



Default tracking configuration must be stored in `chrome.storage.local`.



Temporary runtime state, such as recently observed message IDs, must not overwrite the saved default configuration.



Update the tracked-user model to include:



```ts

type TrackedUser = {

&#x20; id: string;

&#x20; enabled: boolean;

&#x20; isDefault: boolean;



&#x20; discordUserId?: string;

&#x20; username?: string;

&#x20; displayName?: string;



&#x20; matchMode: "user-id" | "username" | "display-name";



&#x20; serverId?: string;

&#x20; channelId?: string;



&#x20; showMessagePreview: boolean;

&#x20; playSound: boolean;

};

```



The settings model should remain similar to:



```ts

type StoredSettings = {

&#x20; schemaVersion: number;

&#x20; monitoringEnabled: boolean;

&#x20; trackedUsers: TrackedUser\[];

};

```



When the extension starts, it should:



1\. Load saved settings from `chrome.storage.local`.

2\. Validate and migrate the stored data if necessary.

3\. Enable every tracked user where both conditions are true:



```ts

trackedUser.enabled === true

trackedUser.isDefault === true

```



4\. Begin monitoring without requiring the user to reopen the Options page.

5\. Preserve non-default tracked users in storage without activating them automatically.



Adding a new tracked user should provide a clearly labeled option such as:



```text

Use as a default tracking target

```



The default value for this option may be enabled, since most users adding a tracking target will expect it to remain active. The user must still be able to turn it off.



The popup should distinguish between:



\- Monitoring globally enabled or paused

\- Default tracked users

\- Temporarily enabled tracked users

\- Saved but disabled tracked users



Pausing monitoring should only change `monitoringEnabled`. It must not delete tracked users or remove their default status.



Removing a tracked user is the only normal UI action that should permanently delete that user's saved configuration.

````



\## Cross-Platform Requirements



The codebase must support Windows and macOS without platform-specific branches unless unavoidable.



Prefer:



\- Chrome Extension APIs

\- Standard browser APIs

\- Relative paths

\- Node.js scripts that work in PowerShell, Command Prompt, Bash, and zsh



Avoid:



\- Hard-coded Windows drive paths

\- Bash-only build scripts

\- macOS-only notification commands

\- PowerShell-only development commands

\- Native binaries unless clearly justified



Package scripts should be executable through:



```bash

npm run dev

npm run build

npm run test

npm run lint

```



Use Node.js for build and maintenance scripts instead of shell-specific scripts.



\## Recommended Technology



Preferred implementation:



\- TypeScript

\- Manifest V3

\- React for the Options and popup interfaces

\- Vite for building

\- Chrome Extension APIs

\- Vitest for unit tests

\- ESLint

\- Prettier



A framework such as Plasmo, WXT, or a custom Vite extension setup may be used, but avoid unnecessary framework lock-in.



The generated extension should be loadable as an unpacked extension in Chrome and Edge.



\## Manifest Requirements



Use the minimum permissions necessary.



A representative manifest may include:



```json

{

&#x20; "manifest\_version": 3,

&#x20; "name": "Discord User Activity Notifier",

&#x20; "version": "0.1.0",

&#x20; "permissions": \[

&#x20;   "storage",

&#x20;   "notifications"

&#x20; ],

&#x20; "host\_permissions": \[

&#x20;   "https://discord.com/channels/\*"

&#x20; ],

&#x20; "background": {

&#x20;   "service\_worker": "service-worker.js",

&#x20;   "type": "module"

&#x20; },

&#x20; "content\_scripts": \[

&#x20;   {

&#x20;     "matches": \[

&#x20;       "https://discord.com/channels/\*"

&#x20;     ],

&#x20;     "js": \[

&#x20;       "content.js"

&#x20;     ],

&#x20;     "run\_at": "document\_idle",

&#x20;     "world": "ISOLATED"

&#x20;   }

&#x20; ],

&#x20; "options\_page": "options.html",

&#x20; "action": {

&#x20;   "default\_popup": "popup.html"

&#x20; }

}

```



Do not request permissions such as:



\- `cookies`

\- `webRequest`

\- `debugger`

\- `<all\_urls>`



Do not add permissions without documenting why they are required.



\## Privacy and Security Boundaries



This is a local notification tool.



The project must not:



\- Collect Discord authentication tokens

\- Collect browser cookies

\- Connect to Discord Gateway as the user

\- Call undocumented Discord APIs using the user's session

\- Automate a normal Discord user account

\- Send messages or reactions

\- Scrape channels that the user has not opened

\- Transmit monitored message content to external services

\- Add analytics without explicit user consent

\- Log private message content in production



Message content should be held only as long as needed to perform matching, deduplication, and notification display.



Diagnostic logs should omit message bodies by default.



\## Discord DOM Stability



Discord's DOM structure, class names, and accessibility labels may change.



Code should assume selectors will eventually break.



Requirements:



\- Keep selectors centralized

\- Prefer semantic attributes and stable IDs when available

\- Avoid depending exclusively on generated CSS class names

\- Fail without crashing the Discord page

\- Log parser failures only in development mode

\- Make the parser independently testable with stored HTML fixtures

\- Avoid excessive DOM scanning



Use a single observer on the smallest reliable message-list ancestor. Process only added nodes instead of rescanning the entire document after every change.



If the correct message container is replaced during navigation, reconnect the observer.



\## Performance Requirements



The extension should have minimal impact on Discord Web.



Avoid:



\- Frequent polling

\- Full-page DOM scans

\- OCR

\- Screenshot capture

\- Repeated parsing of old messages

\- Unbounded caches

\- Large synchronous operations in mutation callbacks



Mutation callbacks should enqueue lightweight processing and return quickly.



Debounce observer reattachment and configuration refresh operations where appropriate.



\## Failure Handling



The extension should continue operating when:



\- Discord changes part of its DOM

\- A message has no text

\- A message contains only an image or attachment

\- The sender ID cannot be extracted

\- The user switches channels

\- Discord virtualizes or rerenders the message list

\- Browser notifications are disabled

\- Stored configuration is malformed

\- The extension service worker restarts



Failures should not modify or interrupt the Discord page.



The popup should show a useful status such as:



\- Monitoring active

\- Monitoring paused

\- Discord tab not detected

\- Notification permission unavailable

\- Discord page structure not recognized



\## Testing Requirements



\### Unit Tests



Add unit tests for:



\- User ID matching

\- Username matching

\- Display-name matching

\- Case normalization

\- Scope matching

\- Duplicate detection

\- Settings validation

\- Settings migration

\- Message-preview truncation



\### Parser Tests



Store sanitized Discord DOM fixtures and test:



\- Normal messages

\- Consecutive messages from the same sender

\- Replies

\- Edited messages

\- Messages with attachments

\- Messages with no text

\- Direct messages

\- Server channel messages



Do not include real private conversations in fixtures.



\### Manual Tests



Test on:



\- Windows with Chrome

\- Windows with Edge

\- macOS with Chrome



Verify:



\- Adding and removing tracked users

\- Switching tracking targets

\- Pausing monitoring

\- Browser restart persistence

\- Discord channel navigation

\- Duplicate prevention

\- Notification permission behavior

\- Background-tab behavior

\- Message-preview privacy setting



\## Development Priorities



Implement the project in this order:



1\. Manifest V3 project skeleton

2\. Shared data types

3\. Local settings storage

4\. Basic Options page

5\. Content-script message observation

6\. Discord DOM adapter

7\. Matching logic

8\. Background notification service

9\. Duplicate prevention

10\. Popup status controls

11\. Parser fixtures and tests

12\. Error states and UI polish



\## Initial Deliverable



The first usable version should support:



\- One or more tracked users

\- User ID or username matching

\- A settings UI

\- Local persistence

\- Monitoring the currently open Discord Web channel

\- Windows and macOS browser notifications

\- Pause and resume

\- Duplicate prevention

\- No external backend

\- No Discord account automation



Features such as synchronization across devices, cloud storage, automatic user discovery, or remote notifications are outside the initial scope.



\## Coding Guidelines



\- Use TypeScript strict mode.

\- Keep DOM parsing separate from matching logic.

\- Keep extension API calls behind small service abstractions.

\- Prefer pure functions for matching and normalization.

\- Do not use `any` unless the reason is documented.

\- Validate external and stored data at runtime.

\- Keep modules small and focused.

\- Add comments for Discord-specific workarounds.

\- Avoid comments that merely restate the code.

\- Do not silently broaden browser permissions.

\- Do not introduce a backend unless the requirement changes.

\- Preserve the read-only security boundary.



\## Definition of Done



A change is complete when:



\- It works in an unpacked Chromium extension build

\- It behaves consistently on Windows and macOS

\- It does not automate Discord account actions

\- It does not read authentication secrets

\- It persists configuration correctly

\- It avoids duplicate notifications

\- Relevant tests pass

\- The build passes TypeScript and lint checks

\- New permissions or privacy implications are documented

````



