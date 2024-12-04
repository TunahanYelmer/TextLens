chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "captureScreenshot") {
    console.log("Capturing screenshot...");

    // Call the function to capture the screenshot asynchronously
    captureScreenshotAsync(sendResponse);
    
    // Return true to indicate that we are handling the response asynchronously
    return true;
  }
});

// Function to capture the screenshot asynchronously using chrome.tabs.captureVisibleTab()
async function captureScreenshotAsync(sendResponse) {
  try {
    // Query the current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        sendResponse({ status: "error", message: "No active tab found." });
        return;
      }

      const tabId = tabs[0].id;
      console.log("Active tab found:", tabId);

      // Capture the visible part of the active tab
      chrome.tabs.captureVisibleTab(tabId, { format: "png" }, (screenshotUrl) => {
        if (chrome.runtime.lastError) {
          console.error("Error capturing screenshot:", chrome.runtime.lastError);
          sendResponse({ status: "error", message: chrome.runtime.lastError.message });
        } else {
          console.log("Screenshot captured successfully.");
          sendResponse({
            status: "success",
            message: "Screenshot captured successfully",
            imageUrl: screenshotUrl // Return the captured screenshot as a base64 URL
          });
        }
      });
    });

    // Return true to indicate the response will be sent asynchronously
    return true;
  } catch (error) {
    console.error("Error during the capturing process:", error);
    sendResponse({
      status: "error",
      message: `Failed to capture screenshot: ${error}`
    });
  }
}
