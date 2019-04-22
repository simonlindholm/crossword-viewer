
var haveGrid = true;
if (grid !== null) {
	grid = grid.split('\n').filter(x => x);
} else {
	haveGrid = false;
}
special = special.trim().split('\n');
vertClues = vertClues.trim().split('\n');
horClues = horClues.trim().split('\n');

var cellClues = [];
var tableCells = [];
var enteredGrid = [];
var idb = null;

var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ0123456789-_/\"'?!@$%^&*()=+`[]{}.,:;<>|\\";

var VERT = 1, HOR = 2, REVERSE = 4;

class Clue {
	constructor(line) {
		console.assert(line, "empty clue line");
		var parts = line.split(" - ");
		this.secret = parts[0];
		this.clue = parts.slice(1).join(" - ");
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
		let ind = this.findCellIndex(y, x);
		console.assert(this.cells.length >= 2);
		let otherInd = ind + 1;
		if (otherInd === this.cells.length)
			otherInd -= 2;
		return (this.cells[ind].y === this.cells[otherInd].y);
	}
}

var clues = {
	vert: vertClues.map(line => new Clue(line)),
	hor: horClues.map(line => new Clue(line)),
};

var height = special.length, width = special[0].length;

function oob(y, x) {
	return y < 0 || x < 0 || y >= height || x >= width;
}
function openSquare(y, x) {
	return !oob(y, x) && special[y][x] != '#';
}

function descSq(i, j) {
	return "Row " + (i+1) + " col " + (j+1);
}

var currentCell = null;

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
	document.body.classList.remove("have-selection");
	for (let cell of currentCell.clue.cells) {
		let td = tableCells[cell.y][cell.x];
		td.classList.remove("highlighted");
		td.classList.remove("selected");
	}
	currentCell.clue.elem.classList.remove("selected");
	currentCell = null;
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
	document.body.classList.add("have-selection");
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
	let td = tableCells[y][x];
	let span = td.querySelector(".letter");
	span.textContent = val;
	enteredGrid[y][x] = val;
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
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (openSquare(y, x))
				setCellValue(y, x, '');
		}
	}
	saveGrid();
}

function revealLetter() {
	if (!currentCell) return;
	let {y, x} = currentCell;
	setCellValue(y, x, grid[y][x]);
	saveGrid();
}

function revealWord() {
	if (!currentCell) return;
	let clue = currentCell.clue;
	for (let i = 0; i < clue.cells.length; i++) {
		let {y, x} = clue.cells[i];
		setCellValue(y, x, grid[y][x]);
	}
	saveGrid();
}

function revealAll() {
	// if (!confirm($.areYouSureReveal)) return;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (openSquare(y, x))
				setCellValue(y, x, grid[y][x]);
		}
	}
	saveGrid();
}

function handleKeyDown(event) {
	if (event.altKey || event.ctrlKey || event.metaKey || !event.key) return;
	let key = event.key;
	if (key.length === 1 && currentCell && alphabet.indexOf(key.toUpperCase()) !== -1) {
		setValueAndAdvance(key.toUpperCase());
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
		cursorMove(1, 0);
		break;

	case "Up":
	case "ArrowUp":
		cursorMove(-1, 0);
		break;

	case "Left":
	case "ArrowLeft":
		cursorMove(0, -1);
		break;

	case "Right":
	case "ArrowRight":
		cursorMove(0, 1);
		break;

	case " ":
	case "Enter":
		if (!currentCell) return;
		let clue = toggleClueForCell(currentCell.y, currentCell.x);
		selectCell(currentCell.y, currentCell.x, clue);
		break;

	case "Backspace":
		// Don't lose data even on errors
		event.preventDefault();
		clearOrMoveBack();
		break;

	default:
		return;
	}

	event.preventDefault();
	event.stopPropagation();
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
				if (!grid || grid.length !== height || grid[0].length !== width) {
					console.log("invalid saved grid, ignoring");
					return;
				}
				for (let y = 0; y < height; y++) {
					for (let x = 0; x < width; x++) {
						if (openSquare(y, x))
							setCellValue(y, x, grid[y][x]);
					}
				}
			};
		};
	} catch(e) {
		console.log("unable to use indexedDB", e);
	}
}

function saveGrid() {
	if (!idb) return;
	idb.transaction(["savedletters"], "readwrite")
		.objectStore("savedletters")
		.put({"id": crosswordId, grid: enteredGrid});
}

function init() {
	var errorCont = document.getElementById("errors");
	var tbody = document.getElementById("grid").querySelector("tbody");
	var clueCont = document.getElementById("clues");
	var btnCont = document.getElementById("buttons");

	function addError(msg) {
		var div = document.createElement("div");
		div.textContent = msg;
		errorCont.appendChild(div);
	}

	function clueDirs(i, j) {
		if (special[i][j] == 'D') return VERT | REVERSE;
		if (special[i][j] == '#') return 0;
		if (special[i][j] == 'A' || special[i][j] == 'B') return 0;
		var res = 0;
		if (i+1 < height && special[i+1][j] != '#' && (i == 0 || special[i-1][j] == '#')) res |= VERT;
		if (j+1 < width && special[i][j+1] != '#' && (j == 0 || special[i][j-1] == '#')) res |= HOR;
		return res;
	}

	var clueCtrs = {
		vert: 0,
		hor: 0,
	};

	function addClue(cat, index, cells) {
		var ct = clueCtrs[cat];
		if (haveGrid) {
			var word = "";
			for (let cell of cells) {
				word += grid[cell.y][cell.x];
			}
			word = word.toUpperCase();
			if (ct == clues[cat].length || !clues[cat].some(c => c.secret === word)) {
				addError("Missing clue for " + cat + " word " + word);
				return;
			}
			else if (clues[cat][ct].secret !== word) {
				addError("Wrongly ordered clue " + word + ", expected it to come before " + clues[cat][ct].secret);
				throw "stop";
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
		while (openSquare(i, j)) {
			var sp = special[i][j];
			if (sp == 'C' && (dir == HOR)) break;
			ret.push({y: i, x: j});
			if (sp == 'A') dir = VERT;
			if (sp == 'B') dir = HOR;
			if (sp == 'C' && dir == (VERT | REVERSE)) dir = HOR;
			if (dir == HOR) j++;
			else if (dir == (HOR | REVERSE)) j--;
			else if (dir == VERT) i++;
			else if (dir == (VERT | REVERSE)) i--;
			else throw new Error("invalid direction " + dir);
		}
		return ret;
	}

	if (haveGrid) console.assert(grid.length == height);
	for (var i = 0; i < height; i++) {
		if (haveGrid) console.assert(grid[i].length == width);
		console.assert(special[i].length == width);
		cellClues.push([]);
		enteredGrid.push([]);
		for (var j = 0; j < width; j++) {
			cellClues[i].push([]);
			enteredGrid[i].push('');
		}
	}

	var clueNum = 0;
	for (var i = 0; i < height; i++) {
		var tr = document.createElement("tr");
		tableCells.push([]);
		for (var j = 0; j < width; j++) {
			var td = document.createElement("td");
			tableCells[i].push(td);
			if (special[i][j] == '#')
				td.classList.add("blocked");
			else if (special[i][j] != '.')
				td.classList.add("special-" + special[i][j]);
			if (haveGrid) {
				if (special[i][j] == '#' && grid[i][j] != ' ') {
					addError(descSq(i, j) + " is marked as blocked, but contains a letter " + grid[i][j]);
				}
				if (special[i][j] != '#' && grid[i][j] == ' ') {
					addError(descSq(i, j) + " is not marked as blocked, but does not contain any letter");
				}
			}
			var dirs = clueDirs(i, j);
			if (dirs != 0) {
				clueNum++;
				if (dirs & VERT) addClue('vert', clueNum, followClue(i, j, dirs & ~HOR));
				if (dirs & HOR) addClue('hor', clueNum, followClue(i, j, dirs & ~VERT));
				td.classList.add("clue");
				td.dataset.cluenum = clueNum;
			}
			var letterCont = document.createElement("div");
			letterCont.classList.add("letter-container");
			if (special[i][j] != '#') {
				var letter = document.createElement("span");
				letter.classList.add("letter");
				if (haveGrid && showLetters) {
					letter.textContent = grid[i][j];
					enteredGrid[i][j] = grid[i][j];
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
			let index = document.createElement("span");
			index.classList.add("index");
			index.textContent = clue.index + ". ";
			row.appendChild(index);
			let cl = document.createElement("span");
			cl.textContent = clue.clue;
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
			addError("Unused clue for word " + clues[cat][clueCtrs[cat]].secret);
		}
	}

	for (let i = 0; i < height; i++) {
		for (let j = 0; j < width; j++) {
			if (special[i][j] == '#') continue;
			tableCells[i][j].onclick = function() {
				var clue = getClueForCell(i, j);
				selectCell(i, j, clue);
			};
		}
	}

	for (let cat of ['hor', 'vert']) {
		for (let clue of clues[cat]) {
			clue.elem.onclick = function() {
				selectCell(clue.cells[0].y, clue.cells[0].x, clue);
			};
		}
	}

	function addButton(text, cls, fn) {
		let elem = document.createElement('input');
		elem.type = 'button';
		elem.value = text;
		elem.onclick = fn;
		for (let cl of cls)
			elem.classList.add(cl);
		btnCont.appendChild(elem);
	}
	addButton($.clear, [], clearGrid);
	if (haveGrid) {
		addButton($.revealLetter, ['need-selection'], revealLetter);
		addButton($.revealWord, ['need-selection'], revealWord);
		addButton($.revealAll, [], revealAll);
	}

	document.addEventListener("keydown", handleKeyDown);

	restoreSavedState();
}

try {
	init();
} catch(e) {
	if (e !== "stop") throw e;
}
