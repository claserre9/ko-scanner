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

function updateData(): void {
    chrome.devtools.inspectedWindow.eval('(' + getKODataAndContext.toString() + ')()', (result: any, error: any) => {
        if (error) {
            console.error('Error retrieving Knockout data:', error);
            return;
        }
        const vmEl = document.getElementById('view-model');
        const ctxEl = document.getElementById('context');
        if (vmEl) {
            vmEl.textContent = JSON.stringify(result.viewModel, null, 2);
        }
        if (ctxEl) {
            ctxEl.textContent = JSON.stringify(result.context, null, 2);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateData();
    const buttons = document.querySelectorAll<HTMLButtonElement>('.copy-btn');
    buttons.forEach((btn: HTMLButtonElement) => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const target = targetId ? document.getElementById(targetId) : null;
            if (target && navigator.clipboard) {
                navigator.clipboard.writeText(target.textContent || '')
                    .then(() => {
                        const original = btn.textContent;
                        btn.textContent = 'Copied!';
                        setTimeout(() => {
                            if (original) {
                                btn.textContent = original;
                            }
                        }, 1000);
                    })
                    .catch((err) => console.error('Failed to copy text:', err));
            }
        });
    });
});

chrome.devtools.panels.elements.onSelectionChanged.addListener(updateData);
