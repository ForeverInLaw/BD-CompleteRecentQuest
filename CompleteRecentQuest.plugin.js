/**
 * @name CompleteRecentQuest
 * @author ForeverInLaw
 * @authorLink https://zaebal.dev
 * @description Plugin for completing Discord quests with a convenient floating selection menu.
 * @version 1.0.0
 * @source 
 * @updateUrl 
 */

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

const IGNORED_QUEST_ID = "1412491570820812933";

class StatusPanel {
  constructor() {
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
    title.textContent = "Quest Active";

    header.append(this.indicator, title);

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
        bottom: 32px;
        right: 32px;
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

  setStatus(text) {
    if (this.statusEl) this.statusEl.textContent = text ?? "";
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
    this.setProgress("Задача завершена", 1);
    this.#setIndicator("#22c55e");
    this.title.textContent = "Completed";
    this.title.style.color = "#22c55e";
  }

  markError(text) {
    this.setStatus(text);
    this.setProgress("Проверьте консоль для подробностей", null);
    this.#setIndicator("#ef4444");
    this.title.textContent = "Error";
    this.title.style.color = "#ef4444";
  }

  markRunning(text) {
    this.setStatus(text);
    this.setProgress(undefined, null);
    this.#setIndicator("#f0b232");
  }

  autoDismiss(delay = 4000) {
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
        }, 500);
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

  async run() {
    this.#status("Ищем доступные квесты...");
    const env = this.#loadEnvironment();
    const quest = this.#selectQuest(env.QuestsStore);

    if (!quest) {
      this.#toast("Нет доступных невыполненных квестов", "info");
      this.statusPanel?.markSuccess("Квесты не найдены");
      this.statusPanel?.setProgress("Попробуйте принять новый Quest и снова включить плагин");
      this.statusPanel?.autoDismiss();
      return;
    }

    const context = this.#buildQuestContext(quest);
    const summary = `${context.questName} (${context.taskName.replaceAll("_", " ")})`;
    this.#status(`Обнаружен квест: ${summary}`);

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
        throw new Error(`Неизвестный тип задания: ${context.taskName}`);
    }

    this.#toast(`Квест "${context.questName}" завершен`, "success");
    this.statusPanel?.markSuccess(`Квест "${context.questName}" завершен`);
    this.statusPanel?.autoDismiss(5000);
  }

  stop() {
    this.abort = true;
    this.#log("Выполнение квеста остановлено пользователем");
    this.statusPanel?.markError("Выполнение остановлено пользователем");
    this.statusPanel?.autoDismiss();
    this.#cleanupAll();
  }

  #loadEnvironment() {
    delete globalThis.$;
    const { Webpack } = BdApi;

    const pickStore = (predicate, key, label) => {
      const mod = Webpack.getModule(predicate, { defaultExport: false });
      const store = key ? mod?.[key] : mod;
      if (!store) throw new Error(`Не удалось получить ${label}`);
      return store;
    };

    return {
      ApplicationStreamingStore: pickStore(m => m?.Z?.__proto__?.getStreamerActiveStreamMetadata, "Z", "ApplicationStreamingStore"),
      RunningGameStore: pickStore(m => m?.ZP?.getRunningGames, "ZP", "RunningGameStore"),
      QuestsStore: pickStore(m => m?.Z?.__proto__?.getQuest, "Z", "QuestsStore"),
      ChannelStore: pickStore(m => m?.Z?.__proto__?.getSortedPrivateChannels, "Z", "ChannelStore"),
      GuildChannelStore: pickStore(m => m?.ZP?.getAllGuilds, "ZP", "GuildChannelStore"),
      FluxDispatcher: pickStore(m => m?.Z?.__proto__?.flushWaitQueue, "Z", "FluxDispatcher"),
      api: pickStore(m => m?.tn?.get, "tn", "REST API")
    };
  }

  #selectQuest(questsStore) {
    const quests = questsStore?.quests ? [...questsStore.quests.values()] : [];
    return quests.find(q => q.id !== IGNORED_QUEST_ID && q.userStatus?.enrolledAt && !q.userStatus?.completedAt && new Date(q.config.expiresAt).getTime() > Date.now());
  }

  #buildQuestContext(quest) {
    const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
    if (!taskConfig?.tasks) throw new Error("У квеста отсутствует taskConfig");

    const taskName = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"].find(key => taskConfig.tasks[key]);
    if (!taskName) throw new Error("Поддерживаемая задача не найдена в taskConfig");

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
      pid: Math.floor(Math.random() * 30000) + 1000
    };
  }

  async #completeVideoQuest(env, context) {
    const { api } = env;
    const { quest, secondsNeeded, taskName, enrollmentTimestamp } = context;
    let secondsDone = context.secondsDone;
    const maxFuture = 10;
    const speed = 7;
    const interval = 1000;
    let completed = false;

    this.#status(`Спуфим видео-просмотр для "${context.questName}"`);

    while (!completed) {
      this.#ensureNotAborted();
      const maxAllowed = Math.floor((Date.now() - enrollmentTimestamp) / 1000) + maxFuture;
      const diff = maxAllowed - secondsDone;
      const timestamp = secondsDone + speed;

      if (diff >= speed) {
        const payload = { timestamp: Math.min(secondsNeeded, timestamp + Math.random()) };
        const res = await api.post({ url: `/quests/${quest.id}/video-progress`, body: payload });
        completed = Boolean(res?.body?.completed_at);
        secondsDone = Math.min(secondsNeeded, timestamp);
        this.#status(null, `Прогресс ${taskName}: ${secondsDone}/${secondsNeeded}`);
      }

      if (timestamp >= secondsNeeded) {
        break;
      }

      await this.#sleep(interval);
    }

    if (!completed) {
      await api.post({ url: `/quests/${quest.id}/video-progress`, body: { timestamp: secondsNeeded } });
    }

    this.#status("Видео-квест завершен", null);
  }

  async #completePlayOnDesktop(env, context) {
    if (!context.isDesktopApp) {
      throw new Error("Для завершения квеста требуется Discord Desktop App");
    }

    const { RunningGameStore, FluxDispatcher, api, QuestsStore } = env;
    const { applicationId, applicationName, secondsNeeded, pid, questId } = context;

    const appDataRes = await api.get({ url: `/applications/public?application_ids=${applicationId}` });
    const appData = appDataRes?.body?.[0];
    if (!appData) throw new Error("Не удалось получить данные приложения для спуфинга");

    const exe = appData.executables?.find(x => x.os === "win32");
    if (!exe) throw new Error("В приложении отсутствует Windows executable");

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
    this.#status(`Спуфим игру ${applicationName}`, `Ожидаем ${Math.ceil((secondsNeeded - (context.secondsDone ?? 0)) / 60)} мин.`);

    await this.#waitForProgress(() => this.#getDesktopPlayProgress(QuestsStore, questId, context.configVersion), secondsNeeded, 1000);
    cleanupSpoof();
  }

  async #completeStreamOnDesktop(env, context) {
    if (!context.isDesktopApp) {
      throw new Error("Для завершения квеста требуется Discord Desktop App");
    }

    const { ApplicationStreamingStore, QuestsStore } = env;
    const { applicationId, questId, secondsNeeded, pid } = context;

    const realFunc = ApplicationStreamingStore.getStreamerActiveStreamMetadata;
    ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({ id: applicationId, pid, sourceName: null });

    const cleanupStream = this.#registerCleanup(() => {
      ApplicationStreamingStore.getStreamerActiveStreamMetadata = realFunc;
    });

    this.#status(`Спуфим стрим приложения ${context.applicationName}`);
    await this.#waitForProgress(() => this.#getStreamProgress(QuestsStore, questId, context.configVersion), secondsNeeded, 1000);
    cleanupStream();
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
    if (!channelId) throw new Error("Не найден голосовой канал для создания stream_key");

    const streamKey = `call:${channelId}:1`;
    let progress = context.secondsDone ?? 0;

    this.#status(`Завершаем квест "${questName}"`, "Отправляем heartbeat каждые 20 сек.");

    while (progress < secondsNeeded) {
      this.#ensureNotAborted();
      const res = await api.post({ url: `/quests/${quest.id}/heartbeat`, body: { stream_key: streamKey, terminal: false } });
      progress = res?.body?.progress?.PLAY_ACTIVITY?.value ?? progress;
      const percent = secondsNeeded ? progress / secondsNeeded : 0;
      this.#status(null, `Прогресс активности: ${Math.floor(progress)}/${secondsNeeded}`, percent);
      await this.#sleep(20000);
    }

    await api.post({ url: `/quests/${quest.id}/heartbeat`, body: { stream_key: streamKey, terminal: true } });
  }

  #getDesktopPlayProgress(questsStore, questId, configVersion) {
    const current = questsStore.getQuest?.(questId) ?? null;
    if (!current?.userStatus) return 0;
    if (configVersion === 1) return current.userStatus.streamProgressSeconds ?? 0;
    return Math.floor(current.userStatus.progress?.PLAY_ON_DESKTOP?.value ?? 0);
  }

  #getStreamProgress(questsStore, questId, configVersion) {
    const current = questsStore.getQuest?.(questId) ?? null;
    if (!current?.userStatus) return 0;
    if (configVersion === 1) return current.userStatus.streamProgressSeconds ?? 0;
    return Math.floor(current.userStatus.progress?.STREAM_ON_DESKTOP?.value ?? 0);
  }

  async #waitForProgress(getProgress, target, intervalMs = 10000) {
    const normalize = value => (typeof value === "number" && Number.isFinite(value) ? value : 0);
    let lastRealProgress = normalize(getProgress());
    let baselineProgress = lastRealProgress;
    let baselineTimestamp = Date.now();

    while (true) {
      this.#ensureNotAborted();

      const realProgress = normalize(getProgress());
      if (realProgress > lastRealProgress + 0.5) {
        lastRealProgress = realProgress;
        baselineProgress = realProgress;
        baselineTimestamp = Date.now();
      }

      const elapsedSeconds = (Date.now() - baselineTimestamp) / 1000;
      const estimatedProgress = baselineProgress + elapsedSeconds;
      const clampedEstimate = target ? Math.min(target, estimatedProgress) : estimatedProgress;
      const displayProgress = Math.max(realProgress, clampedEstimate);
      const percent = target ? Math.min(displayProgress / target, 1) : 0;
      this.#status(null, `Прогресс: ${Math.floor(displayProgress)}/${target}`, percent);

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
        this.#error("Ошибка при очистке", error);
      }
    };
  }

  #cleanupAll() {
    while (this.cleanupFns.length) {
      const fn = this.cleanupFns.pop();
      try {
        fn();
      } catch (error) {
        this.#error("Ошибка при очистке", error);
      }
    }
  }

  #ensureNotAborted() {
    if (this.abort) {
      throw new Error("Выполнение квеста остановлено");
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
    this.statusPanel = null;
  }

  start() {
    if (this.runner) {
      return;
    }

    if (this.statusPanel) {
      this.statusPanel.destroy();
    }

    this.statusPanel = new StatusPanel();
    this.statusPanel.setStatus("Подготовка...");

    this.runner = new QuestTaskRunner(this.api, this.statusPanel);
    this.runner
      .run()
      .catch(error => {
        console.error("[CompleteRecentQuest] Ошибка выполнения", error);
        this.statusPanel?.markError(error?.message ?? "Ошибка выполнения квеста");
        this.statusPanel?.autoDismiss();
        this.api.UI?.showToast?.(error?.message ?? "Ошибка выполнения квеста", { type: "error" });
      })
      .finally(() => {
        this.runner = null;
      });
  }

  stop() {
    if (this.runner) {
      this.runner.stop();
      this.runner = null;
    }
    if (this.statusPanel) {
      this.statusPanel.destroy();
      this.statusPanel = null;
    }
  }
};
