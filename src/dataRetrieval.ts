import { KOData, KOContext, KOViewModel } from './interfaces';

/**
 * Retrieves data and context for a Knockout.js view model.
 * @returns Object containing the view model data and context.
 */
export function getKODataAndContext(): KOData {
    if ((window as any).ko) {
        let data = (window as any).ko && ($0 as any) ? (ko as any).dataFor($0) : {};
        let context = (window as any).ko && ($0 as any) ? (ko as any).contextFor($0) : {};

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
            viewModel[prop] = (data as any)[prop];
        }

        for (const prop of contextProps) {
            ctx[prop] = (context as any)[prop];
        }

        return { viewModel, context: ctx };
    }
    return { viewModel: {}, context: {} };
}
