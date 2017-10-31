axios.defaults.baseURL 	= 'http://api.football-data.org/v1/competitions/';
axios.defaults.headers.common['X-Auth-Token'] = '56adb608c168459ab3c345b23641cd99';


let leagueNameDisp 		  = document.querySelector('h2');
let leagueList 	   		  = document.querySelector('select');
let tableViewBox   		  = document.querySelector('input[type="checkbox"]');
let matchdayCurrentDisp   = document.querySelector('.matchdayCurrent');
let matchdayTotalDisp     = document.querySelector('.matchdayTotal');
let tableBodyDisp 		  = document.querySelector('tBody');
let lastUpdatedDisp       = document.querySelector('.lastUpdated');

leagueList.addEventListener("change", setLeague);
tableViewBox.addEventListener("change", () => alert('This doesn\'t do anything yet!'))

function clearTableBody(){
	while( tableBodyDisp.children.length > 0){
		tableBodyDisp.deleteRow(0);	
	}
}

function createTableRow(data, index){
	
	let newRow = tableBodyDisp.insertRow(index); // create new table row at team postion
 	
 	let cells = [ // data for each cell
	 	data.position,
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
}

function createTableCell(cellContent, tableRow){
	let newCell = tableRow.insertCell();
	newCell.textContent = cellContent;
}

function setTeamCrest(img, row){
	let teamCell = row.children[1];
	
	let crestContainer = document.createElement('div');
	crestContainer.setAttribute('class', 'teamCrest');
	teamCell.prepend(crestContainer);

	if(img){
		let teamCrest = document.createElement('img');
		teamCrest.src = img;
		crestContainer.append(teamCrest);
	}else{
		let icon ='<i class="fa fa-futbol-o" aria-hidden="true"></i>';
		crestContainer.innerHTML = icon;
	}
}

function setLeague(){
	let leagueSelected = leagueList.options[leagueList.selectedIndex]; // selected element from dropdown menu
	let leagueName 	   = leagueSelected.innerHTML; 
	let leagueId 	   = leagueSelected.value;

	leagueNameDisp.innerHTML = leagueName; // set display name to inner text
	clearTableBody();

	let newRow = tableBodyDisp.insertRow(0); // create new table row at team postion
 	let cells = ['#','Loading...','#','#','#','#','#','#','#','#'];
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
	timeStr = timeStr.join(':') + ' EST';

	return dateStr + ' ' + timeStr;
}

setLeague();