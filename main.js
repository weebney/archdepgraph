function initializer() {
	e = document.getElementById("search")
	main(e.value)
}

function main(initialPkg) {
	e = document.getElementById("modal");
	e.style.display = "none";
	e = document.getElementById("modalholder");
	e.style.display = "none";

	f = document.getElementById("cy")
	f.style.display = "inherit";
	f = document.getElementById("legend")
	f.style.display = "unset";

	e = document.getElementById("tools")
	e.style.display = "unset";

	var cy = cytoscape({
		wheelSensitivity: 0.2,
		container: document.getElementById("cy"),
		style: [
			{
				selector: 'node',
				style: {
					'label': 'data(id)'
				}
			},


			{
				selector: '.pkg',
				style: {
					'background-color': 'navy',
				}
			},

			{
				selector: '.dep',
				style: {
					'background-color': 'red',
				}
			},

			{
				selector: '.parent',
				style: {
					'background-color': 'green',
				}
			},

			{
				selector: '.depedge',
				style: {
					'curve-style': "bezier",
					'target-arrow-shape': 'triangle'
				}
			},
			{
				selector: '.makedepedge',
				style: {
					'curve-style': "bezier",
					'target-arrow-shape': 'triangle',
					'line-style': 'dashed',
				}
			},
			{
				selector: '.checkdepedge',
				style: {
					'curve-style': "bezier",
					'target-arrow-shape': 'triangle',
					'line-style': 'dotted',
				}
			},
		]
	});

	addPkg(initialPkg)

	async function addPkg(name) {
		showMakedeps = document.getElementById("makedeps").checked
		showCheckdeps = document.getElementById("checkdeps").checked

		let e

		if (cy.getElementById(name).length === 0) {
			e = cy.add([{ group: 'nodes', data: { id: name, classes: "pkg" }, }])
			e.addClass('parent')
		} else {
			e = cy.getElementById(name)

			if (e.hasClass("pkg")) {
				return
			}

			e.removeClass('dep')
			e.addClass('pkg')
		}

		const deps = await getDeps(name);

		if (typeof deps === "undefined") {
			return
		}

		if (deps.hasOwnProperty('deps')) {
			deps.deps.forEach((element) => {
				e = cy.add([{ group: 'nodes', data: { id: element }, }])
				e.addClass('dep')
				e = cy.add([{ group: 'edges', data: { id: name + "_" + element, source: name, target: element } }])
				e.addClass('depedge')

				cy.getElementById(element).on('click', function (e) {
					addPkg(element)
				})
			});
		}
		if (deps.hasOwnProperty('makedeps') && showMakedeps) {
			deps.makedeps.forEach((element) => {
				e = cy.add([{ group: 'nodes', data: { id: element }, }])
				e.addClass('dep')
				e = cy.add([{ group: 'edges', data: { id: name + "_" + element, source: name, target: element } }])
				e.addClass('makedepedge')

				cy.getElementById(element).on('click', function (e) {
					addPkg(element)
				});
			});
		}
		if (deps.hasOwnProperty('checkdeps') && showCheckdeps) {
			deps.checkdeps.forEach((element) => {
				e = cy.add([{ group: 'nodes', data: { id: element }, }])
				e.addClass('dep')
				e = cy.add([{ group: 'edges', data: { id: name + "_" + element, source: name, target: element } }])
				e.addClass('checkdepedge')

				cy.getElementById(element).on('click', function (e) {
					addPkg(element)
				});
			});
		}

		var layout = cy.layout({ name: 'circle' });
		layout.run();
		updateCount(cy.nodes().length)

	}

	et = document.getElementById("expandTier")
	et.addEventListener("click", expandTier);

	function expandTier() {
		cy.nodes().forEach((e) => {
			addPkg(e._private.data.id)
		}
		)
	}

	async function getDeps(name) {
		try {
			const data = await makeFetch(`https://corsproxy.io/?https://archlinux.org/packages/search/json/?name=${name}`);
			let jsonData = JSON.parse(data).results[0];
			if (typeof jsonData === "undefined") {
				return
			}
			if (!jsonData.hasOwnProperty('depends')) {
				jsonData.depends = "";
			}
			if (!jsonData.hasOwnProperty('makedepends')) {
				jsonData.makedepends = "";
			}
			if (!jsonData.hasOwnProperty('checkdepends')) {
				jsonData.checkdepends = "";
			}

			for (let i = 0; i < jsonData.depends.length; i++) {
				jsonData.depends[i] = jsonData.depends[i].split(">")[0]
				jsonData.depends[i] = jsonData.depends[i].split("=")[0]
				jsonData.depends[i] = jsonData.depends[i].split("<")[0]
			}
			for (let i = 0; i < jsonData.makedepends.length; i++) {
				jsonData.makedepends[i] = jsonData.makedepends[i].split(">")[0]
				jsonData.makedepends[i] = jsonData.makedepends[i].split("=")[0]
				jsonData.makedepends[i] = jsonData.makedepends[i].split("<")[0]
			}
			for (let i = 0; i < jsonData.checkdepends.length; i++) {
				jsonData.checkdepends[i] = jsonData.checkdepends[i].split(">")[0]
				jsonData.checkdepends[i] = jsonData.checkdepends[i].split("=")[0]
				jsonData.checkdepends[i] = jsonData.checkdepends[i].split("<")[0]
			}

			return {
				deps: jsonData.depends,
				makedeps: jsonData.makedepends,
				checkdeps: jsonData.checkdepends,
			};
		} catch (error) {
			console.error('Error fetching data:', error);
			errorToggle(error)
			return {};
		}
	}

	function errorToggle(error) {
		e = document.getElementById("error")
		e.style.opacity = 100;
		e.style.visibility = "unset";
		e.innerText = error
		setTimeout(() => {
			e.style.opacity = 0;
		}, 2000);
	}

	z = document.getElementById("resetZoom")
	z.addEventListener("click", () => {
		cy.fit()
	})


	async function makeFetch(url) {
		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`Request failed with status: ${response.status}`);
			}
			const data = await response.text();
			return data;
		} catch (error) {
			console.error(error);
		}
	}


}
