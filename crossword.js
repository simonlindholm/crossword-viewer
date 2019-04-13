
grid = grid.trim().split('\n');
special = special.trim().split('\n');
vertClues = vertClues.trim().split('\n');
horClues = horClues.trim().split('\n');

var vertText = "Lodrätt";
var horText = "Vågrätt";

var VERT = 1, HOR = 2;

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

var height = grid.length, width = grid[0].length;
console.assert(special.length == height);
for (var i = 0; i < height; i++) {
	console.assert(grid[i].length == width);
	console.assert(special[i].length == width);
}

function clueDirs(i, j) {
	if (special[i][j] == 'D') return VERT;
	if (grid[i][j] == '#') return 0;
	if (special[i][j] == 'A' || special[i][j] == 'B') return 0;
	var res = 0;
	if (i+1 < height && grid[i+1][j] != '#' && (i == 0 || grid[i-1][j] == '#')) res |= VERT;
	if (j+1 < width && grid[i][j+1] != '#' && (j == 0 || grid[i][j-1] == '#')) res |= HOR;
	return res;
}

var clueCtrs = {
	vert: 0,
	hor: 0,
};
function addClue(cat, index) {
	var ct = clueCtrs[cat]++;
	if (ct < clues[cat].length) {
		clues[cat][ct].index = index;
	}
}

var clueNum = 0;
var tbody = document.querySelector("tbody");
var clueCont = document.getElementById("clues");
var errorCont = document.getElementById("errors");
for (var i = 0; i < height; i++) {
	var tr = document.createElement("tr");
	for (var j = 0; j < width; j++) {
		var td = document.createElement("td");
		if (grid[i][j] == '#')
			td.classList.add("blocked");
		if (special[i][j] != '.')
			td.classList.add("special-" + special[i][j]);
		var clue = clueDirs(i, j);
		if (clue != 0) {
			clueNum++;
			if (clue & VERT) addClue('vert', clueNum);
			if (clue & HOR) addClue('hor', clueNum);
			td.classList.add("clue");
			td.dataset.cluenum = clueNum;
		}
		if (showLetters && grid[i][j] != '#') {
			var letterCont = document.createElement("div");
			letterCont.classList.add("letter-container");
			var letter = document.createElement("span");
			letter.classList.add("letter");
			letter.textContent = grid[i][j];
			letterCont.appendChild(letter);
			td.appendChild(letterCont);
		}
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

function addError(msg) {
	var div = document.createElement("div");
	div.textContent = msg;
	errorCont.appendChild(div);
}

if (clueCtrs.vert < clues.vert.length) {
	addError("Fewer vertical words than clues!");
}
if (clueCtrs.vert > clues.vert.length) {
	addError("More vertical words than clues!");
}
if (clueCtrs.hor < clues.hor.length) {
	addError("Fewer horizontal words than clues!");
}
if (clueCtrs.hor > clues.hor.length) {
	addError("More horizontal words than clues!");
}
