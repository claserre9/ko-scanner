import { getKOObservables, KOTrackedProperty, updateKOObservable, monitorKOObservables, monitorKOPerformance, KOPerformanceMetrics } from "./core";
import { getCurrentLocale, getMessages, LocaleMessages, setCurrentLocale, LocaleCode } from "./locales";
import { loadSettings, saveSettings, updateSetting, applyTheme, formatData, Settings } from "./settings";

// Get the current locale and messages
let currentLocale = getCurrentLocale();
let messages = getMessages(currentLocale);

// Load user settings
let userSettings = loadSettings();

// Store the current list of observables
let currentObservables: KOTrackedProperty[] = [];
let filteredObservables: KOTrackedProperty[] = [];

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

		// For computed observables, display the value and dependencies (not editable)
		if (prop.type === "computed") {
			valueElement.innerHTML = `${messages.observableValue}: <code>${formatData(prop.value, userSettings.dataFormat)}</code>`;

			// Add dependencies if available
			if (prop.dependencies && prop.dependencies.length > 0) {
				const dependenciesElement = document.createElement("div");
				dependenciesElement.className = "observable-dependencies";

				const dependenciesTitle = document.createElement("div");
				dependenciesTitle.className = "dependencies-title";
				dependenciesTitle.textContent = messages.dependencies || "Dependencies:";
				dependenciesElement.appendChild(dependenciesTitle);

				const dependenciesList = document.createElement("ul");
				dependenciesList.className = "dependencies-list";

				for (const depName of prop.dependencies) {
					const depItem = document.createElement("li");
					depItem.className = "dependency-item";

					// Create a link to highlight the dependency when clicked
					const depLink = document.createElement("a");
					depLink.href = "#";
					depLink.textContent = depName;
					depLink.addEventListener("click", (e) => {
						e.preventDefault();
						highlightObservable(depName);
					});

					depItem.appendChild(depLink);
					dependenciesList.appendChild(depItem);
				}

				dependenciesElement.appendChild(dependenciesList);
				item.appendChild(dependenciesElement);
			}
		} else {
			// For regular observables and observable arrays, make them editable
			valueElement.innerHTML = `${messages.observableValue}: `;

			// Create an editable field based on the value type
			const valueType = typeof prop.value;

			if (valueType === "boolean") {
				// For boolean values, create a checkbox
				const checkbox = document.createElement("input");
				checkbox.type = "checkbox";
				checkbox.checked = prop.value;
				checkbox.addEventListener("change", () => {
					updateObservableValue(prop.name, checkbox.checked);
				});
				valueElement.appendChild(checkbox);
			} else if (valueType === "number") {
				// For number values, create a number input
				const input = document.createElement("input");
				input.type = "number";
				input.value = prop.value;
				input.className = "editable-value";
				input.addEventListener("change", () => {
					updateObservableValue(prop.name, parseFloat(input.value));
				});
				valueElement.appendChild(input);
			} else if (prop.type === "observableArray") {
				// For arrays, show a formatted display with edit button
				const arrayDisplay = document.createElement("code");
				arrayDisplay.textContent = formatData(prop.value, userSettings.dataFormat);

				const editButton = document.createElement("button");
				editButton.textContent = messages.edit || "Edit";
				editButton.className = "edit-button";
				editButton.addEventListener("click", () => {
					showArrayEditor(prop.name, prop.value);
				});

				valueElement.appendChild(arrayDisplay);
				valueElement.appendChild(document.createTextNode(" "));
				valueElement.appendChild(editButton);
			} else {
				// For string and other values, create a text input
				const input = document.createElement("input");
				input.type = "text";
				input.value = valueType === "object" ? JSON.stringify(prop.value) : prop.value;
				input.className = "editable-value";
				input.addEventListener("change", () => {
					let newValue = input.value;
					// Try to parse JSON if the original value was an object
					if (valueType === "object") {
						try {
							newValue = JSON.parse(input.value);
						} catch (e) {
							console.error("Invalid JSON:", e);
							// Revert to original value on error
							input.value = JSON.stringify(prop.value);
							return;
						}
					}
					updateObservableValue(prop.name, newValue);
				});
				valueElement.appendChild(input);
			}
		}

		item.appendChild(valueElement);

		container.appendChild(item);
	}
}

/**
 * Filter observables based on search term and type filter
 */
function filterObservables(): void {
	const searchInput = document.getElementById("searchInput") as HTMLInputElement;
	const filterTypeSelect = document.getElementById("filterTypeSelect") as HTMLSelectElement;

	if (!searchInput || !filterTypeSelect) return;

	const searchTerm = searchInput.value.toLowerCase();
	const filterType = filterTypeSelect.value;

	// Filter observables based on search term and type
	filteredObservables = currentObservables.filter(prop => {
		// Filter by name (search term)
		const nameMatches = prop.name.toLowerCase().includes(searchTerm);

		// Filter by type
		const typeMatches = filterType === "all" || prop.type === filterType;

		return nameMatches && typeMatches;
	});

	// Render the filtered observables
	renderProperties(filteredObservables);
}

function fetchAndRender(): void {
	console.log(`🔁 ${messages.selectionChangeDetected}`);

	// Stop any existing monitoring before fetching new observables
	stopObservableMonitoring();

	chrome.devtools.inspectedWindow.eval(
		`(${getKOObservables.toString()})()`,
		(result: KOTrackedProperty[] | undefined, exceptionInfo) => {
			if (!exceptionInfo && result) {
				// Store the current observables
				currentObservables = result;

				// Apply any active filters
				filterObservables();

				// Start real-time monitoring if enabled in settings
				if (userSettings.realTimeMonitoring) {
					startObservableMonitoring();
				}
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

	// Set up search and filter functionality
	setupSearchAndFilter();
}

/**
 * Set up search and filter functionality
 */
function setupSearchAndFilter(): void {
	const searchInput = document.getElementById("searchInput") as HTMLInputElement;
	const filterTypeSelect = document.getElementById("filterTypeSelect") as HTMLSelectElement;

	if (searchInput) {
		// Add event listener for search input (debounced to avoid too many updates)
		let searchTimeout: number | null = null;
		searchInput.addEventListener("input", () => {
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}
			searchTimeout = window.setTimeout(() => {
				filterObservables();
				searchTimeout = null;
			}, 300); // 300ms debounce
		});

		// Add placeholder text localization
		searchInput.placeholder = messages.searchPlaceholder || "Search observables...";
	}

	if (filterTypeSelect) {
		// Add event listener for filter type select
		filterTypeSelect.addEventListener("change", filterObservables);

		// Add option text localization
		const options = filterTypeSelect.options;
		for (let i = 0; i < options.length; i++) {
			const option = options[i];
			switch (option.value) {
				case "all":
					option.textContent = messages.filterAll || "All types";
					break;
				case "observable":
					option.textContent = messages.filterObservable || "Observable";
					break;
				case "observableArray":
					option.textContent = messages.filterObservableArray || "Observable Array";
					break;
				case "computed":
					option.textContent = messages.filterComputed || "Computed";
					break;
			}
		}
	}
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

	const realTimeMonitoringLabel = document.getElementById("realTimeMonitoringLabel");
	if (realTimeMonitoringLabel) {
		realTimeMonitoringLabel.textContent = messages.realTimeMonitoring || "Real-time monitoring";
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

	const realTimeMonitoringCheckbox = document.getElementById("realTimeMonitoringCheckbox") as HTMLInputElement;
	if (realTimeMonitoringCheckbox) {
		realTimeMonitoringCheckbox.checked = userSettings.realTimeMonitoring;
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
	const realTimeMonitoringCheckbox = document.getElementById("realTimeMonitoringCheckbox") as HTMLInputElement;

	// Update settings object
	userSettings.theme = themeSelect.value as Settings["theme"];
	userSettings.dataFormat = dataFormatSelect.value as Settings["dataFormat"];
	userSettings.showTypes = showTypesCheckbox.checked;
	userSettings.autoRefresh = autoRefreshCheckbox.checked;
	userSettings.realTimeMonitoring = realTimeMonitoringCheckbox.checked;
	userSettings.locale = currentLocale;

	// Save settings
	saveSettings(userSettings);

	// Apply settings
	applyTheme(userSettings.theme);
	updateAutoRefresh();

	// Start or stop real-time monitoring based on settings
	if (userSettings.realTimeMonitoring) {
		startObservableMonitoring();
	} else {
		stopObservableMonitoring();
	}

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

// Function to dispose observable monitoring
let disposeMonitoring: (() => void) | null = null;

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

/**
 * Start monitoring observable changes in real-time
 */
function startObservableMonitoring(): void {
	// Stop any existing monitoring
	stopObservableMonitoring();

	// Start monitoring in the inspected window
	chrome.devtools.inspectedWindow.eval(
		`(${monitorKOObservables.toString()})()`,
		(result, exceptionInfo) => {
			if (exceptionInfo) {
				console.error("Error starting observable monitoring:", exceptionInfo);
			} else {
				console.log("Observable monitoring started");

				// Set up event listener for observable changes
				document.addEventListener("knockoutObservableChanged", handleObservableChange);
			}
		}
	);
}

/**
 * Stop monitoring observable changes
 */
function stopObservableMonitoring(): void {
	// Remove event listener
	document.removeEventListener("knockoutObservableChanged", handleObservableChange);

	// Dispose monitoring in the inspected window
	if (disposeMonitoring) {
		chrome.devtools.inspectedWindow.eval(
			`(${disposeMonitoring.toString()})()`,
			(result, exceptionInfo) => {
				if (exceptionInfo) {
					console.error("Error stopping observable monitoring:", exceptionInfo);
				} else {
					console.log("Observable monitoring stopped");
				}
			}
		);
		disposeMonitoring = null;
	}
}

/**
 * Handle observable change events
 */
function handleObservableChange(event: Event): void {
	const customEvent = event as CustomEvent;
	if (customEvent.detail) {
		const { name, value } = customEvent.detail;
		console.log(`Observable changed: ${name} = ${JSON.stringify(value)}`);

		// Update the UI to reflect the change
		updateObservableInUI(name, value);
	}
}

/**
 * Highlight an observable in the UI
 * @param name The name of the observable to highlight
 */
function highlightObservable(name: string): void {
	// Remove highlight from all observables
	const allObservables = document.querySelectorAll(".observable-item");
	allObservables.forEach(item => {
		item.classList.remove("highlighted");
	});

	// Find the observable by name and highlight it
	for (let i = 0; i < allObservables.length; i++) {
		const item = allObservables[i] as HTMLElement;
		const nameElement = item.querySelector(".observable-name");

		if (nameElement && nameElement.textContent === name) {
			// Found the observable, highlight it
			item.classList.add("highlighted");

			// Scroll the observable into view
			item.scrollIntoView({ behavior: "smooth", block: "center" });
			break;
		}
	}
}

/**
 * Update a specific observable in the UI without refreshing everything
 */
function updateObservableInUI(name: string, value: any): void {
	// Find the observable item in the UI
	const observableItems = document.querySelectorAll(".observable-item");
	for (let i = 0; i < observableItems.length; i++) {
		const item = observableItems[i] as HTMLElement;
		const nameElement = item.querySelector(".observable-name");

		if (nameElement && nameElement.textContent === name) {
			// Found the observable, update its value display
			const valueElement = item.querySelector(".observable-property:last-child");
			if (valueElement) {
				// Handle different types of input elements
				const input = valueElement.querySelector("input");
				if (input) {
					if (input.type === "checkbox") {
						(input as HTMLInputElement).checked = value;
					} else if (input.type === "number") {
						(input as HTMLInputElement).value = value;
					} else {
						(input as HTMLInputElement).value = typeof value === "object" ? 
							JSON.stringify(value) : value;
					}
				} else {
					// Handle code display for computed observables or arrays
					const codeElement = valueElement.querySelector("code");
					if (codeElement) {
						codeElement.textContent = formatData(value, userSettings.dataFormat);
					}
				}
			}
			break;
		}
	}
}

/**
 * Updates the value of a Knockout observable in the inspected page
 * @param propertyName The name of the observable property to update
 * @param newValue The new value to set
 */
function updateObservableValue(propertyName: string, newValue: any): void {
	// Execute the updateKOObservable function in the inspected window
	chrome.devtools.inspectedWindow.eval(
		`(${updateKOObservable.toString()})(${JSON.stringify(propertyName)}, ${JSON.stringify(newValue)})`,
		(result: boolean | undefined, exceptionInfo) => {
			if (exceptionInfo) {
				console.error("Error updating observable:", exceptionInfo);
				// Show error message to user
				const container = document.getElementById("observableList")!;
				const errorMessage = document.createElement("div");
				errorMessage.className = "message error";
				errorMessage.textContent = messages.errorUpdatingObservable || "Error updating observable";
				container.insertBefore(errorMessage, container.firstChild);

				// Remove error message after 3 seconds
				setTimeout(() => {
					if (errorMessage.parentNode === container) {
						container.removeChild(errorMessage);
					}
				}, 3000);
			} else if (result) {
				// Show success message
				const container = document.getElementById("observableList")!;
				const successMessage = document.createElement("div");
				successMessage.className = "message success";
				successMessage.textContent = messages.observableUpdated || "Observable updated successfully";
				container.insertBefore(successMessage, container.firstChild);

				// Remove success message after 3 seconds
				setTimeout(() => {
					if (successMessage.parentNode === container) {
						container.removeChild(successMessage);
					}
				}, 3000);

				// Refresh the display to show the updated value
				fetchAndRender();
			}
		}
	);
}

/**
 * Shows a modal dialog for editing array values
 * @param propertyName The name of the observable array property
 * @param arrayValue The current array value
 */
function showArrayEditor(propertyName: string, arrayValue: any[]): void {
	// Create modal overlay
	const overlay = document.createElement("div");
	overlay.className = "modal-overlay";
	document.body.appendChild(overlay);

	// Create modal container
	const modal = document.createElement("div");
	modal.className = "modal-container";
	overlay.appendChild(modal);

	// Create modal header
	const header = document.createElement("div");
	header.className = "modal-header";
	modal.appendChild(header);

	// Create title
	const title = document.createElement("h3");
	title.textContent = `${messages.editArray || "Edit Array"}: ${propertyName}`;
	header.appendChild(title);

	// Create close button
	const closeButton = document.createElement("button");
	closeButton.textContent = "×";
	closeButton.className = "modal-close";
	closeButton.addEventListener("click", () => {
		document.body.removeChild(overlay);
	});
	header.appendChild(closeButton);

	// Create modal content
	const content = document.createElement("div");
	content.className = "modal-content";
	modal.appendChild(content);

	// Create array editor
	const editor = document.createElement("textarea");
	editor.className = "array-editor";
	editor.value = JSON.stringify(arrayValue, null, 2);
	content.appendChild(editor);

	// Create modal footer with buttons
	const footer = document.createElement("div");
	footer.className = "modal-footer";
	modal.appendChild(footer);

	// Create cancel button
	const cancelButton = document.createElement("button");
	cancelButton.textContent = messages.cancel || "Cancel";
	cancelButton.className = "modal-button";
	cancelButton.addEventListener("click", () => {
		document.body.removeChild(overlay);
	});
	footer.appendChild(cancelButton);

	// Create save button
	const saveButton = document.createElement("button");
	saveButton.textContent = messages.save || "Save";
	saveButton.className = "modal-button primary";
	saveButton.addEventListener("click", () => {
		try {
			const newValue = JSON.parse(editor.value);
			if (!Array.isArray(newValue)) {
				throw new Error("Value must be an array");
			}
			updateObservableValue(propertyName, newValue);
			document.body.removeChild(overlay);
		} catch (e) {
			console.error("Invalid JSON:", e);
			alert(messages.invalidArrayFormat || "Invalid array format. Please enter a valid JSON array.");
		}
	});
	footer.appendChild(saveButton);
}

/**
 * Switch between tabs in the panel
 */
function setupTabs(): void {
        const observablesTabButton = document.getElementById('observablesTabButton');
        const performanceTabButton = document.getElementById('performanceTabButton');
        const observablesTab = document.getElementById('observablesTab');
        const performanceTab = document.getElementById('performanceTab');

        if (observablesTabButton && performanceTabButton && observablesTab && performanceTab) {
                observablesTabButton.addEventListener('click', () => {
                        observablesTabButton.classList.add('active');
                        performanceTabButton.classList.remove('active');
                        observablesTab.classList.add('active');
                        performanceTab.classList.remove('active');
                });

                performanceTabButton.addEventListener('click', () => {
                        performanceTabButton.classList.add('active');
                        observablesTabButton.classList.remove('active');
                        performanceTab.classList.add('active');
                        observablesTab.classList.remove('active');
                });
        }
}

let performanceIntervalId: number | null = null;

function renderPerformanceMetrics(metrics: KOPerformanceMetrics[]): void {
        const container = document.getElementById('performanceMetrics')!;
        container.innerHTML = '';

        if (metrics.length === 0) {
                const message = document.createElement('div');
                message.className = 'message';
                message.textContent = 'No metrics recorded';
                container.appendChild(message);
                return;
        }

        const table = document.createElement('table');
        table.className = 'performance-table';
        table.innerHTML = `<thead><tr><th>Name</th><th>Type</th><th>Count</th><th>Last (ms)</th><th>Avg (ms)</th></tr></thead>`;
        const tbody = document.createElement('tbody');
        for (const m of metrics) {
                const row = document.createElement('tr');
                row.innerHTML = `<td>${m.name}</td><td>${m.type}</td><td>${m.evaluationCount}</td><td>${m.lastEvaluationTime.toFixed(2)}</td><td>${m.averageEvaluationTime.toFixed(2)}</td>`;
                tbody.appendChild(row);
        }
        table.appendChild(tbody);
        container.appendChild(table);
}

function updatePerformanceMetrics(): void {
        chrome.devtools.inspectedWindow.eval(
                `window.__koPerfMon ? window.__koPerfMon.getMetrics() : []`,
                (result: KOPerformanceMetrics[] | undefined, exceptionInfo) => {
                        if (!exceptionInfo && result) {
                                renderPerformanceMetrics(result);
                        }
                }
        );
}

function startPerformanceMonitoringHandler(): void {
        chrome.devtools.inspectedWindow.eval(
                `window.__koPerfMon = (${monitorKOPerformance.toString()})();`,
                (result, exceptionInfo) => {
                        if (exceptionInfo) {
                                console.error('Error starting performance monitoring:', exceptionInfo);
                                return;
                        }
                        const startBtn = document.getElementById('startPerformanceMonitoring') as HTMLButtonElement;
                        const stopBtn = document.getElementById('stopPerformanceMonitoring') as HTMLButtonElement;
                        const clearBtn = document.getElementById('clearPerformanceMetrics') as HTMLButtonElement;
                        if (startBtn) startBtn.disabled = true;
                        if (stopBtn) stopBtn.disabled = false;
                        if (clearBtn) clearBtn.disabled = false;

                        updatePerformanceMetrics();
                        performanceIntervalId = window.setInterval(updatePerformanceMetrics, 1000);
                }
        );
}

function stopPerformanceMonitoringHandler(): void {
        chrome.devtools.inspectedWindow.eval(
                `if (window.__koPerfMon){window.__koPerfMon.stopMonitoring();delete window.__koPerfMon;}`,
                () => {}
        );

        if (performanceIntervalId) {
                clearInterval(performanceIntervalId);
                performanceIntervalId = null;
        }

        const startBtn = document.getElementById('startPerformanceMonitoring') as HTMLButtonElement;
        const stopBtn = document.getElementById('stopPerformanceMonitoring') as HTMLButtonElement;
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
}

function clearPerformanceMetricsHandler(): void {
        const clearBtn = document.getElementById('clearPerformanceMetrics') as HTMLButtonElement;
        if (clearBtn) clearBtn.disabled = true;
        const container = document.getElementById('performanceMetrics');
        if (container) {
                container.innerHTML = '<div class="message">Performance monitoring not started</div>';
        }
}

function setupPerformanceMonitoring(): void {
        const startBtn = document.getElementById('startPerformanceMonitoring');
        const stopBtn = document.getElementById('stopPerformanceMonitoring');
        const clearBtn = document.getElementById('clearPerformanceMetrics');

        if (startBtn && stopBtn && clearBtn) {
                startBtn.addEventListener('click', startPerformanceMonitoringHandler);
                stopBtn.addEventListener('click', stopPerformanceMonitoringHandler);
                clearBtn.addEventListener('click', clearPerformanceMetricsHandler);
        }
}

document.addEventListener("DOMContentLoaded", () => {
        initializeUI();
        setupTabs();
        setupPerformanceMonitoring();
        fetchAndRender();

	// Listen for selection changes
	chrome.devtools.panels.elements.onSelectionChanged.addListener(
		fetchAndRender
	);

	// Set up auto-refresh
	updateAutoRefresh();

	// Start real-time monitoring if enabled in settings
	if (userSettings.realTimeMonitoring) {
		startObservableMonitoring();
	}
});
