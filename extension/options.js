const DEFAULT_URL = "https://voltchess.vercel.app";

async function load() {
  const stored = await chrome.storage.sync.get(["analyzerUrl"]);
  document.getElementById("analyzerUrl").value =
    stored.analyzerUrl || DEFAULT_URL;
}

document.getElementById("save").addEventListener("click", async () => {
  const value = document.getElementById("analyzerUrl").value.trim();
  await chrome.storage.sync.set({
    analyzerUrl: value || DEFAULT_URL,
  });
  document.getElementById("status").textContent = "Saved.";
});

load();
