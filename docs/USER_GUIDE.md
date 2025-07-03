# KnockoutJS Scanner - User Guide

This guide provides detailed information on how to use the KnockoutJS Scanner Chrome extension to debug and inspect your Knockout.js applications.

## Table of Contents

- [Installation](#installation)
- [Getting Started](#getting-started)
- [Features](#features)
  - [KnockoutJS Context Sidebar](#knockoutjs-context-sidebar)
  - [KnockoutJS Editor Panel](#knockoutjs-editor-panel)
- [Troubleshooting](#troubleshooting)
- [Frequently Asked Questions (FAQ)](#frequently-asked-questions-faq)

## Installation

### From Chrome Web Store

1. Visit the [Chrome Web Store](https://chrome.google.com/webstore/category/extensions) (link to be updated when published)
2. Search for "KnockoutJS Scanner"
3. Click "Add to Chrome"
4. Confirm the installation when prompted

### Manual Installation

If you prefer to install the extension manually:

1. Download the latest release from the [GitHub repository](https://github.com/yourusername/ko-scanner/releases)
2. Unzip the downloaded file
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" by toggling the switch in the top-right corner
5. Click "Load unpacked" and select the unzipped directory

## Getting Started

After installing the KnockoutJS Scanner extension, follow these steps to start using it:

1. Open a web page that uses Knockout.js
2. Open Chrome DevTools by pressing F12 or right-clicking on the page and selecting "Inspect"
3. The extension will automatically activate when DevTools is opened

## Features

### KnockoutJS Context Sidebar

The KnockoutJS Context Sidebar allows you to view the Knockout.js data and context associated with any DOM element.

#### How to Use

1. In DevTools, navigate to the Elements panel
2. Select any DOM element in the HTML tree
3. Look for the "KnockoutJS Context" tab in the sidebar (you may need to click the >> icon to find it)
4. The sidebar will display:
   - The view model data associated with the selected element
   - The Knockout.js context for the selected element

#### Tips

- The sidebar updates automatically when you select different elements
- You can expand objects and arrays to see nested properties
- The sidebar shows both observable and non-observable properties

### KnockoutJS Editor Panel

The KnockoutJS Editor Panel provides a dedicated interface for viewing and interacting with Knockout.js observables.

#### How to Use

1. In DevTools, click on the "KnockoutJS Editor" tab
2. Select any DOM element in the Elements panel
3. The panel will display all observables associated with the selected element, including:
   - Observable name
   - Type (observable, observableArray, or computed)
   - Current value

#### Tips

- The panel updates automatically when you select different elements
- You can see the type of each observable, which helps understand how data is structured
- The panel only shows observable properties, not regular JavaScript properties

## Troubleshooting

### Extension Not Working

If the extension doesn't appear to be working:

1. **Verify Knockout.js is Present**: The extension only works on pages that use Knockout.js. Check if Knockout.js is loaded on the page by running `window.ko` in the DevTools console.

2. **Check Extension Installation**: Make sure the extension is properly installed and enabled. Go to `chrome://extensions/` and verify that KnockoutJS Scanner is listed and enabled.

3. **Reload the Page**: Sometimes, you need to reload the page after installing the extension for it to work properly.

4. **Restart DevTools**: Close and reopen DevTools to ensure the extension is properly loaded.

### No Data Showing

If the extension is working but no data is displayed:

1. **Select an Element with Knockout Bindings**: Make sure you've selected a DOM element that has Knockout.js bindings.

2. **Check for iframes**: If your Knockout.js application is inside an iframe, you'll need to select the iframe in DevTools first, then select elements within it.

3. **Verify Knockout Version**: The extension is designed to work with Knockout.js versions 3.x and above. Older versions may not be fully supported.

### Performance Issues

If you experience performance issues when using the extension:

1. **Large View Models**: If your application has very large view models, the extension might slow down when displaying all the data. Try selecting more specific elements with smaller view models.

2. **Many Observables**: Applications with hundreds of observables might cause the extension to slow down. Consider optimizing your Knockout.js application by reducing unnecessary observables.

## Frequently Asked Questions (FAQ)

### General Questions

#### Q: What is KnockoutJS Scanner?
A: KnockoutJS Scanner is a Chrome DevTools extension that helps developers debug and inspect Knockout.js applications by providing tools to view and interact with Knockout.js data and observables.

#### Q: Does it work with all versions of Knockout.js?
A: The extension is designed to work with Knockout.js versions 3.x and above. It may work with older versions, but full compatibility is not guaranteed.

#### Q: Is this an official Knockout.js tool?
A: No, this is a third-party tool created to help Knockout.js developers.

### Features

#### Q: Can I edit observable values using this extension?
A: Currently, the extension only allows viewing observable values. Editing functionality is planned for future releases.

#### Q: Does it work with computed observables?
A: Yes, the extension can detect and display computed observables.

#### Q: Can I see the dependency chain of computed observables?
A: Currently, the extension doesn't show the dependency chain, but this feature is planned for future releases.

### Compatibility

#### Q: Does it work with other frameworks like React or Angular?
A: No, this extension is specifically designed for Knockout.js applications.

#### Q: Does it work in incognito mode?
A: By default, Chrome extensions don't run in incognito mode. You can enable it by going to `chrome://extensions/`, finding KnockoutJS Scanner, and checking "Allow in incognito".

#### Q: Does it work with Knockout components?
A: Yes, the extension works with Knockout components and can display their view models and observables.

### Privacy and Security

#### Q: Does the extension collect any data?
A: No, the extension doesn't collect or transmit any data. It only reads data from the page you're inspecting and displays it in DevTools.

#### Q: Can other extensions or websites access the data displayed by KnockoutJS Scanner?
A: No, the data displayed by the extension is only accessible within Chrome DevTools and isn't exposed to other extensions or websites.

### Support and Feedback

#### Q: How do I report bugs or request features?
A: You can report bugs or request features by creating an issue on the [GitHub repository](https://github.com/yourusername/ko-scanner/issues).

#### Q: Is there a community or forum for KnockoutJS Scanner users?
A: Currently, there's no dedicated community. For questions or discussions, you can use the GitHub issues section.