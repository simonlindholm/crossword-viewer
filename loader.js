"use strict";

// Crossword data, set by later .js file
var haveSpoilers = false;
var grid = null;
var legend = null;
var special = null;
var vertClues = null;
var horClues = null;
var stripComments = true;
var indexhtml = "";

var showLetters = false;
var crosswordId = "";

var $ = swedish;

var errElm = document.getElementById("errors");
var qs = location.search.match(/^\??(.*)/)[1], qparts = qs.split("&"), q = {};
for (var part of qparts) {
	var ind = part.indexOf("=");
	if (ind !== -1)
		q[part.substr(0, ind)] = part.substr(ind + 1);
}
document.title = $.title;
if (!qs.length) {
	document.body.classList.add("indexpage");
	var cont = document.getElementById("indexpage");
	var scr = document.createElement("script");
	scr.src = "data/index.js?" + Math.random();
	scr.onload = function() {
		cont.innerHTML = indexhtml;
	};
	document.body.appendChild(scr);
} else {
	crosswordId = qparts[0];
	document.title += " #" + crosswordId;
	if (q["show"] === "1") showLetters = true;
	var cacheBreak = document.currentScript.src.split("?")[1];
	cacheBreak = cacheBreak ? "?" + cacheBreak : "";
	function loadCrossword(keyStr) {
		var scr = document.createElement("script");
		if (!crosswordId.includes("/"))
			scr.src = "data/" + crosswordId + keyStr + ".js?2";
		scr.onload = function() {
			var scr = document.createElement("script");
			scr.src = "crossword.js?" + cacheBreak;
			document.body.appendChild(scr);
			document.title = $.title + " #" + crosswordId;
		};
		scr.onerror = function() {
			if (keyStr)
				loadCrossword("");
			else
				errElm.textContent = $.noSuchCrossword;
		};
		document.body.appendChild(scr);
	}
	loadCrossword(q["key"] && !q["key"].includes("/") ? "-" + q["key"] : "");
}
