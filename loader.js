var showLetters = false;

var q = location.search.match(/^\??(.*)/)[1].split('&');
if (!q.length) {
	document.getElementById("errors").textContent = "Please add ?1, ?2, ... to the URL to load a specific crossword.";
} else {
	var scr = document.createElement("script");
	if (q.includes("show=1")) showLetters = true;
	scr.src = 'data/' + q[0] + '.js';
	scr.onload = function() {
		var scr = document.createElement("script");
		scr.src = 'crossword.js';
		document.body.appendChild(scr);
	};
	document.body.appendChild(scr);
}
