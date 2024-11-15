// background.js

import { myAppState } from "./storage.js";

let cleanupEventListeners;

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

      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          func: addEventListeners,
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
  } else if (message.action === "updateCanvasCoords") {
    console.log("Updating canvas coordinates:", message.coords);
    myAppState.actions.updateCanvasCoords(message.coords, () => {
      sendResponse({ status: "success" });
    });

    // Indicate that the response will be sent asynchronously
    return true;
  } else if (message.action === "popupOpened") {
    // Add event listeners when the popup is opened
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        console.error("No active tab found");
        return;
      }

      const tabId = tabs[0].id;
      console.log("Popup opened, adding event listeners to tab:", tabId);

      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          func: addEventListeners,
        },
        (results) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Error executing script:",
              chrome.runtime.lastError.message
            );
          } else {
            console.log("Event listeners added successfully:", results);
            cleanupEventListeners = results[0].result;
          }
        }
      );
    });
  } else if (message.action === "popupClosed") {
    // Remove event listeners and clear storage when the popup is closed
    if (cleanupEventListeners) {
      cleanupEventListeners();
      cleanupEventListeners = null;
    }

    console.log("Popup closed, clearing storage...");
    chrome.storage.local.clear(() => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error clearing storage:",
          chrome.runtime.lastError.message
        );
      } else {
        console.log("Storage cleared successfully.");
      }
    });
  }
});

function addEventListeners() {
  try {
    const handleMouseDown = (event) => {
      console.log("Mouse down at:", event.clientX, event.clientY);
      chrome.runtime.sendMessage(
        {
          action: "updateCanvasCoords",
          coords: { x1: event.clientX, y1: event.clientY },
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Error sending message:",
              chrome.runtime.lastError.message
            );
          } else {
            console.log("Message sent successfully:", response);
          }
        }
      );
    };

    const handleMouseUp = (event) => {
      console.log("Mouse up at:", event.clientX, event.clientY);
      chrome.runtime.sendMessage(
        {
          action: "updateCanvasCoords",
          coords: { x2: event.clientX, y2: event.clientY },
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Error sending message:",
              chrome.runtime.lastError.message
            );
          } else {
            console.log("Message sent successfully:", response);
          }
        }
      );
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    console.log("Event listeners added to the current tab");

    // Return a cleanup function to remove the event listeners
    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      console.log("Event listeners removed from the current tab");
    };
  } catch (error) {
    console.error("Error adding event listeners:", error);
  }
}

console.log("Background script is running");
