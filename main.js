window.onload = initializeUI;

function initializeUI() {
	tools = document.getElementById("tools")
	hideElement(tools)
	cybox = document.getElementById("cy")
	hideElement(cybox)
	legend = document.getElementById("legend")
	hideElement(legend)
	err = document.getElementById("error")
	err.style.opacity = "0";
}

function updateCount(count) {
	g = document.getElementById("count")
	g.innerText = count
}

function hideElement(element) {
	element.style.display = "none";
}

function showElement(element) {
	element.style.display = "inherit";
}

function addClickEvent(element, handler) {
	element.addEventListener("click", handler);
}


function initialize() {
	const searchField = document.getElementById("search");
	main(searchField.value);
}

const cy = cytoscape({
	wheelSensitivity: 0.2,
	container: document.getElementById("cy"),
	style: [
		{
			selector: "node",
			style: {
				label: "data(id)"
			}
		},
		{
			selector: ".pkg",
			style: {
				"background-color": "navy"
			}
		},
		{
			selector: ".dep",
			style: {
				"background-color": "red"
			}
		},
		{
			selector: ".parent",
			style: {
				"background-color": "green"
			}
		},
		{
			selector: ".depedge",
			style: {
				"curve-style": "bezier",
				"target-arrow-shape": "triangle"
			}
		},
		{
			selector: ".makedepedge",
			style: {
				"curve-style": "bezier",
				"target-arrow-shape": "triangle",
				"line-style": "dashed"
			}
		},
		{
			selector: ".checkdepedge",
			style: {
				"curve-style": "bezier",
				"target-arrow-shape": "triangle",
				"line-style": "dotted"
			}
		}
	]
});

function main(initialPkg) {
	const modal = document.getElementById("modal");
	hideElement(modal);

	const modalHolder = document.getElementById("modalholder");
	hideElement(modalHolder);

	const cybox = document.getElementById("cy");
	showElement(cybox);

	const legend = document.getElementById("legend");
	showElement(legend);

	const tools = document.getElementById("tools");
	showElement(tools);

	const expandTierBtn = document.getElementById("expandTier");
	addClickEvent(expandTierBtn, expandTier);
	expandTierBtn.addEventListener("click", expandTier);
	addPkg(initialPkg);

	async function addPkg(name) {
		const makedepsChecked = document.getElementById("makedeps").checked;
		const checkdepsChecked = document.getElementById("checkdeps").checked;

		if (cy.getElementById(name).length === 0) {
			const node = cy.add([
				{ group: "nodes", data: { id: name, classes: "pkg" } }
			]);
			node.addClass("parent");
		} else {
			const node = cy.getElementById(name);

			if (node.hasClass("pkg")) {
				return;
			}

			node.removeClass("dep");
			node.addClass("pkg");
		}

		const deps = await getDeps(name);

		if (typeof deps === "undefined") {
			return;
		}

		if (deps.hasOwnProperty("deps")) {
			deps.deps.forEach(element => {
				const node = cy.add([{ group: "nodes", data: { id: element } }]);
				node.addClass("dep");
				const edge = cy.add([
					{
						group: "edges",
						data: { id: `${name}_${element}`, source: name, target: element }
					}
				]);
				edge.addClass("depedge");

				cy.getElementById(element).on("click", function (e) {
					addPkg(element);
				});
			});
		}

		if (deps.hasOwnProperty("makedeps") && makedepsChecked) {
			deps.makedeps.forEach(element => {
				const node = cy.add([{ group: "nodes", data: { id: element } }]);
				node.addClass("dep");
				const edge = cy.add([
					{
						group: "edges",
						data: { id: `${name}_${element}`, source: name, target: element }
					}
				]);
				edge.addClass("makedepedge");

				cy.getElementById(element).on("click", function (e) {
					addPkg(element);
				});
			});
		}

		if (deps.hasOwnProperty("checkdeps") && checkdepsChecked) {
			deps.checkdeps.forEach(element => {
				const node = cy.add([{ group: "nodes", data: { id: element } }]);
				node.addClass("dep");
				const edge = cy.add([
					{
						group: "edges",
						data: { id: `${name}_${element}`, source: name, target: element }
					}
				]);
				edge.addClass("checkdepedge");

				cy.getElementById(element).on("click", function (e) {
					addPkg(element);
				});
			});
		}

		const layout = cy.layout({ name: "circle" });
		layout.run();
		updateCount(cy.nodes().length);
	}

	function expandTier() {
		cy.nodes().forEach(node => {
			addPkg(node._private.data.id);
		});
	}

	const resetZoomBtn = document.getElementById("resetZoom");
	resetZoomBtn.addEventListener("click", () => {
		cy.fit();
	});

	async function getDeps(name) {
		try {
			const data = await makeFetch(
				`https://corsproxy.io/?https://archlinux.org/packages/search/json/?name=${name}`
			);
			const jsonData = JSON.parse(data).results[0];

			if (typeof jsonData === "undefined") {
				return;
			}

			if (!jsonData.hasOwnProperty("depends")) {
				jsonData.depends = "";
			}

			if (!jsonData.hasOwnProperty("makedepends")) {
				jsonData.makedepends = "";
			}

			if (!jsonData.hasOwnProperty("checkdepends")) {
				jsonData.checkdepends = "";
			}

			jsonData.depends = jsonData.depends.map(dep => dep.split(">")[0].split("=")[0].split("<")[0]);
			jsonData.makedepends = jsonData.makedepends.map(makedep => makedep.split(">")[0].split("=")[0].split("<")[0]);
			jsonData.checkdepends = jsonData.checkdepends.map(checkdep => checkdep.split(">")[0].split("=")[0].split("<")[0]);
			return {
				deps: jsonData.depends,
				makedeps: jsonData.makedepends,
				checkdeps: jsonData.checkdepends
			};
		} catch (error) {
			console.error("Error fetching data:", error);
			// errorToggle(error);
			return {};
		}
	}

	function errorToggle(error) {
		const errorElem = document.getElementById("error");
		errorElem.style.opacity = 100;
		errorElem.style.visibility = "unset";
		errorElem.innerText = error;

		setTimeout(() => {
			errorElem.style.opacity = 0;
		}, 2000);
	}

	async function makeFetch(url) {
		try {
			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`Request failed with status: ${response.status}`);
			}

			const data = await response.text();
			return data;
		} catch (error) {
			errorToggle(error);
			return {};
		}
	}
}
