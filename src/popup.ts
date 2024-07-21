document.addEventListener('DOMContentLoaded', () => {
    const statusElement = document.getElementById('status');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];

        if (tab && tab.id) {
            chrome.scripting.executeScript(
                {
                    target: { tabId: tab.id },
                    files: ['/dist/content.js']
                },
                () => {

                    chrome.runtime.onMessage.addListener((message) => {
                        if (message.hasDataBind !== undefined  && statusElement) {
                            if (message.hasDataBind) {
                                statusElement.textContent = 'Element with data-bind attribute found.';
                            } else {
                                statusElement.textContent = 'No element with data-bind attribute found.';
                            }
                        }
                    });
                }
            );
        }
    });
});