# CompleteRecentQuest

A BetterDiscord plugin that automates completing Discord quests. It adds a floating action button and a sidecar quest selector so you can pick a quest, spoof the required activity, and track progress with live status updates.

## Features
- Floating action button with quest count badge and running indicator
- Quest selector panel with per-quest details, progress bars, expiry info, and desktop-only badges
- Locale-aware UI (English and Russian are bundled; falls back to English by default)
- Automated completion flows for supported quest types: video watch (desktop/mobile), play on desktop, stream on desktop, and activity heartbeat
- Auto-refresh of available quests while the selector is open
- Toast + status panel feedback for success, warnings, and errors

## Requirements
- BetterDiscord installed
- Discord Desktop for desktop-bound tasks (`PLAY_ON_DESKTOP`, `STREAM_ON_DESKTOP`) — mobile-only video tasks are handled virtually
- Network access to Discord APIs (quests, heartbeats, video progress)

## Installation
1. Download `CompleteRecentQuest.plugin.js`.
2. Place it in your BetterDiscord plugins folder (e.g., `%appdata%\BetterDiscord\plugins` on Windows).
3. Reload Discord or toggle the plugin on in **User Settings → BetterDiscord → Plugins**.

## Usage
1. Enable the plugin in BetterDiscord.
2. Click the floating quest button (bottom-right) to open the selector.
3. Pick a quest to start automation. The status panel shows the current phase and progress.
4. Close the status panel to stop the run early.

## Behavior Notes
- The plugin skips quest ID `1412491570820812933` by default (`IGNORED_QUEST_ID`).
- Desktop-only quests are disabled when running on the web client.
- Progress simulation for video quests is rate-limited to stay close to elapsed time and capped by `VIDEO_MAX_FUTURE_SECONDS`.
- Activity heartbeat quests send periodic heartbeats until the target duration is met.
- Quest lists auto-refresh every `30s` while the selector is open.

## Localization
- Locale is detected from Discord user settings; falls back to `navigator.language`, then to `ru`.
- Available bundles: English (`en*`) and Russian (`ru` default). Additions require extending `STRINGS_EN`/`STRINGS_RU` in the source.

## Safety and Limits
- Uses BetterDiscord Webpack stores and Discord native APIs; changes to Discord internals can break the plugin.
- Do not run multiple quest automations simultaneously; the plugin prevents concurrent runs.
- Some quests require an active desktop client session. The plugin will warn and abort when prerequisites are missing.

## Troubleshooting
- **No quests listed:** Ensure you have accepted a quest in Discord, then press refresh. Expired or completed quests are filtered out.
- **Desktop-only badge shown:** Start Discord Desktop; web clients cannot satisfy those quests.
- **Quest already running warning:** Wait for the current run to finish or close its status panel to stop it.
- **Progress stuck:** Check the console for errors; Discord API responses can reject spoofed progress.

## Development
- Single-file plugin: `CompleteRecentQuest.plugin.js`.
- Constants for timing, speeds, and IDs are at the top of the file.
- UI components: `FloatingMenuButton`, `QuestSelectorPanel`, `StatusPanel`.
- Runner logic: `QuestTaskRunner` orchestrates quest selection and per-task flows.

## License
Licensed under the Open Software License version 3.0 (OSL-3.0). See the license header in `CompleteRecentQuest.plugin.js` and https://opensource.org/license/osl-3-0-php.
