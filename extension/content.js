(function () {
  const BTN_CLASS = "voltchess-analyze-btn";
  const ROW_MARK = "data-voltchess-bound";

  function parseGameFromHref(href) {
    if (!href) return null;
    const live = href.match(/\/game\/live\/(\d+)/i);
    if (live) return { gameId: live[1], gameType: "live" };
    const daily = href.match(/\/game\/daily\/(\d+)/i);
    if (daily) return { gameId: daily[1], gameType: "daily" };
    const generic = href.match(/\/game\/(\d+)/i);
    if (generic) return { gameId: generic[1], gameType: "live" };
    return null;
  }

  function currentPageGame() {
    return parseGameFromHref(window.location.pathname + window.location.search);
  }

  function createButton(label, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = BTN_CLASS;
    btn.textContent = label;
    btn.title = "Analyze this game with VoltChess (Stockfish)";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick(btn);
    });
    return btn;
  }

  function setBusy(btn, busy, text) {
    btn.disabled = busy;
    btn.textContent = text;
  }

  function analyzeChessCom(gameId, gameType, btn) {
    setBusy(btn, true, "Opening…");
    chrome.runtime.sendMessage(
      { type: "ANALYZE_CHESSCOM", gameId, gameType },
      (response) => {
        if (chrome.runtime.lastError || !response?.ok) {
          setBusy(btn, false, "Retry VoltChess");
          const msg =
            response?.error ||
            chrome.runtime.lastError?.message ||
            "Failed to open analysis";
          console.warn("[VoltChess extension]", msg);
          return;
        }
        setBusy(btn, false, "Analyze");
      }
    );
  }

  function injectIntoGameHistory() {
    const links = document.querySelectorAll(
      'a[href*="/game/live/"], a[href*="/game/daily/"], a[href*="/game/"]'
    );

    links.forEach((link) => {
      const parsed = parseGameFromHref(link.getAttribute("href") || "");
      if (!parsed) return;

      const row =
        link.closest("tr") ||
        link.closest("[class*='game-row']") ||
        link.closest("[class*='archive']") ||
        link.closest("li") ||
        link.parentElement;
      if (!row || row.getAttribute(ROW_MARK) === parsed.gameId) return;

      // Avoid double-binding the same game cell
      if (row.querySelector(`.${BTN_CLASS}[data-game-id="${parsed.gameId}"]`)) {
        return;
      }

      row.setAttribute(ROW_MARK, parsed.gameId);
      const btn = createButton("Analyze", (b) =>
        analyzeChessCom(parsed.gameId, parsed.gameType, b)
      );
      btn.dataset.gameId = parsed.gameId;

      const actions =
        row.querySelector("[class*='action']") ||
        row.querySelector("td:last-child") ||
        row;
      actions.appendChild(btn);
    });
  }

  function injectPostGameModal() {
    const modal = document.querySelector(
      "[class*='game-over'], [class*='GameOver'], [class*='modal'], dialog"
    );
    if (!modal) return;
    if (modal.querySelector(`.${BTN_CLASS}`)) return;

    const pageGame = currentPageGame();
    if (!pageGame) return;

    const btn = createButton("Analyze with VoltChess", (b) =>
      analyzeChessCom(pageGame.gameId, pageGame.gameType, b)
    );
    btn.classList.add("voltchess-analyze-btn--large");

    const footer =
      modal.querySelector("[class*='footer']") ||
      modal.querySelector("[class*='buttons']") ||
      modal;
    footer.appendChild(btn);
  }

  function injectGamePageBar() {
    const pageGame = currentPageGame();
    if (!pageGame) {
      document.getElementById("voltchess-floating-bar")?.remove();
      return;
    }
    if (document.getElementById("voltchess-floating-bar")) return;

    const bar = document.createElement("div");
    bar.id = "voltchess-floating-bar";
    const btn = createButton("Analyze with VoltChess", (b) =>
      analyzeChessCom(pageGame.gameId, pageGame.gameType, b)
    );
    btn.classList.add("voltchess-analyze-btn--large");
    bar.appendChild(btn);
    document.documentElement.appendChild(bar);
  }

  function refresh() {
    try {
      injectIntoGameHistory();
      injectPostGameModal();
      injectGamePageBar();
    } catch (err) {
      console.warn("[VoltChess extension] inject error", err);
    }
  }

  refresh();
  const observer = new MutationObserver(() => {
    window.clearTimeout(observer._t);
    observer._t = window.setTimeout(refresh, 400);
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
