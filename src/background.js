import Tesseract from "tesseract.js";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "screenshot") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab) {
        sendResponse({ status: "error", message: "No active tab found" });
        return;
      }

      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: handleScreenshotSelection,
        },
        (results) => {
          const coordinates = results?.[0]?.result;
          if (!coordinates) {
            sendResponse({
              status: "error",
              message: "Failed to get coordinates.",
            });
            return;
          }

          chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" }, (screenshotUrl) => {
            if (chrome.runtime.lastError || !screenshotUrl) {
              sendResponse({ status: "error", message: "Screenshot failed." });
              return;
            }

            cropImage(screenshotUrl, coordinates).then((croppedImageUrl) => {
              sendResponse({ status: "success", croppedImageUrl });
            });
          });
        }
      );
    });
    return true; // Asynchronous response
  }

  if (message.action === "performOCR") {
    getTextFromScreenshots(message.croppedImageUrl).then((text) => {
      sendResponse({ status: "success", text });
    });
    return true; // Asynchronous response
  }
});

// Image cropping function
const cropImage = (imageUrl, coordinates) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      const { startX, startY, endX, endY } = coordinates;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const x = Math.min(startX, endX);
      const y = Math.min(startY, endY);
      const width = Math.abs(endX - startX);
      const height = Math.abs(endY - startY);

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

      resolve(canvas.toDataURL());
    };

    img.onerror = reject;
  });
};

// Tesseract OCR function
const getTextFromScreenshots = async (croppedImageUrl) => {
  try {
    const result = await Tesseract.recognize(croppedImageUrl, "eng", {
      logger: (m) => console.log(m),
    });
    return result.data.text;
  } catch (error) {
    console.error("OCR error:", error);
    return null;
  }
};

// Screenshot selection handler
function handleScreenshotSelection() {
  return new Promise((resolve) => {
    let startX, startY;

    const handleMouseDown = (event) => {
      startX = event.clientX;
      startY = event.clientY;
    };

    const handleMouseUp = (event) => {
      const endX = event.clientX;
      const endY = event.clientY;

      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);

      resolve({ startX, startY, endX, endY });
    };

    window.addEventListener("mousedown", handleMouseDown, { once: true });
    window.addEventListener("mouseup", handleMouseUp, { once: true });
  });
}

console.log("Background script is running.");
