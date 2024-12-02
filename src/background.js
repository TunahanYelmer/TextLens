chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "screenshot") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        console.error("No active tab found");
        sendResponse({ status: "error", message: "No active tab found" });
        return;
      }

      const tabId = tabs[0].id;
      console.log("Active tab found:", tabId);

      // Execute the script in the active tab
      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          func: handleScreenshotSelection, // Function to be executed in the content script
        },
        (results) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Error executing script:",
              chrome.runtime.lastError.message
            );
            sendResponse({
              status: "error",
              message: chrome.runtime.lastError.message,
            });
          } else {
            console.log("Script executed successfully:", results);
            sendResponse({ status: "success", results });
          }
        }
      );
    });

    // Indicate that the response will be sent asynchronously
    return true;
  } else if (
    message.action === "popupOpened" ||
    message.action === "popupClosed"
  ) {
    console.log(`${message.action} action triggered`);
  }
});

// Function to handle screenshot selection in the content script
async function handleScreenshotSelection() {
  try {
    // Temporary variables to store coordinates
    let startX, startY;

    // Return a promise to handle the async nature
    return new Promise((resolve, reject) => {
      const handleMouseDown = (event) => {
        startX = event.clientX;
        startY = event.clientY;
        console.log("Mouse down at:", startX, startY);
      };

      const handleMouseUp = (event) => {
        const endX = event.clientX;
        const endY = event.clientY;
        console.log("Mouse up at:", endX, endY);

        // Send the coordinates to the background script (via content)
        chrome.runtime.sendMessage(
          {
            action: "updateCanvasCoords",
            coords: { x1: startX, y1: startY, x2: endX, y2: endY },
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error(
                "Error sending coordinates:",
                chrome.runtime.lastError.message
              );
              reject(new Error("Error sending coordinates"));
            } else {
              console.log("Coordinates sent successfully: ", response);
              resolve(response); // Resolve the promise when coordinates are sent successfully
            }
          }
        );
      };

      // Add listeners for the current interaction
      window.addEventListener("mousedown", handleMouseDown, { once: true });
      window.addEventListener("mouseup", handleMouseUp, { once: true });
      console.log("Event listeners added for the current interaction.");
    });
  } catch (error) {
    console.error("Error during screenshot selection:", error);
  }
}

console.log("Background script is running");
