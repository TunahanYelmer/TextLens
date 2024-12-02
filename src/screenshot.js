const handleScreenshot = () => {
  const handleMouseDown = (event) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      store.dispatch(
        updateCanvasCoords({
          x1: screenX,
          y1: screenX,
          x2: store.getState().canvasCoords.x2,
          y2: store.getState().canvasCoords.y2,
        })
      );
    });
  };

  const handleMouseUp = (event) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      store.dispatch(
        updateCanvasCoords({
          x1: store.getState().canvasCoords.x1,
          y1: store.getState().canvasCoords.y1,
          x2: screenX,
          y2: screenY,
        })
      );
    });

  };
  
  chrome.browserAction.onClicked.addListener(() => {
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    console.log("background.js: handleScreenshot");
  });
};
