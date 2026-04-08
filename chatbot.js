/* =========================================================
   Meridian AI Chatbot Widget  — chatbot.js
   Floating assistant for financemeridian.com
   Calls: https://meridian-ai.thimmaiah18tej.workers.dev/chat
   ========================================================= */

(function () {
  'use strict';

  const WORKER_URL = 'https://meridian-ai.thimmaiah18tej.workers.dev/chat';

  const SUGGESTED_QUESTIONS = [
    'How do I start investing in India?',
    'What is Nifty 50?',
    'SIP vs lump sum?',
    'Best credit card for me?',
    'Is Bitcoin legal in India?',
    'How to save tax in India?',
  ];

  // Pick 3 random suggestions
  function getRandomSuggestions() {
    const shuffled = [...SUGGESTED_QUESTIONS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }

  // ── Inject Google Font ──────────────────────────────────────────────────────
  if (!document.getElementById('meridian-outfit-font')) {
    const link = document.createElement('link');
    link.id   = 'meridian-outfit-font';
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(link);
  }

  // ── Styles ──────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --mer-bg:        #111b27;
      --mer-bg2:       #162030;
      --mer-bg3:       #1c2a3a;
      --mer-gold:      #c9a84c;
      --mer-gold-dim:  rgba(201,168,76,0.15);
      --mer-gold-dim2: rgba(201,168,76,0.08);
      --mer-green:     #2ecc71;
      --mer-green-dim: rgba(46,204,113,0.12);
      --mer-text:      #e8eef4;
      --mer-muted:     #6b8299;
      --mer-border:    rgba(255,255,255,0.07);
      --mer-radius:    14px;
      --mer-shadow:    0 8px 40px rgba(0,0,0,0.55);
      --mer-font:      'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* ── Bubble ── */
    #mer-bubble {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 99999;
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: linear-gradient(135deg, #c9a84c 0%, #a07830 100%);
      box-shadow: 0 4px 20px rgba(201,168,76,0.45);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      border: none;
      outline: none;
    }
    #mer-bubble:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 28px rgba(201,168,76,0.6);
    }
    #mer-bubble svg { pointer-events: none; }

    /* ── Window ── */
    #mer-window {
      position: fixed;
      bottom: 100px;
      right: 28px;
      z-index: 99998;
      width: 380px;
      height: 520px;
      background: var(--mer-bg);
      border-radius: var(--mer-radius);
      box-shadow: var(--mer-shadow);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: var(--mer-font);
      border: 1px solid var(--mer-border);
      transform: scale(0.92) translateY(16px);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), opacity 0.18s ease;
    }
    #mer-window.mer-open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }

    /* ── Header ── */
    #mer-header {
      background: var(--mer-bg2);
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--mer-border);
      flex-shrink: 0;
    }
    .mer-header-left { display: flex; align-items: center; gap: 10px; }
    .mer-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #c9a84c, #7a5c20);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      position: relative;
      flex-shrink: 0;
    }
    .mer-online-dot {
      position: absolute;
      bottom: 1px;
      right: 1px;
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--mer-green);
      border: 2px solid var(--mer-bg2);
    }
    .mer-title { font-weight: 700; font-size: 15px; color: var(--mer-gold); line-height: 1.2; }
    .mer-subtitle { font-size: 10.5px; color: var(--mer-muted); margin-top: 1px; }
    #mer-close {
      background: none;
      border: none;
      color: var(--mer-muted);
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      line-height: 1;
      transition: color 0.15s, background 0.15s;
    }
    #mer-close:hover { color: var(--mer-text); background: var(--mer-border); }

    /* ── Messages ── */
    #mer-messages {
      flex: 1;
      overflow-y: auto;
      padding: 14px 14px 8px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      scroll-behavior: smooth;
    }
    #mer-messages::-webkit-scrollbar { width: 4px; }
    #mer-messages::-webkit-scrollbar-track { background: transparent; }
    #mer-messages::-webkit-scrollbar-thumb { background: var(--mer-border); border-radius: 4px; }

    .mer-msg {
      display: flex;
      flex-direction: column;
      max-width: 88%;
      animation: merFadeUp 0.2s ease both;
    }
    @keyframes merFadeUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .mer-msg-bot  { align-self: flex-start; }
    .mer-msg-user { align-self: flex-end; }

    .mer-bubble-text {
      padding: 9px 13px;
      border-radius: 12px;
      font-size: 13.5px;
      line-height: 1.55;
      word-break: break-word;
      white-space: pre-wrap;
    }
    .mer-msg-bot  .mer-bubble-text {
      background: var(--mer-gold-dim2);
      color: var(--mer-text);
      border: 1px solid rgba(201,168,76,0.18);
      border-bottom-left-radius: 4px;
    }
    .mer-msg-user .mer-bubble-text {
      background: var(--mer-green-dim);
      color: var(--mer-text);
      border: 1px solid rgba(46,204,113,0.2);
      border-bottom-right-radius: 4px;
    }
    .mer-msg-time {
      font-size: 10px;
      color: var(--mer-muted);
      margin-top: 3px;
      padding: 0 4px;
    }
    .mer-msg-bot  .mer-msg-time { align-self: flex-start; }
    .mer-msg-user .mer-msg-time { align-self: flex-end; }

    /* typing indicator */
    .mer-typing { display: flex; gap: 4px; padding: 11px 14px; align-items: center; }
    .mer-dot {
      width: 7px; height: 7px;
      background: var(--mer-gold);
      border-radius: 50%;
      opacity: 0.4;
      animation: merBounce 1.1s infinite ease-in-out;
    }
    .mer-dot:nth-child(2) { animation-delay: 0.18s; }
    .mer-dot:nth-child(3) { animation-delay: 0.36s; }
    @keyframes merBounce {
      0%, 80%, 100% { transform: scale(0.85); opacity: 0.4; }
      40%           { transform: scale(1.15); opacity: 1; }
    }

    /* ── Suggestions ── */
    #mer-suggestions {
      padding: 0 14px 10px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      flex-shrink: 0;
    }
    .mer-suggestion {
      background: var(--mer-gold-dim2);
      border: 1px solid rgba(201,168,76,0.22);
      color: var(--mer-gold);
      border-radius: 20px;
      padding: 5px 11px;
      font-size: 11.5px;
      font-family: var(--mer-font);
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
      white-space: nowrap;
    }
    .mer-suggestion:hover {
      background: var(--mer-gold-dim);
      transform: translateY(-1px);
    }

    /* ── Input area ── */
    #mer-input-area {
      padding: 10px 12px 14px;
      background: var(--mer-bg2);
      border-top: 1px solid var(--mer-border);
      display: flex;
      gap: 8px;
      align-items: flex-end;
      flex-shrink: 0;
    }
    #mer-input {
      flex: 1;
      background: var(--mer-bg3);
      border: 1px solid var(--mer-border);
      border-radius: 10px;
      color: var(--mer-text);
      font-family: var(--mer-font);
      font-size: 13.5px;
      padding: 9px 12px;
      resize: none;
      outline: none;
      max-height: 90px;
      overflow-y: auto;
      line-height: 1.45;
      transition: border-color 0.15s;
    }
    #mer-input::placeholder { color: var(--mer-muted); }
    #mer-input:focus { border-color: rgba(201,168,76,0.4); }

    #mer-send {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, #c9a84c, #a07830);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: opacity 0.15s, transform 0.1s;
    }
    #mer-send:hover:not(:disabled) { opacity: 0.88; transform: scale(1.05); }
    #mer-send:disabled { opacity: 0.4; cursor: not-allowed; }

    /* ── Mobile ── */
    @media (max-width: 480px) {
      #mer-window {
        bottom: 0;
        right: 0;
        left: 0;
        width: 100%;
        height: 75vh;
        border-radius: var(--mer-radius) var(--mer-radius) 0 0;
      }
      #mer-bubble {
        bottom: 20px;
        right: 20px;
      }
    }
  `;
  document.head.appendChild(style);

  // ── DOM ──────────────────────────────────────────────────────────────────────
  const bubble = document.createElement('button');
  bubble.id = 'mer-bubble';
  bubble.setAttribute('aria-label', 'Open Meridian AI Chat');
  bubble.innerHTML = `
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#111b27" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>`;

  const win = document.createElement('div');
  win.id = 'mer-window';
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-label', 'Meridian AI Chat');
  win.innerHTML = `
    <div id="mer-header">
      <div class="mer-header-left">
        <div class="mer-avatar">
          ✦
          <span class="mer-online-dot"></span>
        </div>
        <div>
          <div class="mer-title">Meridian AI</div>
          <div class="mer-subtitle">Powered by DeepSeek · Free &amp; Private</div>
        </div>
      </div>
      <button id="mer-close" aria-label="Close chat">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div id="mer-messages"></div>
    <div id="mer-suggestions"></div>
    <div id="mer-input-area">
      <textarea id="mer-input" rows="1" placeholder="Ask about Indian finance…" maxlength="1000"></textarea>
      <button id="mer-send" aria-label="Send message">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111b27" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>`;

  document.body.appendChild(bubble);
  document.body.appendChild(win);

  // ── State ────────────────────────────────────────────────────────────────────
  let isOpen     = false;
  let isThinking = false;
  let history    = [];

  const messagesEl    = win.querySelector('#mer-messages');
  const inputEl       = win.querySelector('#mer-input');
  const sendBtn       = win.querySelector('#mer-send');
  const suggestionsEl = win.querySelector('#mer-suggestions');

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function now() {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  function addMessage(text, role) {
    const msg  = document.createElement('div');
    msg.className = `mer-msg mer-msg-${role}`;

    const bub  = document.createElement('div');
    bub.className = 'mer-bubble-text';
    bub.textContent = text;

    const time = document.createElement('div');
    time.className = 'mer-msg-time';
    time.textContent = now();

    msg.appendChild(bub);
    msg.appendChild(time);
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return msg;
  }

  function showTyping() {
    const msg = document.createElement('div');
    msg.id = 'mer-typing-indicator';
    msg.className = 'mer-msg mer-msg-bot';
    msg.innerHTML = `<div class="mer-bubble-text mer-typing">
      <span class="mer-dot"></span>
      <span class="mer-dot"></span>
      <span class="mer-dot"></span>
    </div>`;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function removeTyping() {
    const el = document.getElementById('mer-typing-indicator');
    if (el) el.remove();
  }

  function hideSuggestions() {
    suggestionsEl.style.display = 'none';
  }

  function renderSuggestions() {
    suggestionsEl.innerHTML = '';
    suggestionsEl.style.display = 'flex';
    getRandomSuggestions().forEach(q => {
      const btn = document.createElement('button');
      btn.className = 'mer-suggestion';
      btn.textContent = q;
      btn.onclick = () => {
        hideSuggestions();
        sendMessage(q);
      };
      suggestionsEl.appendChild(btn);
    });
  }

  // ── Send ─────────────────────────────────────────────────────────────────────
  async function sendMessage(text) {
    const trimmed = (text || inputEl.value).trim();
    if (!trimmed || isThinking) return;

    inputEl.value = '';
    inputEl.style.height = '';
    hideSuggestions();
    addMessage(trimmed, 'user');
    sendBtn.disabled = true;
    isThinking = true;
    showTyping();

    history.push({ role: 'user', content: trimmed });

    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history: history.slice(-10) }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const reply = data.reply || 'Sorry, I could not get a response. Please try again.';

      removeTyping();
      addMessage(reply, 'bot');
      history.push({ role: 'assistant', content: reply });

    } catch (err) {
      removeTyping();
      addMessage('Connection issue — please check your internet and try again.', 'bot');
      console.error('[Meridian AI]', err);
    } finally {
      isThinking  = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  // ── Toggle ───────────────────────────────────────────────────────────────────
  function openChat() {
    isOpen = true;
    win.classList.add('mer-open');
    bubble.setAttribute('aria-expanded', 'true');
    if (messagesEl.children.length === 0) {
      addMessage(
        'Namaste! 👋 I\'m Jarvis, your personal finance assistant for India. Ask me anything about investing, credit cards, tax saving, mutual funds, or demat accounts!',
        'bot'
      );
      renderSuggestions();
    }
    setTimeout(() => inputEl.focus(), 220);
  }

  function closeChat() {
    isOpen = false;
    win.classList.remove('mer-open');
    bubble.setAttribute('aria-expanded', 'false');
  }

  function toggleChat() {
    isOpen ? closeChat() : openChat();
  }

  // ── Events ───────────────────────────────────────────────────────────────────
  bubble.addEventListener('click', toggleChat);
  win.querySelector('#mer-close').addEventListener('click', closeChat);
  sendBtn.addEventListener('click', () => sendMessage());

  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  inputEl.addEventListener('input', () => {
    inputEl.style.height = '';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 90) + 'px';
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) closeChat();
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (isOpen && !win.contains(e.target) && e.target !== bubble) closeChat();
  });

})();
