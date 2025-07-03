// Jest setup file

// Mock the chrome API
global.chrome = {
  devtools: {
    inspectedWindow: {
      eval: jest.fn(),
    },
    panels: {
      elements: {
        createSidebarPane: jest.fn(),
        onSelectionChanged: {
          addListener: jest.fn(),
        },
      },
      create: jest.fn(),
    },
  },
} as any;

// Mock the window.ko object
Object.defineProperty(window, 'ko', {
  value: {
    dataFor: jest.fn(),
    contextFor: jest.fn(),
    isObservable: jest.fn(),
    isComputed: jest.fn(),
  },
  writable: true,
});

// Mock the $0 element
Object.defineProperty(window, '$0', {
  value: document.createElement('div'),
  writable: true,
});