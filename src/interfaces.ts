export interface KOViewModel {
    [key: string]: unknown;
}

export interface KOContext {
    [key: string]: unknown;
}

export interface KOData {
    viewModel: KOViewModel;
    context: KOContext;
}
