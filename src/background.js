
// Listen for messages from other parts of the extension



chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "screenshot":
      handleScreenshotRequest(sendResponse);
      console.log("Screenshot event received");
      return true; // Keep the response channel open for asynchronous responses

    case "performOCR":
      //handleOCRRequest(message.croppedImageUrl, sendResponse);
      console.log("OCR event received");
      return true; // Keep the response channel open for asynchronous responses
    case "popupOpened":
      sendResponse({ status: "success", message: "Popup opened." });
      return true; // Keep the response channel open for asynchronous responses

    case "popupClosed":
   
      sendResponse({ status: "success", message: "Popup closed." });
      return true; // Keep the response channel open for asynchronous responses

    case "popupUpdated":
    default:
      console.error("Unknown action:", message.action);

      sendResponse({ status: "error", message: "Unknown action." });
      return false;
  }
});

// Handle screenshot request
function handleScreenshotRequest(sendResponse) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab) {
      sendResponse({ status: "error", message: "No active tab found." });
      return;
    }

    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func: selectScreenshotArea,
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
            return true;
          }
          sendResponse({ status: "success", screenshotUrl, coordinates });
          
         
        });
      }
    );
  });
}

// Dynamically load Tesseract.js

// Handle OCR requests
const handleOCRRequest = async (croppedImageUrl, sendResponse) => {
  try {
    (async () => {
      const src = chrome.runtime.getURL("src/tesseract.js");  // Path to your bundled script
      src.Promise.resolve(croppedImageUrl); //
      contentMain.getTextFromScreenshots(croppedImageUrl);  // Call the function from the imported module
    })();
    
  } catch (error) {
    console.error("OCR Error:", error);
    sendResponse({ status: "error", message: error.message });
  }
};

// Other event listeners remain unchanged...



// Function to select the screenshot area on the page
function selectScreenshotArea() {
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
