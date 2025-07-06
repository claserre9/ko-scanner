export interface KnockoutViewModelResult {
	viewModel: Record<string, any>;
	context: Record<string, any>;
}

// Fonction exécutée dans la page inspectée pour récupérer les données Knockout
export function getKODataAndContext(): KnockoutViewModelResult {
	if (!(window as any).ko || !(window as any).$0)
		return { viewModel: {}, context: {} };

	const data = (window as any).ko.dataFor((window as any).$0) || {};
	const context = (window as any).ko.contextFor((window as any).$0) || {};

	const copyProps = (obj: any): Record<string, any> =>
		Object.getOwnPropertyNames(obj).reduce(
			(acc: Record<string, any>, key: string) => {
				acc[key] = obj[key];
				return acc;
			},
			Object.create(null)
		);

	return {
		viewModel: copyProps(data),
		context: copyProps(context),
	};
}

export interface KOTrackedProperty {
	name: string;
	type: "observable" | "observableArray" | "computed";
	value: any;
	dependencies?: string[]; // Names of observables this computed depends on
}

export function getKOObservables(): KOTrackedProperty[] {
	if (!(window as any).ko || !(window as any).$0) return [];

	const data = (window as any).ko.dataFor((window as any).$0);
	if (!data) return [];

	const props = Object.getOwnPropertyNames(data);
	const ko = (window as any).ko;
	const result: KOTrackedProperty[] = [];
	const observableMap: Record<string, any> = {}; // Map of observable names to their objects

	// First pass: collect all observables and their names
	for (const key of props) {
		const prop = data[key];
		if (typeof prop === "function" && ko.isObservable(prop)) {
			observableMap[key] = prop;
		}
	}

	// Second pass: create tracked properties with dependency information
	for (const key of props) {
		const prop = data[key];
		if (typeof prop === "function") {
			if (ko.isObservable(prop)) {
				const type: KOTrackedProperty["type"] = ko.isComputed(prop)
					? "computed"
					: ko.isObservable(prop) && Array.isArray(prop())
					? "observableArray"
					: "observable";

				const trackedProp: KOTrackedProperty = {
					name: key,
					type,
					value: prop(),
				};

				// For computed observables, try to extract dependencies
				if (type === "computed" && prop.getDependenciesCount && prop.getDependencies) {
					try {
						// Some KO versions expose dependency information
						const dependencies = prop.getDependencies();
						if (dependencies && Array.isArray(dependencies)) {
							// Find the observable names by comparing with our map
							trackedProp.dependencies = Object.keys(observableMap).filter(name => {
								return dependencies.includes(observableMap[name]);
							});
						}
					} catch (e) {
						console.log("Could not get dependencies for computed observable:", e);
					}
				}

				result.push(trackedProp);
			}
		}
	}

	return result;
}

/**
 * Updates the value of a Knockout observable in the inspected page
 * @param propertyName The name of the observable property to update
 * @param newValue The new value to set
 * @returns A boolean indicating whether the update was successful
 */
export function updateKOObservable(propertyName: string, newValue: any): boolean {
	if (!(window as any).ko || !(window as any).$0) return false;

	const data = (window as any).ko.dataFor((window as any).$0);
	if (!data) return false;

	// Check if the property exists and is an observable
	if (!(propertyName in data) || typeof data[propertyName] !== "function" || 
		!(window as any).ko.isObservable(data[propertyName])) {
		return false;
	}

	// Don't allow updating computed observables
	if ((window as any).ko.isComputed(data[propertyName])) {
		return false;
	}

	try {
		// Update the observable value
		data[propertyName](newValue);
		return true;
	} catch (error) {
		console.error(`Error updating observable ${propertyName}:`, error);
		return false;
	}
}

/**
 * Sets up real-time monitoring of Knockout observables
 * @returns A function to stop monitoring
 */
export function monitorKOObservables(): () => void {
	if (!(window as any).ko || !(window as any).$0) return () => {};

	const data = (window as any).ko.dataFor((window as any).$0);
	if (!data) return () => {};

	const ko = (window as any).ko;
	const subscriptions: { [key: string]: any } = {};
	const props = Object.getOwnPropertyNames(data);

	// Function to notify DevTools of changes
	const notifyChange = (name: string, newValue: any) => {
		// Use a custom event to notify DevTools of changes
		const event = new CustomEvent('knockoutObservableChanged', {
			detail: { name, value: newValue }
		});
		document.dispatchEvent(event);
	};

	// Subscribe to all observables
	for (const key of props) {
		const prop = data[key];
		if (typeof prop === "function" && ko.isObservable(prop)) {
			// Subscribe to changes
			subscriptions[key] = prop.subscribe((newValue: any) => {
				notifyChange(key, newValue);
			});
		}
	}

	// Return a function to dispose all subscriptions
	return () => {
		Object.values(subscriptions).forEach((subscription: any) => {
			subscription.dispose();
		});
	};
}

/**
 * Performance metrics for a Knockout observable
 */
export interface KOPerformanceMetrics {
	name: string;
	type: "observable" | "observableArray" | "computed";
	evaluationCount: number;
	lastEvaluationTime: number;
	averageEvaluationTime: number;
	totalEvaluationTime: number;
}

/**
 * Monitors the performance of Knockout observables
 * @returns An object with performance metrics and a function to stop monitoring
 */
export function monitorKOPerformance(): { 
	getMetrics: () => KOPerformanceMetrics[],
	stopMonitoring: () => void 
} {
	if (!(window as any).ko || !(window as any).$0) {
		return { 
			getMetrics: () => [], 
			stopMonitoring: () => {} 
		};
	}

	const data = (window as any).ko.dataFor((window as any).$0);
	if (!data) {
		return { 
			getMetrics: () => [], 
			stopMonitoring: () => {} 
		};
	}

	const ko = (window as any).ko;
	const props = Object.getOwnPropertyNames(data);
	const metrics: Record<string, KOPerformanceMetrics> = {};
	const originalFunctions: Record<string, Function> = {};

	// Initialize metrics for all observables
	for (const key of props) {
		const prop = data[key];
		if (typeof prop === "function" && ko.isObservable(prop)) {
			const type: "observable" | "observableArray" | "computed" = ko.isComputed(prop)
				? "computed"
				: ko.isObservable(prop) && Array.isArray(prop())
				? "observableArray"
				: "observable";

			metrics[key] = {
				name: key,
				type,
				evaluationCount: 0,
				lastEvaluationTime: 0,
				averageEvaluationTime: 0,
				totalEvaluationTime: 0
			};

			// Only instrument computed observables and observable arrays
			// (regular observables don't have evaluation logic)
			if (type === "computed" || type === "observableArray") {
				// Save the original function
				originalFunctions[key] = prop.peek || prop;

				// Monkey patch the function to measure performance
				const originalFn = prop.peek || prop;
				prop.peek = function() {
					const startTime = performance.now();
					const result = originalFn.apply(this, arguments);
					const endTime = performance.now();
					const executionTime = endTime - startTime;

					// Update metrics
					metrics[key].evaluationCount++;
					metrics[key].lastEvaluationTime = executionTime;
					metrics[key].totalEvaluationTime += executionTime;
					metrics[key].averageEvaluationTime = 
						metrics[key].totalEvaluationTime / metrics[key].evaluationCount;

					return result;
				};
			}
		}
	}

	// Function to get current metrics
	const getMetrics = (): KOPerformanceMetrics[] => {
		return Object.values(metrics);
	};

	// Function to stop monitoring and restore original functions
	const stopMonitoring = () => {
		for (const key in originalFunctions) {
			if (data[key] && typeof data[key] === "function") {
				data[key].peek = originalFunctions[key];
			}
		}
	};

	return { getMetrics, stopMonitoring };
}
