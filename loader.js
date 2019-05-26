"use strict";

// Crossword data, set by later .js file
var grid = null;
var special = null;
var vertClues = null;
var horClues = null;

var showLetters = false;
var crosswordId = '';

var $ = swedish;

var errElm = document.getElementById("errors");
var qs = location.search.match(/^\??(.*)/)[1], qparts = qs.split('&'), q = {};
for (var part of qparts) {
	var ind = part.indexOf("=");
	if (ind !== -1)
		q[part.substr(0, ind)] = part.substr(ind + 1);
}
document.title = $.title;
if (!qs.length) {
	errElm.textContent = $.noIdSpecified;
} else {
	crosswordId = qparts[0];
	document.title += ' #' + crosswordId;
	var scr = document.createElement("script");
	if (q['show'] === '1') showLetters = true;
	var keyStr = q['key'] ? '-' + q['key'] : '';
	if (!crosswordId.includes('/') && !keyStr.includes('/'))
		scr.src = 'data/' + crosswordId + keyStr + '.js';
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
