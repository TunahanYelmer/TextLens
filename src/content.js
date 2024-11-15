document.getElementById("scanText").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "screenshot" });
});
document.addEventListener("DOMContentLoaded", () => {
  chrome.runtime.sendMessage({ action: "popupOpened" });

  window.addEventListener("blur", () => {
    chrome.runtime.sendMessage({ action: "popupClosed" });
  });
});
