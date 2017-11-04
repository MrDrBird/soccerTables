// SET AXIOS DEFAULTS
axios.defaults.baseURL 	= 'https://api.football-data.org/v1/competitions/';
axios.defaults.headers.common['X-Auth-Token'] = '56adb608c168459ab3c345b23641cd99';

// GET PAGE ELEMENTS
let header  			  = document.querySelector('header');
let footer  			  = document.querySelector('footer');
let leagueSelect   		  = document.querySelector('#leagueSelect');
let tableSelect   		  = document.querySelector('#tableSelect');
let matchdayCurrentDisp   = document.querySelector('.matchdayCurrent');
let matchdayTotalDisp     = document.querySelector('.matchdayTotal');
let tableBodyDisp 		  = document.querySelector('tBody');
let lastUpdatedDisp       = document.querySelector('.lastUpdated');
let bgColorRows 		  = document.getElementsByClassName('bgColor');
let bgColor 			  = [180,31,239];

// SET EVENT LISTNERS
leagueSelect.addEventListener("change", setLeague); // show selected league
tableSelect.addEventListener("change", setTableType); // set padding/background color based on team points for table view


// DECLARE FUNCTIONS

function clearTableBody(){ // remove all table body children 
	while( tableBodyDisp.children.length > 0){ 
		tableBodyDisp.deleteRow(0);
	}
}

function createTableRow(data, index){ // add row of data to table

	let crestContainer = document.createElement('div'); // create div for team crest cell
	crestContainer.setAttribute('class', 'teamCrest');
	
	let icon = document.createElement('i'); //create placeholder image
	icon.setAttribute('class', 'fa fa-futbol-o'); // Font Aweseme Soccerball icon
	icon.setAttribute('aria-hidden', 'true'); 

	crestContainer.innerHTML = icon; // add placeholder to crest

 	let cells = [ // cell data for row
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

	let newRow = document.createElement('tr'); // create new row
	for(cell of cells){ // create table cell for each piece of cell data
		let newCell = newRow.insertCell(); // make new cell
		typeof cell === Object ? newCell.textContent = cell : newCell.append(cell); // set text or append object to cell
	}

	setTeamCrest(data.crestURI, newRow); // REPLACE PLACEHOLDER IF CREST EXIST
	
	// FADE IN TABLE ROW
	newRow.style.opacity = 0; // set opacity to 0
	tableBodyDisp.append(newRow); // add row to table
	setTimeout(() => {newRow.style.opacity=1;}, index*50); // set opacity to 1 after delay
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
	let leagueId = leagueSelect.options[leagueSelect.selectedIndex].value; // selected element from dropdown menu
	setLoadingTable();
	getLeagueData(leagueId);
	randomColor();
}

function setTableType(){
	let tableType = tableSelect.options[tableSelect.selectedIndex].value; // selected element from dropdown menu
	tableType === 'ext' ? setAltTableView() : setRegularTableView();
}

function setLoadingTable(){
	clearTableBody();
	let newRow = tableBodyDisp.insertRow(0); // create new table row at team postion
 	let cells = ['#', '#', 'Loading...','#','#','#','#','#','#','#','#'];
	for(v of cells){ // create table cell for all data
		createTableCell(v, newRow);
	}
}

function getLeagueData(lgID){

	axios.all([
		axios.get(lgID), // basic data
		axios.get(`${lgID}/leagueTable`) // league table data
	])
	.then((res) => {

		let basicJSON = res[0];
		let tableJSON = res[1];

		let basic = basicJSON.data;	// basic data from api	
		matchdayCurrentDisp.textContent = basic.currentMatchday; // Set current matchday display
		matchdayTotalDisp.textContent   = basic.numberOfMatchdays; // Set total matchday display
		lastUpdatedDisp.textContent 	= orgDate(basic.lastUpdated); // set updated date
		
		let standing = tableJSON.data.standing; // table data from api
		clearTableBody(); 
		standing.forEach(createTableRow); // create table row from all teams in standings
		tableSelect.value === 'ext' ? setTimeout(setAltTableView, standing.length*50) : false;	// set alt table view after delay
		setRegularTableView();
	})
	.catch((err) => console.log(err));
}

function orgDate(ugly){
	let [dateStr, timeStr] = ugly.split(/[TZ]/); // input data looks like 'yyyy-mm-ddT00:00:00Z'

	// make MM/DD/YYYY date string
	dateStr = dateStr.split(/[-]/);
	[dateStr[0], dateStr[1], dateStr[2]] = [dateStr[1], dateStr[2], dateStr[0]];
	dateStr = dateStr.join('/');

	// make HH:MM GMT time string
	timeStr = timeStr.split(/[:]/);
	timeStr = timeStr.slice(0,2).join(':') + ' GMT';

	return `${dateStr} ${timeStr}`;
}

function setAltTableView(){
	let teamRows = tableBodyDisp.children; // get all rows in table
	let setBgColor = true;

	for(let i=0; i<teamRows.length-1; i++){

		let team 		= teamRows[i].children; // team point val
		let rival 		= teamRows[i+1].children; // next row point val
		let teamPoints  = parseInt(team[team.length -1].innerHTML);
		let rivalPoints = parseInt(rival[rival.length -1].innerHTML);
		let dif 		= teamPoints-rivalPoints; //deduce point differnce between teams
		setRowPadding(teamRows[i], dif); // set padding based on point difference

		// SET COLOR BACKGROUND
		let hasBgColor = teamRows[i].className === 'bgColor'; // check if bg is already applied

		if(setBgColor && !hasBgColor){
			teamRows[i].setAttribute('class', 'bgColor');
		}
		else if(!setBgColor && hasBgColor){
			teamRows[i].classList.remove('bgColor');
			teamRows[i].style.background = 'none';
		}

		dif === 0 ? true : setBgColor = !setBgColor; // keep same background if same point value
	}
	for(row of bgColorRows){
		row.style.backgroundColor = `rgba(${bgColor.join(',')}, .15)`;
	}
}

function setRegularTableView(){
	let teamRows = tableBodyDisp.children; // get all rows in table
	
	for(let i=0; i<teamRows.length-1; i++){
		setRowPadding(teamRows[i], 0);	// reset padding to 0

		// SET PROPER BG COLOR
		let hasBgColor = teamRows[i].className === 'bgColor';
		if( i%2 === 0 && !hasBgColor ){
			teamRows[i].setAttribute('class', 'bgColor')
		}
		else if( i%2 !== 0 && hasBgColor ){
			teamRows[i].classList.remove('bgColor');
			teamRows[i].style.background = 'none';
		}
	}
	for(row of bgColorRows){
		row.style.backgroundColor = `rgba(${bgColor.join(',')}, .15)`;
	}
	
}

function setRowPadding(row, pnts){
	for(let i=0; i<row.children.length; i++){
		row.children[i].style.paddingBottom = `${pnts*33+2}px`;	
	}
}

function randomColor(){
	let prettyColors = [
		[180,31,239],
		[13, 220, 220],
		[189, 36, 70],
		[16, 101, 144]
	];

	let rand = Math.floor(Math.random()*4);
	bgColor = prettyColors[rand];
	let color = `rgb(${bgColor.join(',')})`
	header.style.backgroundColor = color;
	footer.style.backgroundColor = color;
}

setLeague();