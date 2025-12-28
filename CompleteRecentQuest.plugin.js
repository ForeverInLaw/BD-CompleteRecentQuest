/**
 * @name CompleteRecentQuest
 * @author ForeverInLaw
 * @authorLink https://github.com/ForeverInLaw
 * @version 2.0.0
 * @source https://github.com/ForeverInLaw/BD-CompleteRecentQuest
 * @updateUrl https://raw.githubusercontent.com/ForeverInLaw/BD-CompleteRecentQuest/refs/heads/main/CompleteRecentQuest.plugin.js
 * @description Plugin for completing Discord quests with a convenient floating selection menu.
 */
/*@cc_on@if(@_jscript)WScript.Quit();@else@*/

/*    ***** ATTRIBUTION NOTICE *****
 *
 * CompleteRecentQuest is a free BetterDiscord plugin that automates completing Discord quests.
 *
 * Copyright (c) 2025 ForeverInLaw
 *
 * Licensed under the Open Software License version 3.0 (OSL-3.0).
 * You may use, distribute, and modify this code under the terms of this license.
 *
 * Derivative works must be licensed under OSL-3.0.
 *
 * Removal or modification of this notice in the source code of any Derivative Work
 * of this software violates the terms of the license.
 *
 * This software is provided on an "AS IS" BASIS and WITHOUT WARRANTY, either express or implied,
 * including, without limitation, the warranties of non-infringement, merchantability or fitness for a particular purpose.
 * THE ENTIRE RISK AS TO THE QUALITY OF THIS SOFTWARE IS WITH YOU.
 *
 * You should have received a copy of the license agreement alongside this file.
 * If not, please visit https://opensource.org/license/osl-3-0-php
 *
 */

// Quest ID to ignore, should be skipped
const IGNORED_QUEST_ID = "1412491570820812933";

// Timing constants for quest completion
const VIDEO_PROGRESS_INTERVAL_MS = 1000;     // Interval for video progress updates
const VIDEO_SPEED_MULTIPLIER = 7;            // Speed multiplier for video progress
const VIDEO_MAX_FUTURE_SECONDS = 10;         // Max seconds ahead of real time
const ACTIVITY_HEARTBEAT_INTERVAL_MS = 20000; // Interval for activity heartbeat
const ACTIVITY_MAX_HEARTBEAT_ATTEMPTS = 90;   // Max heartbeats (~30 min)
const ACTIVITY_STALL_LIMIT = 10;              // Fail if no progress across N heartbeats
const PROGRESS_WAIT_TIMEOUT_MS = 15 * 60 * 1000; // Max wait for progress (15 min)
const QUEST_REFRESH_INTERVAL_MS = 30000;      // Auto-refresh quests interval
const PROGRESS_CHECK_INTERVAL_MS = 1000;      // Interval for checking desktop/stream progress
const PID_RANDOM_MIN = 1000;                  // Lower bound for fake PID generation
const PID_RANDOM_RANGE = 30000;               // Range size for fake PID generation
const STATUS_AUTO_DISMISS_DEFAULT_MS = 4000;  // Default status auto-dismiss delay
const PANEL_FADE_DURATION_MS = 500;           // Panel fade-out animation duration
const PROGRESS_JUMP_THRESHOLD = 0.5;          // Threshold to treat real progress jump as authoritative
const STAR_ICON_PATH = "M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z";
const CLOSE_ICON_PATH = "M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z";
const REFRESH_ICON_PATH = "M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z";
const DEFAULT_LOCALE_FALLBACK = "en";

const createSvgIcon = (pathD, viewBox = "0 0 24 24") => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", viewBox);
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathD);
  svg.appendChild(path);
  return svg;
};

const getRussianQuestSuffix = count => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "а";
  return "ов";
};

const STRINGS_RU = {
  availableQuestsTitle: "Доступные квесты",
  availableQuestsCount: count => `${count} квест${getRussianQuestSuffix(count)} доступно`,
  loadingSubtitle: "Загрузка...",
  noQuestsText: "Нет доступных квестов",
  noQuestsHint: "Примите квест в Discord и обновите список",
  desktopOnlyBadge: "Только Desktop",
  expiresInDays: days => `Осталось ${days} дн.`,
  minutesShort: "мин",
  questActiveTitle: "Quest Active",
  completedTitle: "Completed",
  errorTitle: "Error",
  taskDone: "Задача завершена",
  checkConsole: "Проверьте консоль для подробностей",
  searchingQuests: "Ищем доступные квесты...",
  questsNotFoundStatus: "Квесты не найдены",
  warningQuestRunning: "Квест уже выполняется",
  preparing: "Подготовка...",
  userStopped: "Выполнение квеста остановлено пользователем",
  spoofGame: appName => `Спуфаем игру ${appName}`,
  videoSpoofing: questName => `Спуфаем видео-просмотр для "${questName}"`,
  videoDone: "Видео-квест завершен",
  desktopRequired: "Для завершения квеста требуется Discord Desktop App",
  streamSpoofing: appName => `Спуфаем стрим приложения ${appName}`,
  activityHeartbeat: questName => `Завершаем квест "${questName}"`,
  activityHeartbeatDetail: "Отправляем heartbeat каждые 20 сек.",
  activityAttemptsExceeded: "Превышен лимит ожидания активности",
  activityStalled: "Прогресс активности не обновляется",
  activityHeartbeatError: "Ошибка heartbeat активности",
  activityProgress: (done, total) => `Прогресс активности: ${Math.floor(done)}/${total}`,
  noVoiceChannel: "Не найден голосовой канал для создания stream_key",
  detectedQuest: summary => `Обнаружен квест: ${summary}`,
  questNotFound: "Нет доступных невыполненных квестов",
  questNotFoundProgress: "Попробуйте принять новый Quest и снова включить плагин",
  questCompleteToast: questName => `Квест "${questName}" завершен`,
  questCompleteStatus: questName => `Квест "${questName}" завершен`,
  unknownTask: taskName => `Неизвестный тип задания: ${taskName}`,
  refreshFailed: "Не удалось загрузить квесты",
  progressTimeout: "Таймаут ожидания прогресса",
  storeFetchFailed: label => `Не удалось получить ${label}`,
  missingTaskConfig: "У квеста отсутствует taskConfig",
  unsupportedTaskConfig: "Поддерживаемая задача не найдена в taskConfig",
  invalidAppId: "Неверный формат ID приложения",
  appDataFetchFailed: "Не удалось получить данные приложения для спуфинга",
  missingWindowsExecutable: "В приложении отсутствует Windows executable",
  waitingMinutes: minutes => `Ожидаем ${minutes} мин.`,
  taskProgress: (task, done, total) => `Прогресс ${task}: ${done}/${total}`,
  genericProgress: (done, total) => `Прогресс: ${done}/${total}`,
  desktopProgressReadFailed: "Не удалось прочитать прогресс Desktop",
  streamProgressReadFailed: "Не удалось прочитать прогресс Stream",
  cleanupError: "Ошибка при очистке",
  runErrorLog: "Ошибка выполнения",
  questRunError: "Ошибка выполнения квеста",
  taskTypeWatchVideo: "Просмотр видео",
  taskTypePlayDesktop: "Играть на ПК",
  taskTypeStreamDesktop: "Стримить игру",
  taskTypeActivity: "Активность"
};

const STRINGS_EN = {
  availableQuestsTitle: "Available quests",
  availableQuestsCount: count => `${count} ${count === 1 ? "quest" : "quests"} available`,
  loadingSubtitle: "Loading...",
  noQuestsText: "No quests available",
  noQuestsHint: "Accept a quest in Discord and refresh the list",
  desktopOnlyBadge: "Desktop only",
  expiresInDays: days => `${days} day${days === 1 ? "" : "s"} left`,
  minutesShort: "min",
  questActiveTitle: "Quest Active",
  completedTitle: "Completed",
  errorTitle: "Error",
  taskDone: "Task completed",
  checkConsole: "Check console for details",
  searchingQuests: "Searching for available quests...",
  questsNotFoundStatus: "No quests found",
  warningQuestRunning: "A quest is already running",
  preparing: "Preparing...",
  userStopped: "Quest execution stopped by user",
  spoofGame: appName => `Spoofing game ${appName}`,
  videoSpoofing: questName => `Spoofing video watch for "${questName}"`,
  videoDone: "Video quest completed",
  desktopRequired: "Discord Desktop App is required to finish this quest",
  streamSpoofing: appName => `Spoofing stream for ${appName}`,
  activityHeartbeat: questName => `Finishing quest "${questName}"`,
  activityHeartbeatDetail: "Sending heartbeat every 20s.",
  activityAttemptsExceeded: "Activity wait limit exceeded",
  activityStalled: "Activity progress is not updating",
  activityHeartbeatError: "Activity heartbeat error",
  activityProgress: (done, total) => `Activity progress: ${Math.floor(done)}/${total}`,
  noVoiceChannel: "No voice channel found to create stream_key",
  detectedQuest: summary => `Quest detected: ${summary}`,
  questNotFound: "No available, uncompleted quests",
  questNotFoundProgress: "Accept a new Quest and start the plugin again",
  questCompleteToast: questName => `Quest "${questName}" completed`,
  questCompleteStatus: questName => `Quest "${questName}" completed`,
  unknownTask: taskName => `Unknown task type: ${taskName}`,
  refreshFailed: "Failed to load quests",
  progressTimeout: "Progress wait timed out",
  storeFetchFailed: label => `Failed to get ${label}`,
  missingTaskConfig: "Quest is missing taskConfig",
  unsupportedTaskConfig: "No supported task found in taskConfig",
  invalidAppId: "Invalid application ID format",
  appDataFetchFailed: "Failed to fetch app data for spoofing",
  missingWindowsExecutable: "Windows executable not found in application",
  waitingMinutes: minutes => `Waiting ${minutes} min.`,
  taskProgress: (task, done, total) => `Progress ${task}: ${done}/${total}`,
  genericProgress: (done, total) => `Progress: ${done}/${total}`,
  desktopProgressReadFailed: "Failed to read Desktop progress",
  streamProgressReadFailed: "Failed to read Stream progress",
  cleanupError: "Cleanup error",
  runErrorLog: "Execution error",
  questRunError: "Quest execution error",
  taskTypeWatchVideo: "Watch video",
  taskTypePlayDesktop: "Play on Desktop",
  taskTypeStreamDesktop: "Stream game",
  taskTypeActivity: "Activity"
};

const getLocaleCode = () => {
  try {
    const UserSettingsStore = BdApi?.Webpack?.getModule(m => m?.getLocale);
    const locale = UserSettingsStore?.getLocale?.();
    if (typeof locale === "string" && locale.trim()) return locale.toLowerCase();
  } catch (error) {
    console.warn("[CompleteRecentQuest] Failed to read locale", error);
  }
  const navLocale = typeof navigator === "undefined" ? null : navigator.language;
  return typeof navLocale === "string" && navLocale.trim() ? navLocale.toLowerCase() : DEFAULT_LOCALE_FALLBACK;
};

const getLocaleStrings = () => {
  const locale = getLocaleCode();
  if (locale?.startsWith("en")) return STRINGS_EN;
  // default to Russian for everything else
  return STRINGS_RU;
};

const STRINGS = getLocaleStrings();

class FloatingMenuButton {
  constructor(onToggle) {
    this.onToggle = onToggle;
    this.isOpen = false;
    this.questCount = 0;
    this.isRunning = false;
    this.#injectStyles();
    this.#createButton();
  }

  #injectStyles() {
    if (document.getElementById("quest-fab-styles")) return;
    const style = document.createElement("style");
    style.id = "quest-fab-styles";
    style.textContent = `
      .quest-fab {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: linear-gradient(135deg, #5865F2 0%, #7289DA 100%);
        cursor: pointer;
        z-index: 99998;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(88, 101, 242, 0.4), 0 0 0 0 rgba(88, 101, 242, 0.4);
        transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        border: none;
        outline: none;
      }
      .quest-fab:hover {
        transform: scale(1.08);
        box-shadow: 0 6px 28px rgba(88, 101, 242, 0.5), 0 0 0 0 rgba(88, 101, 242, 0.4);
      }
      .quest-fab:active {
        transform: scale(0.95);
      }
      .quest-fab.open {
        background: linear-gradient(135deg, #43b581 0%, #3ca374 100%);
        box-shadow: 0 4px 20px rgba(67, 181, 129, 0.4);
      }
      .quest-fab.running {
        animation: quest-fab-pulse 2s infinite;
      }
      @keyframes quest-fab-pulse {
        0%, 100% { box-shadow: 0 4px 20px rgba(88, 101, 242, 0.4), 0 0 0 0 rgba(88, 101, 242, 0.4); }
        50% { box-shadow: 0 4px 20px rgba(88, 101, 242, 0.4), 0 0 0 12px rgba(88, 101, 242, 0); }
      }
      .quest-fab-icon {
        width: 24px;
        height: 24px;
        fill: white;
        transition: transform 0.3s ease;
      }
      .quest-fab.open .quest-fab-icon {
        transform: rotate(45deg);
      }
      .quest-fab-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        min-width: 20px;
        height: 20px;
        padding: 0 6px;
        border-radius: 10px;
        background: #ed4245;
        color: white;
        font-size: 11px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'gg sans', 'Inter', sans-serif;
        box-shadow: 0 2px 8px rgba(237, 66, 69, 0.4);
        opacity: 0;
        transform: scale(0);
        transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      .quest-fab-badge.visible {
        opacity: 1;
        transform: scale(1);
      }
    `;
    document.head.appendChild(style);
  }

  #createButton() {
    this.button = document.createElement("button");
    this.button.className = "quest-fab";

    const icon = createSvgIcon(STAR_ICON_PATH);
    icon.classList.add("quest-fab-icon");
    this.button.appendChild(icon);

    this.badge = document.createElement("div");
    this.badge.className = "quest-fab-badge";
    this.button.appendChild(this.badge);

    this.button.addEventListener("click", () => {
      this.isOpen = !this.isOpen;
      this.button.classList.toggle("open", this.isOpen);
      this.onToggle?.(this.isOpen);
    });

    document.body.appendChild(this.button);
  }

  setQuestCount(count) {
    this.questCount = count;
    this.badge.textContent = count.toString();
    this.badge.classList.toggle("visible", count > 0);
  }

  setRunning(running) {
    this.isRunning = running;
    this.button.classList.toggle("running", running);
  }

  setOpen(open) {
    this.isOpen = open;
    this.button.classList.toggle("open", open);
  }

  destroy() {
    if (this.button) {
      this.button.remove();
    }
    this.button = null;
  }
}

class QuestSelectorPanel {
  constructor(onSelectQuest) {
    this.onSelectQuest = onSelectQuest;
    this.quests = [];
    this.isVisible = false;
    this.refreshCallback = null; // Track for cleanup
    this.#injectStyles();
    this.#createPanel();
  }

  #injectStyles() {
    if (document.getElementById("quest-selector-styles")) return;
    const style = document.createElement("style");
    style.id = "quest-selector-styles";
    style.textContent = `
      .quest-selector-panel {
        position: fixed;
        bottom: 88px;
        right: 24px;
        width: 360px;
        max-height: 450px;
        background: rgba(10, 10, 12, 0.95);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
        font-family: 'gg sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        z-index: 100000;
        overflow: hidden;
        opacity: 0;
        transform: translateY(16px) scale(0.96);
        pointer-events: none;
        transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      .quest-selector-panel.visible {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }
      .quest-selector-header {
        padding: 18px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .quest-selector-title {
        font-size: 14px;
        font-weight: 700;
        color: white;
        letter-spacing: 0.3px;
      }
      .quest-selector-subtitle {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
        margin-top: 2px;
      }
      .quest-selector-refresh {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      .quest-selector-refresh:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      .quest-selector-refresh svg {
        width: 16px;
        height: 16px;
        fill: rgba(255, 255, 255, 0.6);
        transition: transform 0.3s ease;
      }
      .quest-selector-refresh.spinning svg {
        animation: quest-spin 0.8s linear infinite;
      }
      @keyframes quest-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .quest-selector-list {
        padding: 12px;
        max-height: 340px;
        overflow-y: auto;
      }
      .quest-selector-list::-webkit-scrollbar {
        width: 6px;
      }
      .quest-selector-list::-webkit-scrollbar-track {
        background: transparent;
      }
      .quest-selector-list::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
      }
      .quest-item {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 14px;
        margin-bottom: 10px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .quest-item:last-child {
        margin-bottom: 0;
      }
      .quest-item:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.1);
        transform: translateX(4px);
      }
      .quest-item.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .quest-item.disabled:hover {
        transform: none;
      }
      .quest-item-header {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 10px;
      }
      .quest-item-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: linear-gradient(135deg, #5865F2 0%, #7289DA 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .quest-item-icon img {
        width: 24px;
        height: 24px;
        border-radius: 4px;
      }
      .quest-item-icon svg {
        width: 20px;
        height: 20px;
        fill: white;
      }
      .quest-item-info {
        flex: 1;
        min-width: 0;
      }
      .quest-item-name {
        font-size: 14px;
        font-weight: 600;
        color: white;
        margin-bottom: 3px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .quest-item-type {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .quest-item-progress-container {
        margin-bottom: 8px;
      }
      .quest-item-progress-bar {
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        overflow: hidden;
      }
      .quest-item-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        border-radius: 2px;
        transition: width 0.3s ease;
      }
      .quest-item-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .quest-item-progress-text {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.5);
      }
      .quest-item-expires {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.3);
      }
      .quest-item-desktop-badge {
        font-size: 9px;
        padding: 2px 6px;
        background: rgba(255, 193, 7, 0.15);
        color: #ffc107;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }
      .quest-empty {
        padding: 40px 20px;
        text-align: center;
      }
      .quest-empty-icon {
        width: 48px;
        height: 48px;
        margin: 0 auto 16px;
        opacity: 0.3;
      }
      .quest-empty-icon svg {
        width: 100%;
        height: 100%;
        fill: white;
      }
      .quest-empty-text {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.4);
        margin-bottom: 4px;
      }
      .quest-empty-hint {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.25);
      }
    `;
    document.head.appendChild(style);
  }

  #createPanel() {
    this.panel = document.createElement("div");
    this.panel.className = "quest-selector-panel";

    const header = document.createElement("div");
    header.className = "quest-selector-header";

    const titleContainer = document.createElement("div");
    const title = document.createElement("div");
    title.className = "quest-selector-title";
    title.textContent = STRINGS.availableQuestsTitle;

    this.subtitle = document.createElement("div");
    this.subtitle.className = "quest-selector-subtitle";
    this.subtitle.textContent = STRINGS.loadingSubtitle;

    titleContainer.append(title, this.subtitle);

    this.refreshBtn = document.createElement("button");
    this.refreshBtn.className = "quest-selector-refresh";
    const refreshIcon = createSvgIcon(REFRESH_ICON_PATH);
    this.refreshBtn.appendChild(refreshIcon);

    header.append(titleContainer, this.refreshBtn);

    this.list = document.createElement("div");
    this.list.className = "quest-selector-list";

    this.panel.append(header, this.list);
    document.body.appendChild(this.panel);
  }

  show() {
    this.isVisible = true;
    this.panel.classList.add("visible");
  }

  hide() {
    this.isVisible = false;
    this.panel.classList.remove("visible");
  }

  toggle(visible) {
    if (visible) {
      this.show();
    } else {
      this.hide();
    }
  }

  setLoading(loading) {
    this.refreshBtn.classList.toggle("spinning", loading);
  }

  onRefresh(callback) {
    // Remove previous listener if exists
    if (this.refreshCallback) {
      this.refreshBtn.removeEventListener("click", this.refreshCallback);
    }
    this.refreshCallback = callback;
    this.refreshBtn.addEventListener("click", callback);
  }

  updateQuests(quests, isDesktopApp) {
    this.quests = quests;
    this.subtitle.textContent = quests.length > 0
      ? STRINGS.availableQuestsCount(quests.length)
      : STRINGS.noQuestsText;

    while (this.list.firstChild) {
      this.list.firstChild.remove();
    }

    if (quests.length === 0) {
      this.#renderEmpty();
      return;
    }

    for (const quest of quests) {
      const item = this.#createQuestItem(quest, isDesktopApp);
      this.list.appendChild(item);
    }
  }

  #renderEmpty() {
    const empty = document.createElement("div");
    empty.className = "quest-empty";

    const iconWrapper = document.createElement("div");
    iconWrapper.className = "quest-empty-icon";
    iconWrapper.appendChild(createSvgIcon(STAR_ICON_PATH));

    const text = document.createElement("div");
    text.className = "quest-empty-text";
    text.textContent = STRINGS.noQuestsText;

    const hint = document.createElement("div");
    hint.className = "quest-empty-hint";
    hint.textContent = STRINGS.noQuestsHint;

    empty.append(iconWrapper, text, hint);
    this.list.appendChild(empty);
  }

  #createQuestItem(quest, isDesktopApp) {
    const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
    const taskName = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"]
      .find(key => taskConfig?.tasks?.[key]);
    
    const task = taskConfig?.tasks?.[taskName];
    const secondsNeeded = task?.target ?? 0;
    const configVersion = quest.config.configVersion ?? 2;
    const isLegacyDesktopStream = configVersion === 1 && ["PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP"].includes(taskName);
    const secondsDone = isLegacyDesktopStream
      ? (quest.userStatus?.streamProgressSeconds ?? 0)
      : (quest.userStatus?.progress?.[taskName]?.value ?? 0);
    const progress = secondsNeeded > 0 ? Math.min(1, Math.max(0, secondsDone / secondsNeeded)) : 0;
    
    const isDesktopOnly = ["PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP"].includes(taskName);
    const isDisabled = isDesktopOnly && !isDesktopApp;

    const expiresAt = new Date(quest.config.expiresAt);
    const now = new Date();
    const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

    const item = document.createElement("div");
    item.className = `quest-item${isDisabled ? " disabled" : ""}`;

    const appIcon = quest.config.application?.icon;
    const appId = quest.config.application?.id;
    const iconUrl = appIcon && appId
      ? `https://cdn.discordapp.com/app-icons/${appId}/${appIcon}.png?size=64`
      : null;

    // Build DOM safely to prevent XSS
    const header = document.createElement("div");
    header.className = "quest-item-header";

    const iconDiv = document.createElement("div");
    iconDiv.className = "quest-item-icon";
    if (iconUrl) {
      const img = document.createElement("img");
      img.src = iconUrl;
      img.alt = "";
      iconDiv.appendChild(img);
    } else {
      iconDiv.appendChild(createSvgIcon(STAR_ICON_PATH));
    }

    const infoDiv = document.createElement("div");
    infoDiv.className = "quest-item-info";

    const nameDiv = document.createElement("div");
    nameDiv.className = "quest-item-name";
    nameDiv.textContent = quest.config.messages?.questName ?? quest.config.application?.name ?? "Quest";

    const typeDiv = document.createElement("div");
    typeDiv.className = "quest-item-type";
    typeDiv.textContent = this.#formatTaskName(taskName);

    infoDiv.append(nameDiv, typeDiv);
    header.append(iconDiv, infoDiv);

    const progressContainer = document.createElement("div");
    progressContainer.className = "quest-item-progress-container";

    const progressBar = document.createElement("div");
    progressBar.className = "quest-item-progress-bar";

    const progressFill = document.createElement("div");
    progressFill.className = "quest-item-progress-fill";
    progressFill.style.width = `${(progress * 100).toFixed(1)}%`;

    progressBar.appendChild(progressFill);
    progressContainer.appendChild(progressBar);

    const footer = document.createElement("div");
    footer.className = "quest-item-footer";

    const progressText = document.createElement("span");
    progressText.className = "quest-item-progress-text";
    progressText.textContent = `${Math.floor(secondsDone / 60)}/${Math.floor(secondsNeeded / 60)} ${STRINGS.minutesShort}. (${Math.floor(progress * 100)}%)`;

    const statusSpan = document.createElement("span");
    if (isDisabled) {
      statusSpan.className = "quest-item-desktop-badge";
      statusSpan.textContent = STRINGS.desktopOnlyBadge;
    } else {
      statusSpan.className = "quest-item-expires";
      statusSpan.textContent = STRINGS.expiresInDays(daysLeft);
    }

    footer.append(progressText, statusSpan);
    item.append(header, progressContainer, footer);

    if (!isDisabled) {
      item.addEventListener("click", () => {
        this.onSelectQuest?.(quest);
      });
    }

    return item;
  }

  #formatTaskName(taskName) {
    const names = {
      "WATCH_VIDEO": STRINGS.taskTypeWatchVideo,
      "WATCH_VIDEO_ON_MOBILE": STRINGS.taskTypeWatchVideo,
      "PLAY_ON_DESKTOP": STRINGS.taskTypePlayDesktop,
      "STREAM_ON_DESKTOP": STRINGS.taskTypeStreamDesktop,
      "PLAY_ACTIVITY": STRINGS.taskTypeActivity
    };
    return names[taskName] ?? taskName;
  }

  destroy() {
    // Remove event listener to prevent memory leak
    if (this.refreshCallback && this.refreshBtn) {
      this.refreshBtn.removeEventListener("click", this.refreshCallback);
      this.refreshCallback = null;
    }
    this.panel?.remove();
    this.panel = null;
  }
}

class StatusPanel {
  constructor() {
    this.dynamicStyleIds = []; // Track dynamic styles for cleanup
    this.closeCallback = null;
    this.#injectStyles();

    this.root = document.createElement("div");
    this.root.className = "quest-panel";

    const header = document.createElement("div");
    header.className = "quest-panel-header";

    this.indicator = document.createElement("div");
    this.indicator.className = "quest-indicator";

    const title = document.createElement("div");
    this.title = title;
    title.className = "quest-title";
    title.textContent = STRINGS.questActiveTitle;

    this.closeBtn = document.createElement("button");
    this.closeBtn.className = "quest-panel-close";
    const closeIcon = createSvgIcon(CLOSE_ICON_PATH);
    closeIcon.setAttribute("width", "16");
    closeIcon.setAttribute("height", "16");
    closeIcon.querySelector("path")?.setAttribute("fill", "currentColor");
    this.closeBtn.appendChild(closeIcon);

    header.append(this.indicator, title, this.closeBtn);

    const content = document.createElement("div");
    content.className = "quest-content";

    this.statusEl = document.createElement("div");
    this.statusEl.className = "quest-status-text";

    this.progressSummary = document.createElement("div");
    this.progressSummary.className = "quest-details-text";

    content.append(this.statusEl, this.progressSummary);

    this.progressContainer = document.createElement("div");
    this.progressContainer.className = "quest-progress-container";

    this.progressTrack = document.createElement("div");
    this.progressTrack.className = "quest-progress-bar";

    this.progressFill = document.createElement("div");
    this.progressFill.className = "quest-progress-fill";

    this.progressTrack.appendChild(this.progressFill);
    this.progressContainer.appendChild(this.progressTrack);

    this.root.append(header, content, this.progressContainer);
    document.body.appendChild(this.root);

    requestAnimationFrame(() => this.root.classList.add("visible"));
  }

  #injectStyles() {
    if (document.getElementById("quest-panel-styles")) return;
    const style = document.createElement("style");
    style.id = "quest-panel-styles";
    style.textContent = `
      .quest-panel {
        position: fixed;
        bottom: 88px;
        right: 24px;
        width: 320px;
        background: rgba(10, 10, 12, 0.9);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 24px;
        box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
        font-family: 'gg sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        z-index: 99999;
        padding: 24px;
        color: white;
        opacity: 0;
        transform: translateY(16px) scale(0.96);
        transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
        box-sizing: border-box;
        overflow: hidden;
      }
      .quest-panel.visible {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      .quest-panel-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }
      .quest-panel-close {
        margin-left: auto;
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.4);
        transition: all 0.2s ease;
      }
      .quest-panel-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.8);
      }
      .quest-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #f0b232;
        box-shadow: 0 0 12px rgba(240, 178, 50, 0.6);
        position: relative;
      }
      .quest-indicator::after {
        content: '';
        position: absolute;
        top: -4px; left: -4px; right: -4px; bottom: -4px;
        border-radius: 50%;
        border: 1px solid rgba(240, 178, 50, 0.3);
        animation: quest-pulse 2s infinite;
      }
      @keyframes quest-pulse {
        0% { transform: scale(0.8); opacity: 0.5; }
        100% { transform: scale(1.5); opacity: 0; }
      }
      .quest-title {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.4);
      }
      .quest-status-text {
        font-size: 15px;
        font-weight: 600;
        margin-bottom: 6px;
        line-height: 1.4;
        color: #fff;
      }
      .quest-details-text {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.5);
        margin-bottom: 20px;
        line-height: 1.4;
        min-height: 18px;
      }
      .quest-progress-container {
        position: relative;
      }
      .quest-progress-bar {
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: hidden;
      }
      .quest-progress-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6, #d946ef);
        background-size: 200% 100%;
        animation: quest-gradient 3s linear infinite;
        border-radius: 4px;
        transition: width 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
        box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
      }
      @keyframes quest-gradient {
        0% { background-position: 100% 0; }
        100% { background-position: -100% 0; }
      }
    `;
    document.head.appendChild(style);
  }

  onClose(callback) {
    if (this.closeCallback && this.closeBtn) {
      this.closeBtn.removeEventListener("click", this.closeCallback);
    }
    this.closeCallback = callback;
    this.closeBtn?.addEventListener("click", callback);
  }

  setStatus(text) {
    if (this.statusEl) {
      this.statusEl.textContent = text ?? "";
    }
  }

  setProgress(summary, percent) {
    if (summary !== undefined && this.progressSummary) {
      const hasSummary = summary != null && summary !== "";
      this.progressSummary.textContent = hasSummary ? summary : "";
    }

    if (percent !== undefined && this.progressTrack) {
      const isNumber = typeof percent === "number" && Number.isFinite(percent);
      if (isNumber) {
        const clamped = Math.max(0, Math.min(1, percent));
        this.progressContainer.style.display = "block";
        this.progressFill.style.width = `${(clamped * 100).toFixed(1)}%`;
      } else {
        this.progressContainer.style.display = "none";
        this.progressFill.style.width = "0%";
      }
    }
  }

  markSuccess(text) {
    this.setStatus(text);
    this.setProgress(STRINGS.taskDone, 1);
    this.#setIndicator("#22c55e");
    this.title.textContent = STRINGS.completedTitle;
    this.title.style.color = "#22c55e";
  }

  markError(text) {
    this.setStatus(text);
    this.setProgress(STRINGS.checkConsole, null);
    this.#setIndicator("#ef4444");
    this.title.textContent = STRINGS.errorTitle;
    this.title.style.color = "#ef4444";
  }

  markRunning(text) {
    this.setStatus(text);
    this.setProgress(undefined, null);
    this.#setIndicator("#f0b232");
  }

  autoDismiss(delay = STATUS_AUTO_DISMISS_DEFAULT_MS) {
    this.cancelDismiss();
    this.dismissTimer = setTimeout(() => this.destroy(), delay);
  }

  cancelDismiss() {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
  }

  destroy() {
    this.cancelDismiss();
    if (this.root) {
        this.root.classList.remove("visible");
        setTimeout(() => {
            this.root?.remove?.();
            this.root = null;
      }, PANEL_FADE_DURATION_MS);
    }
    if (this.closeCallback && this.closeBtn) {
      this.closeBtn.removeEventListener("click", this.closeCallback);
      this.closeCallback = null;
    }
    // Clean up dynamic style elements
    if (this.dynamicStyleIds) {
      for (const styleId of this.dynamicStyleIds) {
        document.getElementById(styleId)?.remove();
      }
      this.dynamicStyleIds = [];
    }
    this.statusEl = null;
    this.progressSummary = null;
    this.progressTrack = null;
    this.progressFill = null;
    this.indicator = null;
  }

  #setIndicator(color) {
    if (!this.indicator) return;
    this.indicator.style.background = color;
    this.indicator.style.boxShadow = `0 0 12px ${color}80`;
    
    // Update pulse color
    const styleId = "quest-indicator-dynamic-" + color.replace('#', '');
    if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
            .quest-indicator[style*="background: ${color}"]::after,
            .quest-indicator[style*="background: rgb"]::after {
                border-color: ${color}40 !important;
            }
        `;
        document.head.appendChild(style);
        this.dynamicStyleIds.push(styleId); // Track for cleanup
    }
  }
}

class QuestTaskRunner {
  constructor(api, statusPanel) {
    this.api = api;
    this.statusPanel = statusPanel;
    this.abort = false;
    this.cleanupFns = [];
  }

  async run(selectedQuest = null) {
    this.#status(STRINGS.searchingQuests);
    const env = this.#loadEnvironment();
    try {
      const quest = selectedQuest ?? this.#selectQuest(env.QuestsStore);

      if (!quest) {
        this.#toast(STRINGS.questNotFound, "info");
        this.statusPanel?.markSuccess(STRINGS.questsNotFoundStatus);
        this.statusPanel?.setProgress(STRINGS.questNotFoundProgress);
        this.statusPanel?.autoDismiss();
        return;
      }

      const context = this.#buildQuestContext(quest);
      const summary = `${context.questName} (${context.taskName.replaceAll("_", " ")})`;
      this.#status(STRINGS.detectedQuest(summary));

      switch (context.taskName) {
        case "WATCH_VIDEO":
        case "WATCH_VIDEO_ON_MOBILE":
          await this.#completeVideoQuest(env, context);
          break;
        case "PLAY_ON_DESKTOP":
          await this.#completePlayOnDesktop(env, context);
          break;
        case "STREAM_ON_DESKTOP":
          await this.#completeStreamOnDesktop(env, context);
          break;
        case "PLAY_ACTIVITY":
          await this.#completePlayActivity(env, context);
          break;
        default:
          throw new Error(STRINGS.unknownTask(context.taskName));
      }

      this.#toast(STRINGS.questCompleteToast(context.questName), "success");
      this.statusPanel?.markSuccess(STRINGS.questCompleteStatus(context.questName));
      this.statusPanel?.autoDismiss(5000);
    } finally {
      this.#cleanupAll();
    }
  }

  stop() {
    this.abort = true;
    this.#log(STRINGS.userStopped);
    this.statusPanel?.markError(STRINGS.userStopped);
    this.statusPanel?.autoDismiss();
  }

  #loadEnvironment() {
    const hadDollar = Object.hasOwn(globalThis, "$");
    const originalDollar = hadDollar ? globalThis.$ : undefined;
    if (hadDollar) {
      delete globalThis.$;
      this.#registerCleanup(() => {
        globalThis.$ = originalDollar;
      });
    }
    const { Webpack } = BdApi;

    const pickStore = (predicate, key, label) => {
      const mod = Webpack.getModule(predicate, { defaultExport: false });
      const store = key ? mod?.[key] : mod;
      if (!store) throw new Error(STRINGS.storeFetchFailed(label));
      return store;
    };

    return {
      ApplicationStreamingStore: pickStore(m => m?.Z && Object.getPrototypeOf(m.Z)?.getStreamerActiveStreamMetadata, "Z", "ApplicationStreamingStore"),
      RunningGameStore: pickStore(m => m?.ZP?.getRunningGames, "ZP", "RunningGameStore"),
      QuestsStore: pickStore(m => m?.Z && Object.getPrototypeOf(m.Z)?.getQuest, "Z", "QuestsStore"),
      ChannelStore: pickStore(m => m?.Z && Object.getPrototypeOf(m.Z)?.getSortedPrivateChannels, "Z", "ChannelStore"),
      GuildChannelStore: pickStore(m => m?.ZP?.getAllGuilds, "ZP", "GuildChannelStore"),
      FluxDispatcher: pickStore(m => m?.Z && Object.getPrototypeOf(m.Z)?.flushWaitQueue, "Z", "FluxDispatcher"),
      api: pickStore(m => m?.tn?.get, "tn", "REST API")
    };
  }

  #selectQuest(questsStore) {
    const quests = questsStore?.quests ? [...questsStore.quests.values()] : [];
    return quests.find(q => q.id !== IGNORED_QUEST_ID && q.userStatus?.enrolledAt && !q.userStatus?.completedAt && new Date(q.config.expiresAt).getTime() > Date.now());
  }

  #buildQuestContext(quest) {
    const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
    if (!taskConfig?.tasks) throw new Error(STRINGS.missingTaskConfig);

    const taskName = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"].find(key => taskConfig.tasks[key]);
    if (!taskName) throw new Error(STRINGS.unsupportedTaskConfig);

    const task = taskConfig.tasks[taskName];

    return {
      quest,
      questId: quest.id,
      questName: quest.config.messages?.questName ?? quest.config.application?.name ?? "Quest",
      applicationId: quest.config.application?.id,
      applicationName: quest.config.application?.name ?? "Unknown App",
      secondsNeeded: task.target,
      secondsDone: quest.userStatus?.progress?.[taskName]?.value ?? 0,
      taskName,
      configVersion: quest.config.configVersion ?? 2,
      isDesktopApp: typeof DiscordNative !== "undefined",
      enrollmentTimestamp: quest.userStatus?.enrolledAt ? new Date(quest.userStatus.enrolledAt).getTime() : Date.now(),
      pid: Math.floor(Math.random() * PID_RANDOM_RANGE) + PID_RANDOM_MIN
    };
  }

  async #completeVideoQuest(env, context) {
    const { api } = env;
    const { quest, secondsNeeded, taskName, enrollmentTimestamp } = context;
    let secondsDone = context.secondsDone;
    let completed = false;

    this.#status(STRINGS.videoSpoofing(context.questName));

    while (!completed) {
      this.#ensureNotAborted();
      const maxAllowed = Math.floor((Date.now() - enrollmentTimestamp) / 1000) + VIDEO_MAX_FUTURE_SECONDS;
      const diff = maxAllowed - secondsDone;
      const timestamp = secondsDone + VIDEO_SPEED_MULTIPLIER;

      if (diff >= VIDEO_SPEED_MULTIPLIER) {
        const payload = { timestamp: Math.min(secondsNeeded, timestamp + Math.random()) };
        const res = await api.post({ url: `/quests/${quest.id}/video-progress`, body: payload });
        completed = Boolean(res?.body?.completed_at);
        secondsDone = Math.min(secondsNeeded, timestamp);
        this.#status(null, STRINGS.taskProgress(taskName, secondsDone, secondsNeeded));
      }

      if (timestamp >= secondsNeeded) {
        break;
      }

      await this.#sleep(VIDEO_PROGRESS_INTERVAL_MS);
    }

    if (!completed) {
      await api.post({ url: `/quests/${quest.id}/video-progress`, body: { timestamp: secondsNeeded } });
    }

    this.#status(STRINGS.videoDone, null);
  }

  async #completePlayOnDesktop(env, context) {
    if (!context.isDesktopApp) {
      throw new Error(STRINGS.desktopRequired);
    }

    const { RunningGameStore, FluxDispatcher, api, QuestsStore } = env;
    const { applicationId, applicationName, secondsNeeded, pid, questId } = context;

    // Validate applicationId to prevent injection
    if (!applicationId || !/^\d+$/.test(applicationId)) {
      throw new Error(STRINGS.invalidAppId);
    }

    const appDataRes = await api.get({ url: `/applications/public?application_ids=${applicationId}` });
    const appData = appDataRes?.body?.[0];
    if (!appData) throw new Error(STRINGS.appDataFetchFailed);

    const exe = appData.executables?.find(x => x.os === "win32");
    if (!exe) throw new Error(STRINGS.missingWindowsExecutable);

    const exeName = exe.name.replace(">", "");
    const fakeGame = {
      cmdLine: `C:\\Program Files\\${appData.name}\\${exeName}`,
      exeName,
      exePath: `c:/program files/${appData.name.toLowerCase()}/${exeName}`,
      hidden: false,
      isLauncher: false,
      id: applicationId,
      name: appData.name,
      pid,
      pidPath: [pid],
      processName: appData.name,
      start: Date.now()
    };

    const realGetRunningGames = RunningGameStore.getRunningGames;
    const realGetGameForPID = RunningGameStore.getGameForPID;
    const realGames = realGetRunningGames.call(RunningGameStore) ?? [];
    const fakeGames = [fakeGame];

    RunningGameStore.getRunningGames = () => fakeGames;
    RunningGameStore.getGameForPID = requestPid => fakeGames.find(x => x.pid === requestPid);

    const cleanupSpoof = this.#registerCleanup(() => {
      RunningGameStore.getRunningGames = realGetRunningGames;
      RunningGameStore.getGameForPID = realGetGameForPID;
      FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: fakeGames, added: [], games: realGames });
    });

    FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: realGames, added: fakeGames, games: fakeGames });
    const waitMinutes = Math.ceil((secondsNeeded - (context.secondsDone ?? 0)) / 60);
    this.#status(STRINGS.spoofGame(applicationName), STRINGS.waitingMinutes(waitMinutes));

    try {
      await this.#waitForProgress(
        () => this.#getDesktopPlayProgress(QuestsStore, questId, context.configVersion),
        secondsNeeded,
        PROGRESS_CHECK_INTERVAL_MS
      );
    } finally {
      cleanupSpoof();
    }
  }

  async #completeStreamOnDesktop(env, context) {
    if (!context.isDesktopApp) {
      throw new Error(STRINGS.desktopRequired);
    }

    const { ApplicationStreamingStore, QuestsStore } = env;
    const { applicationId, questId, secondsNeeded, pid } = context;

    const realFunc = ApplicationStreamingStore.getStreamerActiveStreamMetadata;
    ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({ id: applicationId, pid, sourceName: null });

    const cleanupStream = this.#registerCleanup(() => {
      ApplicationStreamingStore.getStreamerActiveStreamMetadata = realFunc;
    });

    this.#status(STRINGS.streamSpoofing(context.applicationName));
    try {
      await this.#waitForProgress(
        () => this.#getStreamProgress(QuestsStore, questId, context.configVersion),
        secondsNeeded,
        PROGRESS_CHECK_INTERVAL_MS
      );
    } finally {
      cleanupStream();
    }
  }

  async #completePlayActivity(env, context) {
    const { ChannelStore, GuildChannelStore, api } = env;
    const { quest, questName, secondsNeeded } = context;

    const privateChannels = ChannelStore.getSortedPrivateChannels?.() ?? [];
    const dmChannelId = privateChannels[0]?.id;
    const guilds = Object.values(GuildChannelStore.getAllGuilds?.() ?? {});
    const guildWithVoice = guilds.find(g => g?.VOCAL?.length > 0);
    const voiceChannelId = guildWithVoice?.VOCAL?.[0]?.channel?.id;
    const channelId = dmChannelId ?? voiceChannelId;
    if (!channelId) throw new Error(STRINGS.noVoiceChannel);

    const streamKey = `call:${channelId}:1`;
    let progress = context.secondsDone ?? 0;
    let lastProgress = progress;
    let stallCount = 0;

    this.#status(STRINGS.activityHeartbeat(questName), STRINGS.activityHeartbeatDetail);

    let attempt = 1;
    while (progress < secondsNeeded) {
      this.#ensureNotAborted();

      if (attempt > ACTIVITY_MAX_HEARTBEAT_ATTEMPTS) {
        throw new Error(STRINGS.activityAttemptsExceeded);
      }

      try {
        const res = await api.post({ url: `/quests/${quest.id}/heartbeat`, body: { stream_key: streamKey, terminal: false } });
        progress = res?.body?.progress?.PLAY_ACTIVITY?.value ?? progress;
      } catch (error) {
        this.#error(STRINGS.activityHeartbeatError, error);
      }

      if (progress <= lastProgress) {
        stallCount += 1;
        if (stallCount >= ACTIVITY_STALL_LIMIT) {
          throw new Error(STRINGS.activityStalled);
        }
      } else {
        stallCount = 0;
        lastProgress = progress;
      }

      const percent = secondsNeeded ? progress / secondsNeeded : 0;
      this.#status(null, STRINGS.activityProgress(progress, secondsNeeded), percent);
      await this.#sleep(ACTIVITY_HEARTBEAT_INTERVAL_MS);

      attempt += 1;
    }

    await api.post({ url: `/quests/${quest.id}/heartbeat`, body: { stream_key: streamKey, terminal: true } });
  }

  #getDesktopPlayProgress(questsStore, questId, configVersion) {
    try {
      const current = questsStore.getQuest?.(questId) ?? null;
      if (!current?.userStatus) return 0;
      if (configVersion === 1) return current.userStatus.streamProgressSeconds ?? 0;
      return Math.floor(current.userStatus.progress?.PLAY_ON_DESKTOP?.value ?? 0);
    } catch (error) {
      this.#error(STRINGS.desktopProgressReadFailed, error);
      return 0;
    }
  }

  #getStreamProgress(questsStore, questId, configVersion) {
    try {
      const current = questsStore.getQuest?.(questId) ?? null;
      if (!current?.userStatus) return 0;
      if (configVersion === 1) return current.userStatus.streamProgressSeconds ?? 0;
      return Math.floor(current.userStatus.progress?.STREAM_ON_DESKTOP?.value ?? 0);
    } catch (error) {
      this.#error(STRINGS.streamProgressReadFailed, error);
      return 0;
    }
  }

  async #waitForProgress(getProgress, target, intervalMs = 10000, maxDurationMs = PROGRESS_WAIT_TIMEOUT_MS) {
    const normalize = value => (typeof value === "number" && Number.isFinite(value) ? value : 0);
    let lastRealProgress = normalize(getProgress());
    let baselineProgress = lastRealProgress;
    let baselineTimestamp = Date.now();
    const startTimestamp = baselineTimestamp;

    while (true) {
      this.#ensureNotAborted();

      if (Date.now() - startTimestamp > maxDurationMs) {
        throw new Error(STRINGS.progressTimeout);
      }

      const realProgress = normalize(getProgress());
      if (realProgress > lastRealProgress + PROGRESS_JUMP_THRESHOLD) {
        lastRealProgress = realProgress;
        baselineProgress = realProgress;
        baselineTimestamp = Date.now();
      }

      const elapsedSeconds = (Date.now() - baselineTimestamp) / 1000;
      const estimatedProgress = baselineProgress + elapsedSeconds;
      const clampedEstimate = target ? Math.min(target, estimatedProgress) : estimatedProgress;
      const displayProgress = Math.max(realProgress, clampedEstimate);
      const percent = target ? Math.min(displayProgress / target, 1) : 0;
      this.#status(null, STRINGS.genericProgress(Math.floor(displayProgress), target), percent);

      if (realProgress >= target) break;
      await this.#sleep(intervalMs);
    }
  }

  async #sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
    this.#ensureNotAborted();
  }

  #registerCleanup(fn) {
    this.cleanupFns.push(fn);
    return () => {
      const index = this.cleanupFns.indexOf(fn);
      if (index !== -1) this.cleanupFns.splice(index, 1);
      try {
        fn();
      } catch (error) {
        this.#error(STRINGS.cleanupError, error);
      }
    };
  }

  #cleanupAll() {
    while (this.cleanupFns.length) {
      const fn = this.cleanupFns.pop();
      try {
        fn();
      } catch (error) {
        this.#error(STRINGS.cleanupError, error);
      }
    }
  }

  #ensureNotAborted() {
    if (this.abort) {
      throw new Error(STRINGS.userStopped);
    }
  }

  #log(message) {
    if (message) {
      console.log(`[CompleteRecentQuest] ${message}`);
    }
  }

  #status(message, detail, percent) {
    if (message) {
      this.#log(message);
      this.statusPanel?.setStatus(message);
    }
    if (detail !== undefined || percent !== undefined) {
      this.statusPanel?.setProgress(detail, percent);
    }
  }

  #error(message, error) {
    console.error(`[CompleteRecentQuest] ${message}`, error);
    this.#toast(`${message}: ${error?.message ?? error}`, "error");
  }

  #toast(message, type = "info") {
    this.api.UI?.showToast?.(message, { type });
  }
}

module.exports = class CompleteRecentQuest {
  constructor(meta) {
    this.meta = meta;
    this.api = new BdApi(meta.name);
    this.runner = null;
    this.questInFlight = false;
    this.statusPanel = null;
    this.floatingButton = null;
    this.questSelector = null;
    this.refreshInterval = null;
    this.isDesktopApp = typeof DiscordNative !== "undefined";
  }

  start() {
    // Create floating button
    this.floatingButton = new FloatingMenuButton((isOpen) => {
      this.questSelector?.toggle(isOpen);
      if (isOpen) {
        this.refreshQuests();
      }
    });

    // Create quest selector panel
    this.questSelector = new QuestSelectorPanel((quest) => {
      this.startQuest(quest);
    });

    this.questSelector.onRefresh(() => {
      this.refreshQuests();
    });

    // Initial quest load
    this.refreshQuests();

    // Auto-refresh quests periodically
    this.refreshInterval = setInterval(() => {
      if (this.questSelector?.isVisible) {
        this.refreshQuests();
      }
    }, QUEST_REFRESH_INTERVAL_MS);
  }

  stop() {
    if (this.runner) {
      this.runner.stop();
      this.runner = null;
    }
    this.questInFlight = false;
    if (this.statusPanel) {
      this.statusPanel.destroy();
      this.statusPanel = null;
    }
    if (this.floatingButton) {
      this.floatingButton.destroy();
      this.floatingButton = null;
    }
    if (this.questSelector) {
      this.questSelector.destroy();
      this.questSelector = null;
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  refreshQuests() {
    this.questSelector?.setLoading(true);
    
    try {
      const quests = this.#getAvailableQuests();
      this.questSelector?.updateQuests(quests, this.isDesktopApp);
      this.floatingButton?.setQuestCount(quests.length);
    } catch (error) {
      console.error(`[CompleteRecentQuest] ${STRINGS.refreshFailed}:`, error);
      this.api.UI?.showToast?.(STRINGS.refreshFailed, { type: "error" });
    } finally {
      this.questSelector?.setLoading(false);
    }
  }

  #getAvailableQuests() {
    const { Webpack } = BdApi;
    
    const mod = Webpack.getModule(m => m?.Z && Object.getPrototypeOf(m.Z)?.getQuest, { defaultExport: false });
    const QuestsStore = mod?.Z;
    
    if (!QuestsStore?.quests) {
      return [];
    }

    const quests = [...QuestsStore.quests.values()];
    return quests.filter(q =>
      q.id !== IGNORED_QUEST_ID &&
      q.userStatus?.enrolledAt &&
      !q.userStatus?.completedAt &&
      new Date(q.config.expiresAt).getTime() > Date.now()
    );
  }

  startQuest(quest) {
    if (this.questInFlight || this.runner) {
      this.api.UI?.showToast?.(STRINGS.warningQuestRunning, { type: "warning" });
      return;
    }

    this.questInFlight = true;

    // Close selector and update button state
    this.questSelector?.hide();
    this.floatingButton?.setOpen(false);
    this.floatingButton?.setRunning(true);

    // Create status panel
    if (this.statusPanel) {
      this.statusPanel.destroy();
    }
    this.statusPanel = new StatusPanel();
    this.statusPanel.setStatus(STRINGS.preparing);
    
    this.statusPanel.onClose(() => {
      if (this.runner) {
        this.runner.stop();
        this.runner = null;
      }
      this.statusPanel?.destroy();
      this.statusPanel = null;
      this.floatingButton?.setRunning(false);
    });

    // Run quest
    try {
      this.runner = new QuestTaskRunner(this.api, this.statusPanel);
      this.runner
        .run(quest)
        .catch(error => {
            console.error(`[CompleteRecentQuest] ${STRINGS.runErrorLog}`, error);
            this.statusPanel?.markError(error?.message ?? STRINGS.questRunError);
          this.statusPanel?.autoDismiss();
            this.api.UI?.showToast?.(error?.message ?? STRINGS.questRunError, { type: "error" });
        })
        .finally(() => {
          this.runner = null;
          this.questInFlight = false;
          this.floatingButton?.setRunning(false);
          this.refreshQuests();
        });
    } catch (error) {
      this.questInFlight = false;
      this.runner = null;
      throw error;
    }
  }
};
