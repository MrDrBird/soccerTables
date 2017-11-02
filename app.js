axios.defaults.baseURL 	= 'https://api.football-data.org/v1/competitions/';
axios.defaults.headers.common['X-Auth-Token'] = '56adb608c168459ab3c345b23641cd99';


let leagueNameDisp 		  = document.querySelector('h2');
let leagueList 	   		  = document.querySelector('select');
let tableViewBox   		  = document.querySelector('input[type="checkbox"]');
let matchdayCurrentDisp   = document.querySelector('.matchdayCurrent');
let matchdayTotalDisp     = document.querySelector('.matchdayTotal');
let tableBodyDisp 		  = document.querySelector('tBody');
let lastUpdatedDisp       = document.querySelector('.lastUpdated');

leagueList.addEventListener("change", setLeague);
tableViewBox.addEventListener("change", (val) => {
	tableViewBox.checked ? setAltTableView() : resetTableView();
});

function clearTableBody(){
	while( tableBodyDisp.children.length > 0){
		tableBodyDisp.deleteRow(0);	
	}
}

function createTableRow(data, index){
	
	let newRow = document.createElement('tr');
	let icon = '<i class="fa fa-futbol-o" aria-hidden="true"></i>';
	let crestContainer = document.createElement('div');
	crestContainer.setAttribute('class', 'teamCrest');
 	crestContainer.innerHTML = icon;

 	let cells = [ // data for each cell
	 	data.position,
	 	crestContainer,
	 	data.teamName,
		data.playedGames,
		data.wins,
		data.draws,
		data.losses,
		data.goals,
		data.goalsAgainst,
		data.goalDifference,
		data.points
	];

	for(v of cells){ // create table cell for all data
		createTableCell(v, newRow);
	}

	setTeamCrest(data.crestURI, newRow);
	newRow.style.opacity = 0;
	tableBodyDisp.append(newRow);
	setTimeout(function(){newRow.style.opacity=1;}, index*50);
}

function createTableCell(cellContent, tableRow){
	let newCell = tableRow.insertCell();
	typeof cellContent === Object ? newCell.textContent = cellContent : newCell.append(cellContent);	
}

function setTeamCrest(img, row){

	if(img){

		let div = row.children[1].children[0];
	 	let teamCrest = document.createElement('img');
		teamCrest.src = img;
		div.innerHTML = '';
		div.append(teamCrest);
	}
}

function setLeague(){
	let leagueSelected = leagueList.options[leagueList.selectedIndex]; // selected element from dropdown menu
	let leagueName 	   = leagueSelected.innerHTML; 
	let leagueId 	   = leagueSelected.value;

	leagueNameDisp.innerHTML = leagueName; // set display name to inner text
	clearTableBody();

	let newRow = tableBodyDisp.insertRow(0); // create new table row at team postion
 	let cells = ['#', '#', 'Loading...','#','#','#','#','#','#','#','#'];
	for(v of cells){ // create table cell for all data
		createTableCell(v, newRow);
	}
	setTeamCrest(false, newRow);

	getLeagueData(leagueId);
}

function getLeagueData(lgID){

	axios.all([
		axios.get(lgID), // basic data
		axios.get(`${lgID}/leagueTable`) // league table data
	])
	.then((res) => {

		let basicJSON = res[0];
		let tableJSON = res[1];

		clearTableBody();

		let basic = basicJSON.data;		
		matchdayCurrentDisp.textContent = basic.currentMatchday;
		matchdayTotalDisp.textContent = basic.numberOfMatchdays;
		lastUpdatedDisp.textContent = orgDate(basic.lastUpdated);
		
		let standing = tableJSON.data.standing;
		standing.forEach(createTableRow);
		tableViewBox.checked?setAltTableView():false;	
	})
	.catch((err) => console.log(err));
}

function orgDate(ugly){
	let [dateStr, timeStr] = ugly.split(/[TZ]/);

	// make MM/DD/YYYY date string
	dateStr = dateStr.split(/[-]/);
	[dateStr[0], dateStr[1], dateStr[2]] = [dateStr[1], dateStr[2], dateStr[0]];
	dateStr = dateStr.join('/');

	// make HH:MM GMT time string
	timeStr = timeStr.split(/[:]/);
	timeStr.pop();
	timeStr = timeStr.join(':') + ' GMT';

	return dateStr + ' ' + timeStr;
}

function setAltTableView(){

	let teamRows = tableBodyDisp.children;
	let lastPoints = 0;

	for(let i=0; i<teamRows.length-1; i++){
		let team 		= teamRows[i].children;
		let rival 		= teamRows[i+1].children;
		let teamPoints  = parseInt(team[team.length -1].innerHTML);
		let rivalPoints = parseInt(rival[rival.length -1].innerHTML);
		let dif 		= teamPoints-rivalPoints;

		setRowPadding(teamRows[i], dif);
		if(dif===0){
			i++;
			tableBodyDisp.insertRow(i);

		}
	}
}

function resetTableView(){
	let teamRows = tableBodyDisp.children;
	for(let i=0; i<teamRows.length-1; i++){
		teamRows[i].children.length === 0 ? teamRows[i].remove() : false;
		setRowPadding(teamRows[i], 0);	
	}
}

function setRowPadding(row, pnts){
	for(let i=0; i<row.children.length; i++){
		row.children[i].style.paddingBottom = `${pnts*33}px`;	
	}
}

setLeague();