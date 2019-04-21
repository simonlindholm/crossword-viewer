
var haveGrid = true;
if (grid !== null) {
	grid = grid.split('\n').filter(x => x);
} else {
	haveGrid = false;
}
special = special.trim().split('\n');
vertClues = vertClues.trim().split('\n');
horClues = horClues.trim().split('\n');

var vertText = "Lodrätt";
var horText = "Vågrätt";

var VERT = 1, HOR = 2, REVERSE = 4;

class Clue {
	constructor(line) {
		console.assert(line, "empty clue line");
		var parts = line.split(" - ");
		this.secret = parts[0];
		this.clue = parts.slice(1).join(" - ");
		this.index = -1;
	}
}

var clues = {
	vert: vertClues.map(line => new Clue(line)),
	hor: horClues.map(line => new Clue(line)),
};

var height = special.length, width = special[0].length;

function descSq(i, j) {
	return "Row " + (i+1) + " col " + (j+1);
}

function init() {
	var errorCont = document.getElementById("errors");
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
			word = word.toLowerCase();
			if (ct == clues[cat].length || !clues[cat].some(c => c.secret === word)) {
				addError("Missing clue for " + cat + " word " + word);
				return;
			}
			else if (clues[cat][ct].secret !== word) {
				addError("Wrongly ordered clue " + word + ", expected it to come before " + clues[cat][ct].secret);
				throw "stop";
			}
		}

		clues[cat][ct].index = index;
		clues[cat][ct].cells = cells;
		clueCtrs[cat]++;
	}

	function followClue(i, j, dir) {
		var ret = [];
		while (i >= 0 && j >= 0 && i < height && j < width && special[i][j] != '#') {
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
	}

	var clueNum = 0;
	var tbody = document.querySelector("tbody");
	var clueCont = document.getElementById("clues");
	for (var i = 0; i < height; i++) {
		var tr = document.createElement("tr");
		for (var j = 0; j < width; j++) {
			var td = document.createElement("td");
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
				if (haveGrid && showLetters)
					letter.classList.add("show");
				if (haveGrid)
					letter.textContent = grid[i][j];
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
		}
		clueCont.appendChild(cont);
	}
	genClues('hor', horText);
	genClues('vert', vertText);

	for (let cat of ['hor', 'vert']) {
		if (clueCtrs[cat] < clues[cat].length) {
			addError("Unused clue for word " + clues[cat][clueCtrs[cat]].secret);
		}
	}
}

try {
	init();
} catch(e) {
	if (e !== "stop") throw e;
}
