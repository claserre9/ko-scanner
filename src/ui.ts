import { KOData } from './interfaces';

/**
 * Creates the sidebar pane in Chrome DevTools and handles UI updates.
 * @param dataRetriever Function that retrieves Knockout data and context.
 */
export function createKOSidebar(dataRetriever: () => KOData): void {
    chrome.devtools.panels.elements.createSidebarPane('KnockoutJS Context', (sidebar) => {
        const updateElementProperties = (): void => {
            try {
                sidebar.setExpression(`(${dataRetriever.toString()})()`);
            } catch (error) {
                console.error('Error updating element properties: ', error);
            }
        };
        updateElementProperties();
        chrome.devtools.panels.elements.onSelectionChanged.addListener(updateElementProperties);
    });
}
