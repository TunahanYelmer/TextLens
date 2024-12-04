chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "screenshot") {
    // Find the active tab in the current window
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        console.error("No active tab found");
        sendResponse({ status: "error", message: "No active tab found" });
        return;
      }

      const tabId = tabs[0].id;
      console.log("Active tab found:", tabId);

      // Check if the tab is still available before proceeding
      chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError || !tab) {
          console.error("Tab no longer exists or is unavailable");
          sendResponse({ status: "error", message: "Tab no longer exists or is unavailable" });
          return;
        }

        console.log("Tab is valid, injecting script...");

        // Inject the screenshot selection script into the active tab
        chrome.scripting.executeScript(
          {
            target: { tabId: tabId },
            func: handleScreenshotSelection // Function to be executed in the tab
          },
          (results) => {
            if (chrome.runtime.lastError) {
              console.error("Error executing script:", chrome.runtime.lastError.message);
              sendResponse({
                status: "error",
                message: chrome.runtime.lastError.message
              });
              return;
            }

            // Ensure results and result[0] are valid before proceeding
            if (!results || !results[0] || !results[0].result) {
              console.error("No result returned from executed script.");
              sendResponse({
                status: "error",
                message: "Failed to capture coordinates from the page."
              });
              return;
            }

            const coordinates = results[0].result; // Extract coordinates from the execution result
            console.log("Coordinates from page:", coordinates);

            // Capture the screenshot based on coordinates
            captureScreenshot(tabId, coordinates, sendResponse);
          }
        );
      });
    });

    // Indicate that the response will be sent asynchronously
    return true;
  }
});

// Function to handle screenshot selection - Injected into the content script
async function handleScreenshotSelection() {
  try {
    return new Promise((resolve, reject) => {
      let startX, startY;

      const handleMouseDown = (event) => {
        startX = event.clientX;
        startY = event.clientY;
        console.log("Mouse down at:", startX, startY);
      };

      const handleMouseUp = (event) => {
        const endX = event.clientX;
        const endY = event.clientY;
        console.log("Mouse up at:", endX, endY);
        console.log("Mouse Coordinates are:", startX, startY, endX, endY);

        // Remove event listeners after capturing coordinates
        window.removeEventListener("mousedown", handleMouseDown);
        window.removeEventListener("mouseup", handleMouseUp);

        // Resolve the promise with the coordinates
        resolve({ startX, startY, endX, endY });
      };

      // Add event listeners for mouse interactions
      window.addEventListener("mousedown", handleMouseDown, { once: true });
      window.addEventListener("mouseup", handleMouseUp, { once: true });
      console.log("Event listeners added for the current interaction.");
    });
  } catch (error) {
    console.error("Error in handleScreenshotSelection:", error);
    throw error; // Re-throw the error so it can be caught by the outer error handler
  }
}

// Function to capture a screenshot using the provided coordinates
function captureScreenshot(tabId, coordinates, sendResponse) {
  // Query the current tab to capture the visible part
  chrome.tabs.captureVisibleTab(1501290780, { format: "png" }, (screenshotUrl) => {
    if (chrome.runtime.lastError) {
      console.error("Error capturing screenshot:", chrome.runtime.lastError);
      sendResponse({ status: "error", message: chrome.runtime.lastError.message });
      return;
    }

    // Screenshot captured successfully, now crop it using the provided coordinates
    cropImage(screenshotUrl, coordinates)
      .then((croppedImageUrl) => {
        sendResponse({
          status: "success",
          message: "Screenshot captured and cropped successfully",
          imageUrl: croppedImageUrl // Return the cropped image URL
        });
      })
      .catch((error) => {
        console.error("Error cropping image:", error);
        sendResponse({ status: "error", message: "Failed to crop image: " + error });
      });
  });
}

// Function to crop the captured screenshot based on the coordinates
function cropImage(imageUrl, coordinates) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Set the canvas size to the coordinates of the crop area
      const { startX, startY, endX, endY } = coordinates;
      const width = endX - startX;
      const height = endY - startY;

      // Adjust canvas size
      canvas.width = width;
      canvas.height = height;

      // Draw the cropped section of the image onto the canvas
      ctx.drawImage(img, startX, startY, width, height, 0, 0, width, height);

      // Convert the cropped canvas to a DataURL (base64 image)
      const croppedImageUrl = canvas.toDataURL();
      resolve(croppedImageUrl); // Resolve with the cropped image URL
    };

    img.onerror = (error) => {
      reject("Error loading image: " , error);
    };
  });
}

console.log("Background script is running");
