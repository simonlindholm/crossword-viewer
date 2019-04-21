// Crossword data, set by later .js file
var grid = null;
var special = null;
var vertClues = null;
var horClues = null;

var showLetters = false;

var $ = swedish;

var errElm = document.getElementById("errors");
var qs = location.search.match(/^\??(.*)/)[1], q = qs.split('&');
document.title = $.title;
if (!qs.length) {
	errElm.textContent = $.noIdSpecified;
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
		errElm.textContent = $.noSuchCrossword;
	};
	document.body.appendChild(scr);
}
