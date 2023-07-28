window.onload = main2;

function main2() {
	e = document.getElementById("tools")
	e.style.display = "none";
	e = document.getElementById("cy")
	e.style.display = "none";
	f = document.getElementById("legend")
	f.style.display = "none";
	f = document.getElementById("error")
	f.style.opacity = "0";
}

function updateCount(count) {
	g = document.getElementById("count")
	g.innerText = count
}