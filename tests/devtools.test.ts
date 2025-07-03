import '../src/devtools';
import { getKODataAndContext } from '../src/core';

// Mock the core module
jest.mock('../src/core', () => ({
  getKODataAndContext: jest.fn(),
}));

describe('DevTools Integration', () => {
  let mockSidebar: { setExpression: jest.Mock };
  let createSidebarPaneCallback: Function;
  let createPanelCallback: Function;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a mock sidebar object
    mockSidebar = {
      setExpression: jest.fn(),
    };
    
    // Capture the callback functions
    chrome.devtools.panels.elements.createSidebarPane = jest.fn().mockImplementation((name, callback) => {
      createSidebarPaneCallback = callback;
      callback(mockSidebar);
    });
    
    chrome.devtools.panels.create = jest.fn().mockImplementation((title, iconPath, pagePath, callback) => {
      createPanelCallback = callback;
      if (callback) callback({});
    });
    
    // Re-import the module to trigger the code
    jest.isolateModules(() => {
      require('../src/devtools');
    });
  });

  test('should create a sidebar pane with the correct name', () => {
    expect(chrome.devtools.panels.elements.createSidebarPane).toHaveBeenCalledWith(
      'KnockoutJS Context',
      expect.any(Function)
    );
  });

  test('should create a panel with the correct parameters', () => {
    expect(chrome.devtools.panels.create).toHaveBeenCalledWith(
      'KnockoutJS Editor',
      '',
      'panel/panel.html',
      expect.any(Function)
    );
  });

  test('should set up a listener for selection changes', () => {
    expect(chrome.devtools.panels.elements.onSelectionChanged.addListener).toHaveBeenCalled();
  });

  test('should update element properties when sidebar is created', () => {
    // Call the callback directly to simulate sidebar creation
    createSidebarPaneCallback(mockSidebar);
    
    // Check that setExpression was called with the stringified function
    expect(mockSidebar.setExpression).toHaveBeenCalledWith(
      '(' + getKODataAndContext.toString() + ')()'
    );
  });

  test('should update element properties when selection changes', () => {
    // Reset the mock to clear previous calls
    mockSidebar.setExpression.mockClear();
    
    // Get the listener function that was registered
    const listener = chrome.devtools.panels.elements.onSelectionChanged.addListener.mock.calls[0][0];
    
    // Call the listener to simulate a selection change
    listener();
    
    // Check that setExpression was called
    expect(mockSidebar.setExpression).toHaveBeenCalledWith(
      '(' + getKODataAndContext.toString() + ')()'
    );
  });

  test('should handle errors when updating element properties', () => {
    // Mock console.error
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Make setExpression throw an error
    mockSidebar.setExpression.mockImplementation(() => {
      throw new Error('Test error');
    });
    
    // Get the listener function that was registered
    const listener = chrome.devtools.panels.elements.onSelectionChanged.addListener.mock.calls[0][0];
    
    // Call the listener to simulate a selection change
    listener();
    
    // Check that console.error was called
    expect(console.error).toHaveBeenCalledWith(
      'Error updating element properties: ',
      expect.any(Error)
    );
    
    // Restore console.error
    console.error = originalConsoleError;
  });
});