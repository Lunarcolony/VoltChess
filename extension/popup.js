const DEFAULT_URL = "https://voltchess.vercel.app";

async function init() {
  const stored = await chrome.storage.sync.get(["analyzerUrl"]);
  const base = (stored.analyzerUrl || DEFAULT_URL).replace(/\/$/, "");
  const analyzer = document.getElementById("open-analyzer");
  analyzer.href = base;

  document.getElementById("open-options").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
}

init();
