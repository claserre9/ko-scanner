const getKODataAndContext = function () {
	if (window.ko) {
		let data = window.ko && $0 ? ko.dataFor($0) : {};
		let context = window.ko && $0 ? ko.contextFor($0) : {};

		if (data === null || data === undefined) {
			data = {};
		}

		if (context === null || context === undefined) {
			context = {};
		}

		let dataProps = Object.getOwnPropertyNames(data);
		let contextProps = Object.getOwnPropertyNames(context);
		let _data = {__proto__: null};
		let _context = {__proto__: null};

		for (let i = 0; i < dataProps.length; ++i) {
			_data[dataProps[i]] = data[dataProps[i]];
		}

		for (let i = 0; i < contextProps.length; ++i) {
			_context[contextProps[i]] = context[contextProps[i]];
		}

		return {viewModel: _data, context: _context};
	}

};

chrome.devtools.panels.elements.createSidebarPane(
	'KnockoutJS Context',
	function (sidebar) {
		// Function to update the element properties in the sidebar
		function updateElementProperties() {
			// Wrap in try-catch block to handle any errors
			try {
				// Run the function to get KnockoutJS data properties and context
				sidebar.setExpression('(' + getKODataAndContext.toString() + ')()');
			} catch (error) {
				console.error('Error updating element properties: ', error);
			}
		}

		// Update element properties initially
		updateElementProperties();

		// Update element properties when selection is changed
		chrome.devtools.panels.elements.onSelectionChanged.addListener(
			updateElementProperties
		);
	}
);