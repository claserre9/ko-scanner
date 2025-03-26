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
}

export function getKOObservables(): KOTrackedProperty[] {
	if (!(window as any).ko || !(window as any).$0) return [];

	const data = (window as any).ko.dataFor((window as any).$0);
	if (!data) return [];

	const props = Object.getOwnPropertyNames(data);
	const ko = (window as any).ko;
	const result: KOTrackedProperty[] = [];

	for (const key of props) {
		const prop = data[key];
		if (typeof prop === "function") {
			if (ko.isObservable(prop)) {
				const type: KOTrackedProperty["type"] = ko.isComputed(prop)
					? "computed"
					: ko.isObservable(prop) && Array.isArray(prop())
					? "observableArray"
					: "observable";

				result.push({
					name: key,
					type,
					value: prop(),
				});
			}
		}
	}

	return result;
}
