# KnockoutJS Scanner - Developer Documentation

This document provides information for developers who want to understand, contribute to, or build the KnockoutJS Scanner Chrome extension.

## Architecture and Design

### Overview

KnockoutJS Scanner is a Chrome DevTools extension that helps developers debug and inspect Knockout.js applications. The extension consists of two main components:

1. **KnockoutJS Context Sidebar**: A sidebar pane in the Elements panel that displays the Knockout.js data and context associated with the selected DOM element.
2. **KnockoutJS Editor Panel**: A dedicated panel in DevTools for viewing and interacting with Knockout.js observables.

### Project Structure

```
ko-scanner/
├── devtools/              # DevTools integration
│   └── devtools.html      # HTML page loaded when DevTools is opened
├── dist/                  # Compiled output (generated during build)
├── docs/                  # Documentation
├── images/                # Extension icons and images
├── panel/                 # KnockoutJS Editor panel
│   └── panel.html         # HTML for the editor panel
├── src/                   # Source code
│   ├── core.ts            # Core functionality for interacting with Knockout.js
│   ├── devtools.ts        # DevTools integration code
│   ├── globals.d.ts       # TypeScript type definitions
│   └── panel.ts           # KnockoutJS Editor panel functionality
├── manifest.json          # Chrome extension manifest
├── package.json           # NPM package configuration
├── tsconfig.json          # TypeScript configuration
└── webpack.config.js      # Webpack configuration
```

### Technical Details

The extension uses the Chrome DevTools API to integrate with the browser's developer tools. Key technical aspects include:

1. **Content Script Injection**: The extension injects JavaScript into the inspected page to access the Knockout.js objects and data.

2. **DevTools Integration**: 
   - Creates a sidebar pane in the Elements panel using `chrome.devtools.panels.elements.createSidebarPane()`
   - Creates a custom panel using `chrome.devtools.panels.create()`

3. **Data Extraction**: 
   - Uses `ko.dataFor()` and `ko.contextFor()` to extract Knockout.js data and context
   - Identifies observable properties using `ko.isObservable()`, `ko.isComputed()`, etc.

4. **TypeScript**: The project is written in TypeScript for better type safety and developer experience.

5. **Webpack**: Used for bundling and building the extension.

## Contribution Guidelines

### Getting Started

1. Fork the repository
2. Clone your fork:
   ```
   git clone https://github.com/yourusername/ko-scanner.git
   ```
3. Install dependencies:
   ```
   cd ko-scanner
   npm install
   ```

### Development Workflow

1. Make your changes in the `src/` directory
2. Build the extension:
   ```
   npm run build
   ```
   Or use watch mode during development:
   ```
   npm run watch
   ```
3. Load the extension in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` directory

### Code Style Guidelines

- Follow TypeScript best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Write JSDoc comments for public functions and classes
- Keep functions small and focused on a single responsibility

### Pull Request Process

1. Ensure your code builds without errors
2. Update documentation if necessary
3. Create a pull request with a clear description of the changes
4. Reference any related issues in your pull request

## Build and Deployment Process

### Prerequisites

- Node.js (v14 or later recommended)
- npm (v6 or later recommended)

### Building the Extension

1. Install dependencies:
   ```
   npm install
   ```

2. Build the extension:
   ```
   npm run build
   ```
   This will:
   - Compile TypeScript to JavaScript
   - Bundle the code using Webpack
   - Output the built extension to the `dist/` directory

### Development Build

For development, you can use the watch mode to automatically rebuild when files change:
```
npm run watch
```

### Packaging for Distribution

To create a ZIP file for submission to the Chrome Web Store:

1. Build the extension:
   ```
   npm run build
   ```

2. Create a ZIP file containing:
   - The `dist/` directory
   - The `images/` directory
   - `manifest.json`
   - `panel/` directory
   - `devtools/` directory

### Publishing to the Chrome Web Store

1. Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
2. Click "Add new item"
3. Upload the ZIP file
4. Fill in the required information
5. Submit for review

## Debugging

### Debugging the Extension

1. Load the extension in developer mode
2. Right-click the extension icon and select "Inspect popup" (if applicable)
3. Use the Chrome DevTools console to debug

### Debugging the DevTools Panel

1. Open DevTools
2. Click on the KnockoutJS Editor panel
3. Press Ctrl+Shift+I (or Cmd+Opt+I on Mac) to open DevTools for DevTools
4. Use the console to debug the panel

## Future Development

Planned improvements and features:

1. Add editing capabilities for observable values
2. Implement real-time observation of changes to observable values
3. Add filtering and search functionality for observables
4. Visualize observable dependencies (computed observables)
5. Add performance monitoring for Knockout.js applications