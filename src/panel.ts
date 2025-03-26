import { getKOObservables, KOTrackedProperty } from "./core";

function renderProperties(properties: KOTrackedProperty[]): void {
	const container = document.getElementById("observableList")!;
	container.innerHTML = ""; // Reset

	if (properties.length === 0) {
		container.innerHTML = "<p>Aucune observable trouvée.</p>";
		return;
	}

	for (const prop of properties) {
		const item = document.createElement("div");
		item.style.marginBottom = "10px";
		item.innerHTML = `
      <strong>${prop.name}</strong><br>
      Type: <code>${prop.type}</code><br>
      Valeur: <code>${JSON.stringify(prop.value)}</code>
    `;
		container.appendChild(item);
	}
}

function fetchAndRender(): void {
	console.log("🔁 Changement de sélection détecté");
	chrome.devtools.inspectedWindow.eval(
		`(${getKOObservables.toString()})()`,
		(result: KOTrackedProperty[] | undefined, exceptionInfo) => {
			if (!exceptionInfo && result) {
				renderProperties(result);
			} else {
				const container = document.getElementById("observableList")!;
				container.innerHTML =
					"<p>Erreur lors de l’inspection du viewModel.</p>";
			}
		}
	);
}

// document.addEventListener("DOMContentLoaded", () => {
	fetchAndRender();
	chrome.devtools.panels.elements.onSelectionChanged.addListener(
		fetchAndRender
	);
// });
