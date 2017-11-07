// SET AXIOS DEFAULTS
axios.defaults.baseURL 	= 'https://api.football-data.org/v1/competitions/';
axios.defaults.headers.common['X-Auth-Token'] = '56adb608c168459ab3c345b23641cd99';

// STORE RECENT SEARCH VALUE
let searchData = {
	tableType: 'tra'
};

// GET PAGE ELEMENTS
let header  			  = document.querySelector('header');
let footer  			  = document.querySelector('footer');
let leagueSelect   		  = document.querySelector('#leagueSelect');
let tableSelect   		  = document.querySelector('#tableSelect');
let matchdayCurrentDisp   = document.querySelector('.matchdayCurrent');
let matchdayTotalDisp     = document.querySelector('.matchdayTotal');
let tableHeadDisp 		  = document.querySelector('tHead');
let tableBodyDisp 		  = document.querySelector('tBody');
let lastUpdatedDisp       = document.querySelector('.lastUpdated');
let bgColorRows 		  = document.getElementsByClassName('bgColor');
let bgColor 			  = [180,31,239];

// SET EVENT LISTNERS
leagueSelect.addEventListener("change", setLeague); // show selected league
tableSelect.addEventListener("change", setTableType); // set padding/background color based on team points for table view 

// FUNCTIONS
function setLeague(){ //Set display of selected league
	let leagueId = leagueSelect.options[leagueSelect.selectedIndex].value; // get selected element from dropdown menu
	searchData.tableType = 'alt';
	setLoadingTable(); // set loading table display
	getLeagueData(leagueId); // retreive data from api
	randomColor(); // set page theme
}

function getLeagueData(lgID){ // search api for data of given league and set display
	axios.all([
		axios.get(lgID), // basic data
		axios.get(`${lgID}/leagueTable`) // league table data
	])
	.then((res) => {

		let basicJSON = res[0];
		let tableJSON = res[1];

		let basic 						= basicJSON.data; // basic data from api	

		matchdayCurrentDisp.textContent = basic.currentMatchday; // Set current matchday display
		matchdayTotalDisp.textContent   = basic.numberOfMatchdays; // Set total matchday display
		lastUpdatedDisp.textContent 	= orgDate(basic.lastUpdated); // set updated date

		let standing = tableJSON.data.standing; // table data from api

		searchData.basic 	= basic;
		searchData.standing = standing;

		setTableType();		
	})
	.catch((err) => console.log(err)); //TODO _____________----------------------
}

function clearTableRows(section){ // remove all table body children
	while( section.children.length > 0){ 
		section.deleteRow(0)
	}
}

function createTableRow(data, index){ // add row of given data to table at given index
	let crest = createCrestContainer(); // placeholder crest (index 1)
	let cells;

	if(data){
	 	cells = [ // cell data for row
		 	data.position,
		 	crest,
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
	}else{
		cells = ['1', crest, 'Loading...','0','0','0','0','0','0','0','0'];
	}

	let newRow = document.createElement('tr'); // create new row
	cells.forEach((cell)=>createTableCell(cell, newRow)) // create table cell for each piece of cell data
		
		newRow.children[2].setAttribute('class', 'nameCell'); // tag name cell
		newRow.children[0].setAttribute('class', 'detail'); // tag detail cell
		newRow.children[3].setAttribute('class', 'detail'); // tag detail cell
		newRow.children[7].setAttribute('class', 'detail'); // tag detail cell
		newRow.children[8].setAttribute('class', 'detail'); // tag detail cell

	
	data ? setTeamCrest(data.crestURI, newRow) : false; // REPLACE PLACEHOLDER IF CREST EXIST

	// FADE IN TABLE ROW
	newRow.style.opacity = 0; // set opacity to 0
	tableBodyDisp.append(newRow); // add row to table
	setTimeout(() => {newRow.style.opacity=1;}, index*50); // set opacity to 1 after delay
}

function setLoadingTable(){ // clear table and set loading row 
	clearTableRows(tableBodyDisp); 
	let newRow = tableBodyDisp.insertRow(0); // create new table row at team postion
 	createTableRow(false, newRow); // create loading row
}

function createCrestContainer(img, name){ // create container for table cell img 
	let crestContainer = document.createElement('div'); // create div for team crest cell
	crestContainer.setAttribute('class', 'teamCrest');
	
	if(img){
		let crest = document.createElement('img');
		crest.src = img;
		name ? crest.title = name : false;
		crestContainer.append(crest);
	}
	else{	
		let icon = document.createElement('i'); //create placeholder image
		icon.setAttribute('class', 'fa fa-futbol-o'); // Font Aweseme Soccerball icon
		icon.setAttribute('aria-hidden', 'true');
		icon.setAttribute('title', name);

		crestContainer.append(icon); // add placeholder to crest
	}
	return crestContainer;
}

function setTeamCrest(img, row){ // replace img in table cell 
	if(img){
		let div = row.children[1].children[0];
	 	let teamCrest = document.createElement('img');
		teamCrest.src = img;
		div.innerHTML = '';
		div.append(teamCrest);
	}
}

function createTableCell(cellContent, tableRow, isHeaderCell){ // quick create table cell with given content and add to given row
	let newCell; isHeaderCell ? newCell = document.createElement('th') : newCell = document.createElement('td');
	typeof cellContent === Object ? newCell.textContent = cellContent : newCell.append(cellContent);
	tableRow.append(newCell);	
}

function setTableType(){ // set table view type
	
	let tableType = tableSelect.options[tableSelect.selectedIndex].value; // selected element from dropdown menu
	switch (tableType){
		case 'tra':
			setRegularTableView(searchData.tableType);
			break;
		case 'ext':
			setExtTableView(searchData.tableType);
			break;
		case 'alt':
			setPreviewTable(searchData.standing, searchData.basic.currentMatchday);
			break;
		default:
			setRegularTableView(searchData.tableType);
			break;
	}
	searchData.tableType = tableType;
}

function setStandardHead(){ 
	clearTableRows(tableHeadDisp);

	let crest = createCrestContainer();
	let cells = ['#', crest, 'Team Name','GP','W','D','L','GF','GA','GD','PTS'];

	let newHead = document.createElement('tr'); // create new row
	cells.forEach((cell)=>createTableCell(cell, newHead, true));
	newHead.children[2].setAttribute('class', 'nameCell'); // tag name cell
	newHead.children[0].setAttribute('class', 'detail'); // tag detail cell
	newHead.children[3].setAttribute('class', 'detail'); // tag detail cell
	newHead.children[7].setAttribute('class', 'detail'); // tag detail cell
	newHead.children[8].setAttribute('class', 'detail'); // tag detail cell
	setRowPadding(newHead, 10);
	tableHeadDisp.append(newHead);
}

function setRegularTableView(fromType){

	if(fromType !== 'ext'){

		setStandardHead(); // reset header
		clearTableRows(tableBodyDisp); // clear body
		searchData.standing.forEach(createTableRow); // create table row from all teams in standings

	}

	let teamRows = tableBodyDisp.children; // get all rows in table
	
	for(let i=0; i<teamRows.length; i++){
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

function setExtTableView(fromType){
	let delay =0;
	if(fromType === 'alt'){
		setStandardHead(); // reset header
		setRegularTableView('alt');
		delay = 1;
	}

	setTimeout(function(){
		let teamRows = tableBodyDisp.children; // get all rows in table
		
		let setBgColor = true;
		for(let i = 0; i < teamRows.length; i++){
	
			let last = i === teamRows.length-1;
			let dif = 0;
	
			if(!last){ //skip rival and dif if last row
				let team 		= teamRows[i].children; // current row
				let rival 		= teamRows[i+1].children; // next row
				let teamPoints  = parseInt(team[team.length-1].innerHTML); // team point val
				let rivalPoints = parseInt(rival[rival.length-1].innerHTML); // next row point val
				dif    		    = teamPoints - rivalPoints; // point differnce between teams
				
				let pad = dif*33+2;	
				setRowPadding(teamRows[i], pad); // set padding based on point difference
			}
			// SET COLOR BACKGROUND
			let hasBgColor = teamRows[i].className === 'bgColor'; // check if bg is already applied
	
			if(setBgColor && !hasBgColor){ 
				teamRows[i].setAttribute('class', 'bgColor');
			}
			else if(!setBgColor && hasBgColor){
				teamRows[i].classList.remove('bgColor');
				teamRows[i].style.background = 'none';
			}
	
			if(!last){
				dif === 0 ? true : setBgColor = !setBgColor; // keep same background if same point value
			}
		}
	
		for(row of bgColorRows){
			row.style.backgroundColor = `rgba(${bgColor.join(',')}, .15)`;
		}
	}, delay*250);
}

function setPreviewTable(data, matchday){

	// clear table
	clearTableRows(tableHeadDisp);
	clearTableRows(tableBodyDisp);



	//TODO -- MAKE SET TABLE HEAD = SET TABLE FOOT
	// set table head
	let newHead = document.createElement('tr');
	createTableCell('#', newHead, true);
	for(let i=0; i<data.length; i++){
		createTableCell(data[i].points, newHead, true);
	}
	tableHeadDisp.append(newHead);
	
	//set table grid
	for(let i=0; i<data.length; i++){ // create row for every team
		let newRow = document.createElement('tr');

		let newCell = document.createElement('th'); // set position on left axis
		newCell.textContent = i+1;
		newRow.append(newCell);

		for(let j=1; j<data.length+1; j++){ // add cell to row for every team
			let newCell = document.createElement('td');
			if(j === i+1){
				let crest = createCrestContainer(data[i].crestURI, data[i].teamName);
				newCell.append(crest);
				newCell.style.textAlign = 'center';
				newCell.style.padding = '2px';
			}
			newRow.append(newCell);
		}
		

		// FADE IN TABLE ROW
		newRow.style.opacity = 0; // set opacity to 0
		tableBodyDisp.append(newRow); // add row to table
		setTimeout(() => {newRow.style.opacity=1;}, i*50); // set opacity to 1 after delay
	}
	
	// set grid colors
	for(let i=0; i<data.length; i++){

		let teamData = data[i];

		let position  = i+1;
		let played    = teamData.playedGames;

		let teamBest  = getBestPromotion(data, i+1, matchday);
		let teamWorst = getWorstDemotion(data, i+1, matchday);

		let rowCells = tableBodyDisp.children[i].children;
		for(let j = 1; j < rowCells.length; j++){

			//color potential promotion spots
			if(j < position){
				if(j >= teamBest){rowCells[j].setAttribute('class', 'promotion')}
			}
		 	// color current position cell
			else if(j === position){
				played < matchday ? rowCells[j].setAttribute('class', 'hasNotPlayed') : rowCells[j].setAttribute('class', 'hasPlayed'); //light gray if not played, dark gray if played
			}
			else if(j <= teamWorst){
				rowCells[j].setAttribute('class', 'demotion');
			}
		
		}
	}
}

function getBestPromotion(tableData, position, matchday){
	let teamData = tableData[position-1]; // all team data

	let teamPts = teamData.points; // team points

	let teamGP  	  = teamData.playedGames; // team games played
	let teamHasPlayed = teamGP === matchday; // checks if team has played this week
	
	let bestPosition = position; // init best position index
	let rivalIndex = position-2; // init rival index

	while(rivalIndex >= 0){ // check from current position to top of table data

		let rivalData = tableData[rivalIndex]; // all oppenent data
		let rivalPts = rivalData.points; //rival points

		if(!teamHasPlayed){ // team has not played this week
			if(teamPts+3 >= rivalPts){ // check if rival is within 3 points
				bestPosition--; // iterate possible best position
				rivalIndex--; // reduce rival index for next loop
			}
			else{
				rivalIndex = -1; // end loop 
			}
		}
		else{ // team has already played this week
			if(teamPts === rivalPts){ // if rival has equal points (possible change based on goalDif)
				if(rivalData.playedGames < matchday){ // check if rival has not played this week
					bestPosition--;	// iterate possible best position
				}
				rivalIndex--; // reduce rival index for next loop
			}
			else{
				rivalIndex = -1; // end loop
			}
		}
	}
	
	return bestPosition;
}

function getWorstDemotion(tableData, position, matchday){
	let teamData = tableData[position-1]; // all team data

	let teamPts = teamData.points; // team points

	let teamGP        = teamData.playedGames; // team games played
	let teamHasPlayed = teamGP === matchday; // checks if team has played this week

	let worstPosition = position; // init worst position index
	let rivalIndex = position; // init rival tableData index

	while(rivalIndex < tableData.length){ // check from current position to top of table data

		let rivalData = tableData[rivalIndex]; // all oppenent data
		let rivalPts = rivalData.points; //rival points


		if(rivalPts+3 >= teamPts){ // check if rival team is within 3 points
			if(rivalData.playedGames < matchday){ //if rival has not played
				worstPosition++;
			}
			else{
				if(teamPts === rivalPts && !teamHasPlayed){ // if rival has played, team has not played, and rival points equal team points
					worstPosition++;
				}
			} 
			rivalIndex++;
		}else{
			rivalIndex = tableData.length; // end loop
		}
	}
	return worstPosition;
}

function setRowPadding(row, pnts){
	for(let i=0; i<row.children.length; i++){
		row.children[i].style.paddingBottom = `${pnts}px`;	
	}
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

function randomColor(){
	let prettyColors = [
		[180,31,239],
		[13, 220, 220],
		[189, 36, 70],
		[16, 101, 144]
	];

	let rand = Math.floor(Math.random()*4);
	bgColor = prettyColors[rand];
	header.style.backgroundColor = `rgb(${bgColor.join(',')})`;
	footer.style.backgroundColor = `rgb(${bgColor.join(',')})`;
}

setLeague();


// TODO STUFF
// CHANGE LEAGUE DROP DOWN TO BUTTON LIST OF LEAGUE FLAGS
// MAKE clearTableCells fade out cells instead of instant delete
// getBestPromotion and getWorstDemotion Do not account for BYE-WEEKS,POSTPONED, and INPLAY GAMES