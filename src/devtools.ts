const getKODataAndContext = function () {
    if ((window as any).ko) {
        let data = (window as any).ko && ($0 as any) ? (ko as any).dataFor($0) : {};
        let context = (window as any).ko && ($0 as any) ? (ko as any).contextFor($0) : {};

        if (data === null || data === undefined) {
            data = {};
        }

        if (context === null || context === undefined) {
            context = {};
        }

        let dataProps = Object.getOwnPropertyNames(data);
        let contextProps = Object.getOwnPropertyNames(context);
        let _data: { [key: string]: any } = Object.create(null);
        let _context: { [key: string]: any } = Object.create(null);

        for (let i = 0; i < dataProps.length; ++i) {
            _data[dataProps[i]] = data[dataProps[i]];
        }

        for (let i = 0; i < contextProps.length; ++i) {
            _context[contextProps[i]] = context[contextProps[i]];
        }

        return { viewModel: _data, context: _context };
    }
    return { viewModel: {}, context: {} };
};

chrome.devtools.panels.elements.createSidebarPane(
    'KnockoutJS Context',
    function (sidebar) {
        function updateElementProperties() {
            try {
                sidebar.setExpression('(' + getKODataAndContext.toString() + ')()');
            } catch (error) {
                console.error('Error updating element properties: ', error);
            }
        }
        updateElementProperties();
        chrome.devtools.panels.elements.onSelectionChanged.addListener(
            updateElementProperties
        );
    }
);