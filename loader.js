// Crossword data, set by later .js file
var grid = null;
var special = null;
var vertClues = null;
var horClues = null;

var showLetters = false;

var errElm = document.getElementById("errors");
var qs = location.search.match(/^\??(.*)/)[1], q = qs.split('&');
if (!qs.length) {
	// "Please add ?1, ?2, ... to the URL to load a specific crossword."
	errElm.textContent = "Lägg till ?1, ?2, ... till URLen för att ladda ett specifikt korsord.";
} else {
	var num = q[0];
	document.title += ' #' + num;
	var scr = document.createElement("script");
	if (q.includes("show=1")) showLetters = true;
	scr.src = 'data/' + num + '.js';
	scr.onload = function() {
		var scr = document.createElement("script");
		scr.src = 'crossword.js';
		document.body.appendChild(scr);
	};
	scr.onerror = function() {
		// "No such crossword."
		errElm.textContent = "Korsordet finns inte.";
	};
	document.body.appendChild(scr);
}
