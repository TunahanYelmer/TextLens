chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "processImage") {
    const { screenshotUrl, coordinates } = message;

    // Perform processing with the image URL and coordinates
    console.log("Received screenshot URL:", screenshotUrl);
    console.log("Coordinates:", coordinates);

    sendResponse({ status: "success", message: "Image displayed successfully" });
    return true;
  }
});