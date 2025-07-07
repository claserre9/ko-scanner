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

function getAllKODataObjects(): any[] {
        const ko = (window as any).ko;
        const elements = Array.from(document.querySelectorAll('*')) as Element[];
        const dataObjects: any[] = [];
        const seen = new Set<any>();

        for (const el of elements) {
                try {
                        const data = ko.dataFor(el);
                        if (data && !seen.has(data)) {
                                seen.add(data);
                                dataObjects.push(data);
                        }
                } catch (e) {
                        // Ignore errors from elements not handled by Knockout
                }
        }

        return dataObjects;
}

export function getKOObservables(): KOTrackedProperty[] {
        if (!(window as any).ko) return [];

        const ko = (window as any).ko;
        const dataObjects = getAllKODataObjects();
        const result: KOTrackedProperty[] = [];

        for (const data of dataObjects) {
                const props = Object.getOwnPropertyNames(data);
                const observableMap: Record<string, any> = {};

                // First pass: collect all observables and their names
                for (const key of props) {
                        const prop = data[key];
                        if (typeof prop === 'function' && ko.isObservable(prop)) {
                                observableMap[key] = prop;
                        }
                }

                // Second pass: create tracked properties with dependency information
                for (const key of props) {
                        const prop = data[key];
                        if (typeof prop === 'function' && ko.isObservable(prop)) {
                                const type: KOTrackedProperty['type'] = ko.isComputed(prop)
                                        ? 'computed'
                                        : ko.isObservable(prop) && Array.isArray(prop())
                                        ? 'observableArray'
                                        : 'observable';

                                const trackedProp: KOTrackedProperty = {
                                        name: key,
                                        type,
                                        value: prop(),
                                };

                                if (type === 'computed' && prop.getDependenciesCount && prop.getDependencies) {
                                        try {
                                                const dependencies = prop.getDependencies();
                                                if (dependencies && Array.isArray(dependencies)) {
                                                        trackedProp.dependencies = Object.keys(observableMap).filter(name =>
                                                                dependencies.includes(observableMap[name])
                                                        );
                                                }
                                        } catch (e) {
                                                console.log('Could not get dependencies for computed observable:', e);
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
        if (!(window as any).ko) return false;

        const ko = (window as any).ko;
        const dataObjects = getAllKODataObjects();

        for (const data of dataObjects) {
                if (propertyName in data && typeof data[propertyName] === 'function' && ko.isObservable(data[propertyName])) {
                        if (ko.isComputed(data[propertyName])) {
                                return false;
                        }

                        try {
                                data[propertyName](newValue);
                                return true;
                        } catch (error) {
                                console.error(`Error updating observable ${propertyName}:`, error);
                                return false;
                        }
                }
        }

        return false;
}

/**
 * Sets up real-time monitoring of Knockout observables
 * @returns A function to stop monitoring
 */
export function monitorKOObservables(): () => void {
        if (!(window as any).ko) return () => {};

        const ko = (window as any).ko;
        const dataObjects = getAllKODataObjects();
        const subscriptions: { [key: string]: any } = {};

        const notifyChange = (name: string, newValue: any) => {
                const event = new CustomEvent('knockoutObservableChanged', {
                        detail: { name, value: newValue }
                });
                document.dispatchEvent(event);
        };

        for (const data of dataObjects) {
                const props = Object.getOwnPropertyNames(data);

                for (const key of props) {
                        const prop = data[key];
                        if (typeof prop === 'function' && ko.isObservable(prop)) {
                                subscriptions[key] = prop.subscribe((newValue: any) => {
                                        notifyChange(key, newValue);
                                });
                        }
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
        if (!(window as any).ko) {
                return {
                        getMetrics: () => [],
                        stopMonitoring: () => {}
                };
        }

        const ko = (window as any).ko;
        const dataObjects = getAllKODataObjects();
        const metrics: Record<string, KOPerformanceMetrics> = {};
        const originalFunctionsMap = new Map<any, Record<string, Function>>();

        for (const data of dataObjects) {
                const props = Object.getOwnPropertyNames(data);
                const originalFunctions: Record<string, Function> = {};
                for (const key of props) {
                        const prop = data[key];
                        if (typeof prop === 'function' && ko.isObservable(prop)) {
                                const type: 'observable' | 'observableArray' | 'computed' = ko.isComputed(prop)
                                        ? 'computed'
                                        : ko.isObservable(prop) && Array.isArray(prop())
                                        ? 'observableArray'
                                        : 'observable';

                                metrics[key] = {
                                        name: key,
                                        type,
                                        evaluationCount: 0,
                                        lastEvaluationTime: 0,
                                        averageEvaluationTime: 0,
                                        totalEvaluationTime: 0
                                };

                                if (type === 'computed' || type === 'observableArray') {
                                        originalFunctions[key] = prop.peek || prop;

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
                if (Object.keys(originalFunctions).length > 0) {
                        originalFunctionsMap.set(data, originalFunctions);
                }
        }

	// Function to get current metrics
	const getMetrics = (): KOPerformanceMetrics[] => {
		return Object.values(metrics);
	};

	// Function to stop monitoring and restore original functions
	const stopMonitoring = () => {
                for (const [obj, originals] of originalFunctionsMap.entries()) {
                        for (const key in originals) {
                                if (obj[key] && typeof obj[key] === 'function') {
                                        obj[key].peek = originals[key];
                                }
                        }
                }
	};

	return { getMetrics, stopMonitoring };
}
