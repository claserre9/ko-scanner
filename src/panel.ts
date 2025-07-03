import { getKOObservables, KOTrackedProperty } from "./core";
import { getCurrentLocale, getMessages, LocaleMessages, setCurrentLocale, LocaleCode } from "./locales";
import { loadSettings, saveSettings, updateSetting, applyTheme, formatData, Settings } from "./settings";

// Get the current locale and messages
let currentLocale = getCurrentLocale();
let messages = getMessages(currentLocale);

// Load user settings
let userSettings = loadSettings();

function renderProperties(properties: KOTrackedProperty[]): void {
	const container = document.getElementById("observableList")!;
	container.innerHTML = ""; // Reset
	container.className = ""; // Remove message class if it exists

	if (properties.length === 0) {
		container.className = "message";
		container.innerHTML = `<p>${messages.noObservablesFound}</p>`;
		return;
	}

	for (const prop of properties) {
		const item = document.createElement("div");
		item.className = "observable-item";

		// Create the observable name element
		const nameElement = document.createElement("div");
		nameElement.className = "observable-name";
		nameElement.textContent = prop.name;
		item.appendChild(nameElement);

		// Add type information if enabled in settings
		if (userSettings.showTypes) {
			const typeElement = document.createElement("div");
			typeElement.className = "observable-property";
			typeElement.innerHTML = `${messages.observableType}: <code>${prop.type}</code>`;
			item.appendChild(typeElement);
		}

		// Add value with formatting based on settings
		const valueElement = document.createElement("div");
		valueElement.className = "observable-property";
		valueElement.innerHTML = `${messages.observableValue}: <code>${formatData(prop.value, userSettings.dataFormat)}</code>`;
		item.appendChild(valueElement);

		container.appendChild(item);
	}
}

function fetchAndRender(): void {
	console.log(`🔁 ${messages.selectionChangeDetected}`);
	chrome.devtools.inspectedWindow.eval(
		`(${getKOObservables.toString()})()`,
		(result: KOTrackedProperty[] | undefined, exceptionInfo) => {
			if (!exceptionInfo && result) {
				renderProperties(result);
			} else {
				const container = document.getElementById("observableList")!;
				container.className = "message";
				container.innerHTML = `<p>${messages.errorInspectingViewModel}</p>`;
			}
		}
	);
}

/**
 * Initialize the UI with the current locale and settings
 */
function initializeUI(): void {
	// Set the panel title
	const titleElement = document.querySelector("h2");
	if (titleElement) {
		titleElement.textContent = messages.panelTitle;
	}

	// Set the loading text
	const observableList = document.getElementById("observableList");
	if (observableList && observableList.textContent === "Loading...") {
		observableList.textContent = messages.loading;
	}

	// Initialize settings panel text
	initializeSettingsPanel();

	// Apply theme from settings
	applyTheme(userSettings.theme);
}

/**
 * Initialize the settings panel with localized text and current settings
 */
function initializeSettingsPanel(): void {
	// Set settings panel title
	const settingsTitle = document.getElementById("settingsTitle");
	if (settingsTitle) {
		settingsTitle.textContent = messages.settings;
	}

	// Set theme section
	const themeTitle = document.getElementById("themeTitle");
	if (themeTitle) {
		themeTitle.textContent = messages.theme;
	}

	const themeLightOption = document.getElementById("themeLightOption");
	if (themeLightOption) {
		themeLightOption.textContent = messages.themeLight;
	}

	const themeDarkOption = document.getElementById("themeDarkOption");
	if (themeDarkOption) {
		themeDarkOption.textContent = messages.themeDark;
	}

	const themeSystemOption = document.getElementById("themeSystemOption");
	if (themeSystemOption) {
		themeSystemOption.textContent = messages.themeSystem;
	}

	// Set data format section
	const dataFormatTitle = document.getElementById("dataFormatTitle");
	if (dataFormatTitle) {
		dataFormatTitle.textContent = messages.dataFormat;
	}

	const dataFormatCompactOption = document.getElementById("dataFormatCompactOption");
	if (dataFormatCompactOption) {
		dataFormatCompactOption.textContent = messages.dataFormatCompact;
	}

	const dataFormatPrettyOption = document.getElementById("dataFormatPrettyOption");
	if (dataFormatPrettyOption) {
		dataFormatPrettyOption.textContent = messages.dataFormatPretty;
	}

	// Set display options section
	const showTypesLabel = document.getElementById("showTypesLabel");
	if (showTypesLabel) {
		showTypesLabel.textContent = messages.showTypes;
	}

	const autoRefreshLabel = document.getElementById("autoRefreshLabel");
	if (autoRefreshLabel) {
		autoRefreshLabel.textContent = messages.autoRefresh;
	}

	// Set save button text
	const saveButton = document.getElementById("saveSettings");
	if (saveButton) {
		saveButton.textContent = messages.saveSettings;
	}

	// Set current values from settings
	const themeSelect = document.getElementById("themeSelect") as HTMLSelectElement;
	if (themeSelect) {
		themeSelect.value = userSettings.theme;
	}

	const dataFormatSelect = document.getElementById("dataFormatSelect") as HTMLSelectElement;
	if (dataFormatSelect) {
		dataFormatSelect.value = userSettings.dataFormat;
	}

	const showTypesCheckbox = document.getElementById("showTypesCheckbox") as HTMLInputElement;
	if (showTypesCheckbox) {
		showTypesCheckbox.checked = userSettings.showTypes;
	}

	const autoRefreshCheckbox = document.getElementById("autoRefreshCheckbox") as HTMLInputElement;
	if (autoRefreshCheckbox) {
		autoRefreshCheckbox.checked = userSettings.autoRefresh;
	}

	// Add event listeners for settings panel
	setupSettingsEventListeners();
}

/**
 * Set up event listeners for the settings panel
 */
function setupSettingsEventListeners(): void {
	// Settings button click
	const settingsButton = document.getElementById("settingsButton");
	const settingsPanel = document.getElementById("settingsPanel");

	if (settingsButton && settingsPanel) {
		settingsButton.addEventListener("click", () => {
			settingsPanel.classList.add("open");
		});
	}

	// Close button click
	const closeButton = document.getElementById("closeSettings");
	if (closeButton && settingsPanel) {
		closeButton.addEventListener("click", () => {
			settingsPanel.classList.remove("open");
		});
	}

	// Save settings button click
	const saveButton = document.getElementById("saveSettings");
	if (saveButton) {
		saveButton.addEventListener("click", saveUserSettings);
	}

	// Theme change preview
	const themeSelect = document.getElementById("themeSelect") as HTMLSelectElement;
	if (themeSelect) {
		themeSelect.addEventListener("change", () => {
			applyTheme(themeSelect.value as Settings["theme"]);
		});
	}
}

/**
 * Save user settings from the form
 */
function saveUserSettings(): void {
	const themeSelect = document.getElementById("themeSelect") as HTMLSelectElement;
	const dataFormatSelect = document.getElementById("dataFormatSelect") as HTMLSelectElement;
	const showTypesCheckbox = document.getElementById("showTypesCheckbox") as HTMLInputElement;
	const autoRefreshCheckbox = document.getElementById("autoRefreshCheckbox") as HTMLInputElement;

	// Update settings object
	userSettings.theme = themeSelect.value as Settings["theme"];
	userSettings.dataFormat = dataFormatSelect.value as Settings["dataFormat"];
	userSettings.showTypes = showTypesCheckbox.checked;
	userSettings.autoRefresh = autoRefreshCheckbox.checked;
	userSettings.locale = currentLocale;

	// Save settings
	saveSettings(userSettings);

	// Apply settings
	applyTheme(userSettings.theme);
	updateAutoRefresh();

	// Show success message
	const settingsMessage = document.getElementById("settingsMessage");
	if (settingsMessage) {
		settingsMessage.textContent = messages.settingsSaved;
		settingsMessage.classList.add("success");

		// Hide message after 3 seconds
		setTimeout(() => {
			settingsMessage.classList.remove("success");
		}, 3000);
	}

	// Refresh the display
	fetchAndRender();
}

// Auto-refresh interval ID
let autoRefreshIntervalId: number | null = null;

/**
 * Start or stop auto-refresh based on settings
 */
function updateAutoRefresh(): void {
	// Clear any existing interval
	if (autoRefreshIntervalId !== null) {
		clearInterval(autoRefreshIntervalId);
		autoRefreshIntervalId = null;
	}

	// Start new interval if auto-refresh is enabled
	if (userSettings.autoRefresh) {
		autoRefreshIntervalId = window.setInterval(() => {
			fetchAndRender();
		}, 3000); // Refresh every 3 seconds
	}
}

document.addEventListener("DOMContentLoaded", () => {
	initializeUI();
	fetchAndRender();

	// Listen for selection changes
	chrome.devtools.panels.elements.onSelectionChanged.addListener(
		fetchAndRender
	);

	// Set up auto-refresh
	updateAutoRefresh();
});
