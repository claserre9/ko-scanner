import { KOData, KOContext, KOViewModel } from './interfaces';

/**
 * Unwraps Knockout observables, with special handling for computed properties
 * and observable arrays.
 * @param value The value to unwrap.
 * @returns The unwrapped value, or an object indicating a computed property.
 */
function unwrapKOValue(value: unknown): unknown {
    const koRef = (window as any).ko;
    if (koRef && (koRef as any).isObservable(value)) {
        const observable: any = value;
        let unwrapped = typeof observable.peek === 'function' ? observable.peek() : observable();

        if (Array.isArray(unwrapped)) {
            unwrapped = unwrapped.slice();
        }

        if ((koRef as any).isComputed(observable)) {
            return { computed: unwrapped };
        }

        return unwrapped;
    }

    return value;
}

/**
 * Retrieves data and context for a Knockout.js view model.
 * @returns Object containing the view model data and context.
 */
export function getKODataAndContext(): KOData {
    const koRef = (window as any).ko;
    if (koRef) {
        let data = ($0 as any) ? (koRef as any).dataFor($0) : {};
        let context = ($0 as any) ? (koRef as any).contextFor($0) : {};

        if (data === null || data === undefined) {
            data = {};
        }

        if (context === null || context === undefined) {
            context = {};
        }

        const dataProps = Object.getOwnPropertyNames(data);
        const contextProps = Object.getOwnPropertyNames(context);
        const viewModel: KOViewModel = Object.create(null);
        const ctx: KOContext = Object.create(null);

        for (const prop of dataProps) {
            viewModel[prop] = unwrapKOValue((data as any)[prop]);
        }

        for (const prop of contextProps) {
            ctx[prop] = unwrapKOValue((context as any)[prop]);
        }

        return { viewModel, context: ctx };
    }
    return { viewModel: {}, context: {} };
}
