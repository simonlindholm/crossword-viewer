"use strict";

// (The grid can have spaces; don't trim them)
grid = grid && grid.split('\n').filter(x => x);
special = special.trim().split('\n');
vertClues = vertClues.trim().split('\n');
horClues = horClues.trim().split('\n');

var height = special.length, width = special[0].length;

var cellClues = [];
var tableCells = [];
var enteredGrid = [];
var confirmedGrid = [];
var openSquares = [];

var currentCell = null;

var needSelBtns = [];
var checkLetterBtn = null;
var checkWordBtn = null;
var checkAllBtn = null;
var explainBtn = null;
var idb = null;

var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ23456789-_/\"'?!@$%^&*()=+`[]{}.,:;<>\\";

var clues = {
	vert: null,
	hor: null,
};

var useDummyInput = ('ontouchstart' in document.documentElement);

var VERT = 1, VERT_REV = 2;
var HOR = 4, HOR_REV = 8;

var TURNS = {
	turnRightDown: [HOR, VERT],
	turnRightUp: [HOR, VERT_REV],
	turnLeftDown: [HOR_REV, VERT],
	turnLeftUp: [HOR_REV, VERT_REV],
	turnDownRight: [VERT, HOR],
	turnDownLeft: [VERT, HOR_REV],
	turnUpRight: [VERT_REV, HOR],
	turnUpLeft: [VERT_REV, HOR_REV],
};

class Clue {
	constructor(line, dir) {
		console.assert(line, "empty clue line");
		var parts = line.split(" - ");
		this.direction = dir;
		this.secret = grid ? normalizeWord(parts.shift()) : "";
		this.spoiler = haveSpoilers && parts.length > 1 ? parts.pop() : "";
		this.clue = parts.join(" - ");
		this.index = -1;
		this.cells = [];
		this.elem = null;
	}

	findCellIndex(y, x) {
		for (let i = 0; i < this.cells.length; i++) {
			if (this.cells[i].y === y && this.cells[i].x === x)
				return i;
		}
		return -1;
	}

	hasCell(y, x) {
		return this.findCellIndex(y, x) !== -1;
	}

	directionAt(y, x) {
		if (this.cells.length == 1)
			return this.direction == 'vert' ? 0 : 1;
		let ind = this.findCellIndex(y, x);
		let otherInd = ind + 1;
		if (otherInd === this.cells.length)
			otherInd -= 2;
		return (this.cells[ind].y === this.cells[otherInd].y);
	}
}

function oob(y, x) {
	return y < 0 || x < 0 || y >= height || x >= width;
}
function openSquare(y, x) {
	return !oob(y, x) && special[y][x] != '#';
}

function descSq(i, j) {
	return "Row " + (i+1) + " col " + (j+1);
}

function normalizeLetter(ch) {
	ch = ch.toUpperCase();
	if (ch == '|') return 'I';
	if (ch == '1') return 'I';
	if (ch == '0') return 'O';
	if (ch == 'é') return 'e';
	if (ch == 'è') return 'e';
	if (ch == 'á') return 'a';
	if (ch == 'à') return 'a';
	if (ch == 'ü') return 'u';
	if (ch == 'û') return 'u';
	return ch;
}

function normalizeWord(word) {
	return word.split('').map(normalizeLetter).join('');
}

function toggleClueForCell(y, x) {
	let cands = cellClues[y][x];
	let ind = cands.indexOf(currentCell.clue);
	console.assert(ind !== -1);
	return cands[(ind + 1) % cands.length];
}

function getClueForCellDirection(y, x, dir) {
	let cands = cellClues[y][x].filter(c => c.directionAt(y, x) === dir);
	if (!cands.length)
		cands = cellClues[y][x];
	console.assert(cands.length > 0);
	// If still multiple candidates, take the shortest one
	let ret = cands[0];
	for (let i = 1; i < cands.length; i++) {
		if (cands[i].cells.length < ret.cells.length)
			ret = cands[i];
	}
	return ret;
}

function getClueForCell(y, x) {
	if (!currentCell || cellClues[y][x].length === 1) return cellClues[y][x][0];
	if (currentCell.y === y && currentCell.x === x) {
		// Click on same square: change direction
		return toggleClueForCell(y, x);
	}
	let curClue = currentCell.clue;
	if (curClue.hasCell(y, x)) {
		// Click on same clue: preserve direction
		return curClue;
	}
	// Try to preserve direction
	let dir = curClue.directionAt(currentCell.y, currentCell.x);
	return getClueForCellDirection(y, x, dir);
}

function unselect() {
	if (!currentCell) return;
	for (let cell of currentCell.clue.cells) {
		let td = tableCells[cell.y][cell.x];
		td.classList.remove("highlighted");
		td.classList.remove("selected");
	}
	currentCell.clue.elem.classList.remove("selected");
	currentCell = null;
	document.body.classList.remove("has-selection");
	updateButtonState();
}

function selectCell(y, x, clue) {
	unselect();
	currentCell = {y, x, clue};
	tableCells[y][x].classList.add("selected");
	clue.elem.classList.add("selected");
	for (let cell of clue.cells) {
		let td = tableCells[cell.y][cell.x];
		td.classList.add("highlighted");
	}
	document.body.classList.add("has-selection");
	updateButtonState();
	if (useDummyInput) {
		let dummyInput = document.getElementById("dummyinput");
		if (document.activeElement !== dummyInput) {
			setTimeout(() => {
				dummyInput.focus();
			});
		}
	}
}

function cursorMove(dy, dx) {
	let ny = currentCell.y + dy;
	let nx = currentCell.x + dx;
	if (!currentCell || !openSquare(ny, nx))
		return;
	if (currentCell.clue.hasCell(ny, nx)) {
		selectCell(ny, nx, currentCell.clue);
	} else {
		let clue = getClueForCellDirection(ny, nx, (dy === 0));
		selectCell(ny, nx, clue);
	}
}

function getCellValue(y, x) {
	return enteredGrid[y][x];
}

function setCellValue(y, x, val) {
	val = normalizeLetter(val);
	let td = tableCells[y][x];
	let span = td.querySelector(".letter");
	span.textContent = val;
	enteredGrid[y][x] = val;
}

function markConfirmed(y, x) {
	confirmedGrid[y][x] = true;
}

function clearOrMoveBack() {
	if (!currentCell)
		return;
	let curVal = getCellValue(currentCell.y, currentCell.x);
	if (curVal) {
		setCellValue(currentCell.y, currentCell.x, '');
		saveGrid();
	} else {
		let ind = currentCell.clue.findCellIndex(currentCell.y, currentCell.x);
		if (ind !== 0) {
			let cell = currentCell.clue.cells[ind - 1];
			selectCell(cell.y, cell.x, currentCell.clue);
		}
	}
}

function setValueAndAdvance(val) {
	setCellValue(currentCell.y, currentCell.x, val);
	saveGrid();
	let ind = currentCell.clue.findCellIndex(currentCell.y, currentCell.x);
	if (ind !== currentCell.clue.cells.length - 1) {
		let cell = currentCell.clue.cells[ind + 1];
		selectCell(cell.y, cell.x, currentCell.clue);
	}
}

function clearGrid() {
	unselect();
	for (let pos of openSquares) {
		setCellValue(pos.y, pos.x, '');
		confirmedGrid[pos.y][pos.x] = false;
	}
	saveGrid();
}

function allFilledIn(cells) {
	for (let pos of cells) {
		if (!getCellValue(pos.y, pos.x))
			return false;
	}
	return true;
}

function allConfirmed(cells) {
	for (let pos of cells) {
		if (!confirmedGrid[pos.y][pos.x])
			return false;
	}
	return true;
}

function updateButtonState() {
	if (!checkAllBtn) return;
	checkLetterBtn.disabled = !currentCell || !allFilledIn([currentCell]);
	checkWordBtn.disabled = !currentCell || !allFilledIn(currentCell.clue.cells);
	checkAllBtn.disabled = !allFilledIn(openSquares);
	if (explainBtn) {
		explainBtn.disabled = !currentCell || !allFilledIn(currentCell.clue.cells) ||
			(allConfirmed(currentCell.clue.cells) && !currentCell.clue.spoiler);
	}
	for (let btn of needSelBtns)
		btn.disabled = !currentCell;
}

function toggleCheats() {
	document.body.classList.toggle("cheats-visible");
}

function revealLetter() {
	if (!currentCell) return;
	let {y, x} = currentCell;
	setCellValue(y, x, grid[y][x]);
	markConfirmed(y, x);
	saveGrid();
}

function revealWord() {
	if (!currentCell) return;
	let clue = currentCell.clue;
	for (let i = 0; i < clue.cells.length; i++) {
		let {y, x} = clue.cells[i];
		setCellValue(y, x, grid[y][x]);
		markConfirmed(y, x);
	}
	saveGrid();
}

function revealAll() {
	if (!confirm($.areYouSureReveal)) return;
	for (let pos of openSquares) {
		let {y, x} = pos;
		setCellValue(y, x, grid[y][x]);
		markConfirmed(y, x);
	}
	saveGrid();
}

function confirmIfAllMatch(list) {
	for (let pos of list) {
		if (getCellValue(pos.y, pos.x) !== grid[pos.y][pos.x])
			return false;
	}
	for (let pos of list)
		markConfirmed(pos.y, pos.x);
	saveGrid();
	return true;
}

function checkLetter() {
	if (!currentCell) return;
	if (confirmIfAllMatch([currentCell])) {
		alert($.correctAll);
	}
	else {
		alert($.incorrectAll);
	}
}

function checkWord() {
	if (!currentCell) return;
	if (confirmIfAllMatch(currentCell.clue.cells)) {
		alert($.correctAll);
	}
	else {
		alert($.incorrectAll);
	}
}

function checkAll() {
	if (confirmIfAllMatch(openSquares)) {
		alert($.correctAll);
	}
	else {
		alert($.incorrectAll);
	}
}

function explainWord() {
	if (!currentCell) return;
	if (!confirmIfAllMatch(currentCell.clue.cells)) {
		alert($.incorrectGuess);
	}
	else if (!currentCell.clue.spoiler) {
		alert($.missingSpoiler);
	} else {
		alert(currentCell.clue.spoiler);
	}
}

function nextClue(dir) {
	let clue = currentCell.clue;
	let allClues = [].concat(clues.vert, clues.hor);
	let ind = allClues.indexOf(clue);
	console.assert(ind !== -1);
	clue = allClues[(ind + dir + allClues.length) % allClues.length];
	selectCell(clue.cells[0].y, clue.cells[0].x, clue);
}

function maybeStealFocus() {
	if (!currentCell && document.activeElement === document.getElementById("grid")) {
		let clue = clues.vert[0] || clues.hor[0];
		if (clue) {
			selectCell(clue.cells[0].y, clue.cells[0].x, clue);
			return true;
		}
	}
	return false;
}

function handleKeyDown(event) {
	if (event.altKey || event.ctrlKey || event.metaKey || !event.key) return;
	let key = event.key;
	if (key.length === 1 && currentCell && alphabet.indexOf(normalizeLetter(key)) !== -1) {
		setValueAndAdvance(key);
		event.preventDefault();
		event.stopPropagation();
		return;
	}

	switch (key) {
	case "Escape":
	case "Esc":
		unselect();
		break;

	case "Down":
	case "ArrowDown":
		if (maybeStealFocus())
			break;
		cursorMove(1, 0);
		break;

	case "Up":
	case "ArrowUp":
		if (maybeStealFocus())
			break;
		cursorMove(-1, 0);
		break;

	case "Left":
	case "ArrowLeft":
		if (maybeStealFocus())
			break;
		cursorMove(0, -1);
		break;

	case "Right":
	case "ArrowRight":
		if (maybeStealFocus())
			break;
		cursorMove(0, 1);
		break;

	case " ":
	case "Enter":
		if (maybeStealFocus())
			break;
		if (!currentCell)
			return;
		let clue = toggleClueForCell(currentCell.y, currentCell.x);
		selectCell(currentCell.y, currentCell.x, clue);
		break;

	case "Backspace":
		// Don't lose data even on errors
		event.preventDefault();
		clearOrMoveBack();
		break;

	case "Tab":
		if (!currentCell) return;
		nextClue(event.shiftKey ? -1 : 1);
		break;

	default:
		return;
	}

	event.preventDefault();
	event.stopPropagation();
}

function handleInput(event) {
	let value = event.target.value;
	if (!value || !currentCell) return;
	for (let i = 0; i < value.length; i++) {
		if (alphabet.indexOf(value[i].toUpperCase()) !== -1) {
			setValueAndAdvance(value[i]);
		}
	}
	event.preventDefault();
	event.stopPropagation();
	event.target.value = '';
}

function restoreSavedState() {
	try {
		let req = indexedDB.open("crossword", 2);
		req.onupgradeneeded = function(event) {
			let db = event.target.result;
			db.createObjectStore("savedletters", { keyPath: "id" });
		};
		req.onsuccess = function(event) {
			let db = event.target.result;
			idb = db;
			let req = db.transaction(["savedletters"], "readonly")
				.objectStore("savedletters")
				.get(crosswordId);
			req.onsuccess = function(event) {
				let result = event.target.result;
				if (!result) {
					console.log("no saved grid");
					return;
				}
				let grid = result.grid;
				let conf = result.confirmed;
				if (!grid || grid.length !== height || grid[0].length !== width ||
					!conf || conf.length !== height || conf[0].length !== width) {
					console.log("invalid saved grid, ignoring");
					return;
				}
				for (let pos of openSquares) {
					let {y, x} = pos;
					setCellValue(y, x, grid[y][x]);
					confirmedGrid[y][x] = conf[y][x];
				}
				saveGrid(false);
			};
		};
	} catch(e) {
		console.log("unable to use indexedDB", e);
	}
}

function saveGrid(needIdbSave = true) {
	updateButtonState();
	if (!idb || !needIdbSave) return;
	idb.transaction(["savedletters"], "readwrite")
		.objectStore("savedletters")
		.put({"id": crosswordId, grid: enteredGrid, confirmed: confirmedGrid});
}

function initGrid() {
	if (grid !== null) {
		grid = grid.map(normalizeWord);
	}

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (openSquare(y, x))
				openSquares.push({y, x});
		}
	}

	clues.vert = vertClues.map(line => new Clue(line, 'vert'));
	clues.hor = horClues.map(line => new Clue(line, 'hor'));
}

function init() {
	initGrid();

	var errorCont = document.getElementById("errors");
	var tbody = document.getElementById("grid").querySelector("tbody");
	var clueCont = document.getElementById("clues");
	var btnCont = document.getElementById("buttons");

	function addError(msg, fatal) {
		var div = document.createElement("div");
		div.textContent = msg;
		errorCont.appendChild(div);
		if (fatal)
			throw "stop";
	}

	function clueStartDirs(i, j) {
		if (special[i][j] == '#') return 0;
		let sp = legend[special[i][j]] || [];
		var res = 0;
		if (!sp.some(x => x.startsWith("turn"))) {
			if (i+1 < height && special[i+1][j] != '#' &&
				(i == 0 || special[i-1][j] == '#')) res |= VERT;
			if (j+1 < width && special[i][j+1] != '#' &&
				(j == 0 || special[i][j-1] == '#')) res |= HOR;
		}
		if (sp.includes("noClueRight")) res &= ~HOR;
		if (sp.includes("noClueDown")) res &= ~VERT;
		if (sp.includes("clueRight")) res |= HOR;
		if (sp.includes("clueDown")) res |= VERT;
		if (sp.includes("clueUp")) res |= VERT_REV;
		if (sp.includes("clueLeft")) res |= HOR_REV;
		return res;
	}

	var clueCtrs = {
		vert: 0,
		hor: 0,
	};

	function addClue(cat, index, cells) {
		var ct = clueCtrs[cat];
		if (grid) {
			var word = "";
			for (let cell of cells) {
				word += grid[cell.y][cell.x];
			}
			word = normalizeWord(word);
			if (ct == clues[cat].length || !clues[cat].some(c => c.secret === word)) {
				addError("Missing clue for " + cat + " word " + word, false);
				return;
			}
			else if (clues[cat][ct].secret !== word) {
				addError("Wrongly ordered clue " + word + ", expected it to come before " + clues[cat][ct].secret, true);
			}
		}

		for (let cell of cells) {
			cellClues[cell.y][cell.x].push(clues[cat][ct]);
		}

		clues[cat][ct].index = index;
		clues[cat][ct].cells = cells;
		clueCtrs[cat]++;
	}

	function followClue(i, j, dir) {
		var ret = [];
		var first = true;
		while (openSquare(i, j)) {
			var sp = legend[special[i][j]] || [];
			if (!first && dir == HOR && sp.includes("barLeft")) break;
			if (!first && dir == VERT && sp.includes("barUp")) break;
			ret.push({y: i, x: j});
			for (var turn in TURNS) {
				if (sp.includes(turn) && dir == TURNS[turn][0]) {
					dir = TURNS[turn][1];
					break;
				}
			}
			if (dir == HOR_REV && sp.includes("barLeft")) break;
			if (dir == VERT_REV && sp.includes("barUp")) break;
			if (dir == HOR) j++;
			else if (dir == HOR_REV) j--;
			else if (dir == VERT) i++;
			else if (dir == VERT_REV) i--;
			else throw new Error("invalid direction " + dir);
			first = false;
		}
		return ret;
	}

	if (grid) console.assert(grid.length == height);
	for (var i = 0; i < height; i++) {
		if (grid) console.assert(grid[i].length == width);
		console.assert(special[i].length == width);
		cellClues.push([]);
		enteredGrid.push([]);
		confirmedGrid.push([]);
		for (var j = 0; j < width; j++) {
			cellClues[i].push([]);
			enteredGrid[i].push('');
			confirmedGrid[i].push(false);
		}
	}

	var clueNum = 0;
	for (var i = 0; i < height; i++) {
		var tr = document.createElement("tr");
		tableCells.push([]);
		for (var j = 0; j < width; j++) {
			var td = document.createElement("td");
			tableCells[i].push(td);
			if (special[i][j] == '#') {
				td.classList.add("blocked");
			}
			else {
				for (let s of legend[special[i][j]] || [])
					td.classList.add("special-" + s);
			}
			if (grid) {
				if (special[i][j] == '#' && grid[i][j] != ' ') {
					addError(descSq(i, j) + " is marked as blocked, but contains a letter " + grid[i][j], false);
				}
				if (special[i][j] != '#' && grid[i][j] == ' ') {
					addError(descSq(i, j) + " is not marked as blocked, but does not contain any letter", false);
				}
			}
			var dirs = clueStartDirs(i, j);
			if (dirs != 0) {
				clueNum++;
				if (dirs & VERT) addClue('vert', clueNum, followClue(i, j, VERT));
				if (dirs & VERT_REV) addClue('vert', clueNum, followClue(i, j, VERT_REV));
				if (dirs & HOR) addClue('hor', clueNum, followClue(i, j, HOR));
				if (dirs & HOR_REV) addClue('hor', clueNum, followClue(i, j, HOR_REV));
				td.classList.add('has-clue');
				td.dataset.cluenum = clueNum;
			}
			var letterCont = document.createElement("div");
			letterCont.classList.add("letter-container");
			if (special[i][j] != '#') {
				var letter = document.createElement("span");
				letter.classList.add("letter");
				if (grid && showLetters) {
					letter.textContent = grid[i][j];
					enteredGrid[i][j] = grid[i][j];
					confirmedGrid[i][j] = true;
				}
				letterCont.appendChild(letter);
			}
			td.appendChild(letterCont);
			tr.appendChild(td);
		}
		tbody.appendChild(tr);
	}

	function genClues(cat, headerText) {
		let cont = document.createElement("div");
		cont.classList.add("clues-dir");
		let header = document.createElement("h2");
		header.textContent = headerText;
		cont.appendChild(header);
		for (let clue of clues[cat]) {
			let row = document.createElement("div");
			row.classList.add('clue');
			let index = document.createElement("span");
			index.classList.add("index");
			index.textContent = clue.index + ". ";
			row.appendChild(index);
			let cl = document.createElement("span");
			cl.classList.add('clue-text');
			cl.textContent = clue.clue + " (" + clue.cells.length + ")";
			row.appendChild(cl);
			cont.appendChild(row);
			clue.elem = row;
		}
		clueCont.appendChild(cont);
	}
	genClues('hor', $.hor);
	genClues('vert', $.vert);

	for (let cat of ['hor', 'vert']) {
		if (clueCtrs[cat] < clues[cat].length) {
			addError("Unused clue for word " + clues[cat][clueCtrs[cat]].secret, true);
		}
	}

	for (let i = 0; i < height; i++) {
		for (let j = 0; j < width; j++) {
			if (special[i][j] == '#') continue;
			tableCells[i][j].onmousedown = function(event) {
				var clue = getClueForCell(i, j);
				selectCell(i, j, clue);
				event.preventDefault();
			};
		}
	}

	for (let cat of ['hor', 'vert']) {
		for (let clue of clues[cat]) {
			clue.elem.onclick = function(event) {
				selectCell(clue.cells[0].y, clue.cells[0].x, clue);
				event.preventDefault();
			};
		}
	}

	function addButton(par, text, fn) {
		let elem = document.createElement('input');
		elem.type = 'button';
		elem.value = text;
		elem.onclick = function(event) {
			fn();
			event.preventDefault();
		};
		par.appendChild(elem);
		return elem;
	}
	addButton(btnCont, $.clear, clearGrid);
	if (grid) {
		let btn = addButton(btnCont, $.cheats, toggleCheats);
		btn.classList.add('toggle-cheats-btn');
		let table = document.createElement('table');
		table.classList.add('cheat-table');

		let revealRow = table.insertRow();
		revealRow.insertCell().textContent = $.reveal;
		needSelBtns.push(addButton(revealRow.insertCell(), $.letter, revealLetter));
		needSelBtns.push(addButton(revealRow.insertCell(), $.word, revealWord));
		addButton(revealRow.insertCell(), $.all, revealAll);

		let checkRow = table.insertRow();
		checkRow.insertCell().textContent = $.check;
		checkLetterBtn = addButton(checkRow.insertCell(), $.letter, checkLetter);
		checkWordBtn = addButton(checkRow.insertCell(), $.word, checkWord);
		checkAllBtn = addButton(checkRow.insertCell(), $.all, checkAll);

		btnCont.appendChild(table);
		if (haveSpoilers) {
			explainBtn = addButton(btnCont, $.explainWord, explainWord);
			explainBtn.classList.add('explain-btn');
		}
		updateButtonState();
	}

	let dummyInput = document.getElementById("dummyinput");
	if (useDummyInput) {
		dummyInput.value = '';
		dummyInput.addEventListener("input", handleInput);
	}
	else {
		dummyInput.remove();
	}
	document.addEventListener("keydown", handleKeyDown);

	restoreSavedState();
}

try {
	init();
} catch(e) {
	if (e !== "stop") throw e;
}
