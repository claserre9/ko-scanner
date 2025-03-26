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

    }
);