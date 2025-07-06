import { getKODataAndContext } from './core';

chrome.devtools.panels.elements.createSidebarPane(
    'KnockoutJS Context',
    function (sidebar) {
        function updateElementProperties() {
            try {
                sidebar.setExpression('(' + getKODataAndContext.toString() + ')()');
            } catch (error) {
                console.error('Error updating element properties: ', error);
            }
        }
        updateElementProperties();
        chrome.devtools.panels.elements.onSelectionChanged.addListener(
            updateElementProperties
        );
    }
);

chrome.devtools.panels.create(
    'KnockoutJS Editor',
    "",
    'panel/panel.html',
    function (panel) {
        // Create a connection to the background page when the panel is shown
        panel.onShown.addListener(function(panelWindow) {
            // Initialize the panel window if needed
            if (!panelWindow.initialized) {
                // Set a flag to avoid re-initialization
                panelWindow.initialized = true;

                // Listen for selection changes in the Elements panel
                chrome.devtools.panels.elements.onSelectionChanged.addListener(
                    function() {
                        // Notify the panel that selection has changed
                        if (panelWindow.fetchAndRender) {
                            panelWindow.fetchAndRender();
                        }
                    }
                );
            }
        });
    }
);
