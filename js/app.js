// SET AXIOS DEFAULTS
axios.defaults.baseURL 	= 'https://api.football-data.org/v1/competitions/';
axios.defaults.headers.common['X-Auth-Token'] = '56adb608c168459ab3c345b23641cd99';
axios.defaults.timeout = 5000;
// STORE RECENT SEARCH VALUE
let searchData = {
	leagueId: 'init',
	tableType: 'init'
};

let hardData = {
	lgs:{
		eng: {
			id: '445',
			color: [33,150,243],
			CL: 4,
			EL: 5
		},
		ger: {
			id: '452',
			color: [63,81,181],
			CL: 4,
			EL: 6
		},
		esp: {
			id: '455',
			color: [103,58,183],
			CL: 4,
			EL: 6
		},
		fra: {
			id: '450',
			color: [156,39,176],
			CL: 3,
			EL: 4
		},
		ita: {
			id: '456',
			color: [233, 30, 99],
			CL: 4,
			EL: 6
		}
	},
	colors:{
		green: [76,175,80],
		yellow: [255, 235, 59],
		red: [244,67,54],
		grey: [176, 190, 197]
	}
}

// GET PAGE ELEMENTS
let header  			= document.querySelector('header');
let main 				= document.querySelector('main .container');
let footer  			= document.querySelector('footer');
let leagueRadios   		= document.querySelectorAll('#leagueRadios>input');
let leagueCrest			= document.querySelectorAll('.leagueCrest');
let tableRadios			= document.querySelectorAll('#tableRadios>input');
let tableCrest			= document.querySelectorAll('.tableCrest');
let tableHeadDisp 		= document.querySelector('tHead');
let tableBodyDisp 		= document.querySelector('tBody');
let tableFootDisp 		= document.querySelector('tFoot');
let matchdayCurrentDisp = document.querySelector('.matchdayCurrent');
let matchdayTotalDisp   = document.querySelector('.matchdayTotal');
let lastUpdatedDisp     = document.querySelector('.lastUpdated');
let bgColorRows 		= document.getElementsByClassName('bgColor');
let bgColor 			= [180,31,239];

// SET EVENT LISTNERS
for(radio of leagueRadios){ // league select buttons
	radio.addEventListener("click", setLeague);
}

for(table of tableRadios){ // table select buttons
	table.addEventListener("click", setTableType);
}

// MAIN CONTROL FUNCTIONS

function setLeague(){ // get selected league
	leagueRadios.forEach((v,i) => { // check each league button

		if(v.checked && v.value !== searchData.leagueId){ // if selected and not already displayed
			searchData.leagueId = v.value; // save selected leageID
			searchData.tableType = 'new'; // allow new table			
			
			setLeagueTheme(); // set page theme
			leagueCrest[i].style.backgroundColor = `rgba(${bgColor.join(',')}, .25)`; // color selected league icon

			setLoadingTable(); // set loading table display
			getLeagueData(v.value); // retreive data from api
		}else{
			leagueCrest[i].style.backgroundColor = 'transparent';
		}
	});
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

		let standing 		= tableJSON.data.standing; // table data from api
		searchData.basic 	= basic;
		searchData.standing = standing;

		setTableType();		
	})
	.catch(setErrorMessage);
}

function setTableType(){ // set table view type
	tableRadios.forEach((v,i,a) => {
		if(searchData.tableType !== v.value){
			let bool = !(searchData.tableType === 'tra' || searchData.tableType === 'ext');
			if(v.checked){
				switch (v.value){
					case 'tra':
						setTraditionalView(bool);
						break;
					case 'ext':
						setExtendedView(bool);
						break;
					case 'alt':
						setAlternativeView(searchData.standing, searchData.basic.currentMatchday);
						break;
					default:
						setTraditionalView(true);
						break;
				}

				tableCrest[i].style.color = `rgb(${bgColor.join(',')})`;

			}else{
				tableCrest[i].style.color = `#666`;
			}
		}
	});
}

// DISPLAY CONTROL FUNCTIONS

function setStandardHead(){
	clearTableRows(tableHeadDisp); // clear table head
	clearTableRows(tableFootDisp); // clear table foot

	let crest = createCrestContainer(); // create crest cell content
	let cells = ['#', crest, 'Team Name','GP','W','D','L','GF','GA','GD','PTS']; // content for each cell

	let newHead = document.createElement('tr'); // create new row
	cells.forEach((cell)=>createTableCell(cell, newHead, true)); // make cell from content and attach to head
	newHead.children[2].setAttribute('class', 'nameCell'); // tag name cell
	[0, 3, 7, 8].forEach((v)=>newHead.children[v].setAttribute('class', 'detail')) // tag detail cells
	
	setRowPadding(newHead, 10); // set bottom padding
	tableHeadDisp.append(newHead); // attach to table head
}

function populateTable(){
	clearTableRows(tableBodyDisp); // clear body
	searchData.standing.forEach(createTableRow); // create table row from all teams in standings
}

function setTraditionalView(shouldReset){

	if(shouldReset){ // if reset needed
		setStandardHead(); // reset header
		populateTable(); // reset table info
	}

	let lgData = getHardLgsData(searchData.leagueId); //get info about current league
	let teamRows = tableBodyDisp.children; // get all rows in table
	for(let i=0; i<teamRows.length; i++){
		setRowPadding(teamRows[i], 0);	// reset padding to 0

		// SET QUALIFICATION BORDERS
		setQualificationBorders(teamRows, i, lgData);

		// SET PROPER BG COLOR
		if( i%2 === 0 ){ // if even number row and is not tagged with bgColor
			teamRows[i].style.backgroundColor = `rgba(${bgColor.join(',')}, .25)`; // add bgColor tag
		}
		else{
			teamRows[i].style.background = 'none';
		}
	}

	
	// setQualificationBorders(teamRows, lgData);
	searchData.tableType = 'tra';
}

function setExtendedView(shouldReset){

	let delay = 0;
	if(shouldReset){
		setStandardHead(); // reset header
		setTraditionalView(true); // set tradional view
		delay = 1; // delay transition
	}

	setTimeout(() => {
		let teamRows = tableBodyDisp.children; // get all rows in table
		
		let setBgColor = true; // boolean to set/not set bg color
		for(let i = 0; i < teamRows.length; i++){
	
			let isLast = i === teamRows.length-1;

			let dif = 0; // init difference between team and rival
			if(!isLast){ // last place has no rival
				let team  = teamRows[i].children; // current row
				let rival = teamRows[i+1].children; // next row
				dif       = parseInt(team[team.length-1].innerHTML) - parseInt(rival[rival.length-1].innerHTML);
				let pad   = dif*33+2;	
				setRowPadding(teamRows[i], pad); // set padding based on point difference
			}

			// SET COLOR BACKGROUND
			if(setBgColor){
				teamRows[i].style.backgroundColor = `rgba(${bgColor.join(',')}, .25)`; // add bgColor tag
			}
			else if(!setBgColor){
				teamRows[i].style.background = 'none';
			}

			dif === 0 ? true : setBgColor = !setBgColor; // keep same background if same point value
		}
		
		searchData.tableType = 'ext';
	}, delay*250);
}

function setAlternativeView(data, matchday){

	// clear table
	clearTableRows(tableHeadDisp); // head
	clearTableRows(tableBodyDisp); // body
	clearTableRows(tableFootDisp); // foot

	// set table foot
	let newFoot = document.createElement('tr'); // new row
	createTableCell('pts', newFoot);
	for(let i=0; i<data.length; i++){
		createTableCell(data[i].points, newFoot);
	}
	if(data.length%2===0){ // if team amount is even (last row will be white)
		newFoot.style.backgroundColor = `rgba(${bgColor.join(',')}, .25)`; // style foot background color
	}
	tableFootDisp.append(newFoot);



	//set table grid
	let lgData = getHardLgsData(searchData.leagueId);

	for(let i=0; i<data.length; i++){ // create row for every team
		let team 	 = data[i]; //team data
		let position = i+1; // team position/rank
		let played   = team.playedGames; // number of games played

		let teamBest  = getBestPromotion(data, position, matchday);
		let teamWorst = getWorstDemotion(data, position, matchday);

		let newRow = document.createElement('tr'); // new row
		let newCell = document.createElement('th'); //first cell
		newCell.textContent = i+1; // set position
		newRow.append(newCell);

		if(i%2 === 0){
			newRow.style.backgroundColor = `rgba(${bgColor.join(',')}, .25)`;
		}

		for(let j=1; j<data.length+1; j++){ // add cell to row for every team
			let newCell = document.createElement('td'); // new cell

			//set background color
			if(j < position){
				if(j >= teamBest){newCell.style.backgroundColor = `rgba(${hardData.colors.green.join(',')}, .5)`}
			}
			else if(j === position){
				let crest = createCrestContainer(data[i].crestURI, data[i].teamName);
				newCell.append(crest);
				played < matchday ? newCell.style.backgroundColor = `rgba(${hardData.colors.yellow.join(',')}, .5)` 
								  : newCell.style.backgroundColor = `rgba(${hardData.colors.grey.join(',')}, .5)`;
			}
			else if(j <= teamWorst){
				newCell.style.backgroundColor = `rgba(${hardData.colors.red.join(',')}, .5)`
			}

			//set qualification borders
			if(j === lgData.CL){ // if index is last CL slot, color bottom border
				newCell.style.borderRight = `3px solid rgb(${hardData.colors.green.join(',')})`;
			}
			else if(j === lgData.EL){
				newCell.style.borderRight = `3px solid rgb(${hardData.colors.yellow.join(',')})`;
			}
			else if(j === data.length-3){
				newCell.style.borderRight = `3px solid rgb(${hardData.colors.red.join(',')})`;
			}
			newRow.append(newCell);
		}

		// FADE IN TABLE ROW
		newRow.style.opacity = 0; // set opacity to 0
		tableBodyDisp.append(newRow); // add row to table
		setTimeout(() => {newRow.style.opacity=1;}, i*50); // set opacity to 1 after delay
	}

	searchData.tableType = 'alt';
}

function setQualificationBorders(rows, index, leagueData){
	if(index === leagueData.CL-1){
		rows[index].style.borderBottom = `3px solid rgb(${hardData.colors.green.join(',')})`;
	}
	else if(index === leagueData.EL-1){
		rows[index].style.borderBottom = `3px solid rgb(${hardData.colors.yellow.join(',')})`;
	}
	else if(index === rows.length-4){
		rows[index].style.borderBottom = `3px solid rgb(${hardData.colors.red.join(',')})`;
	}	
}

function getBestPromotion(tableData, position, matchday){
	let teamData = tableData[position-1]; // all team data
	let teamPts  = teamData.points; // team points

	let teamGP  	  = teamData.playedGames; // team games played
	let teamHasPlayed = teamGP === matchday; // checks if team has played this week
	
	let bestPosition = position; // init best position index
	let rivalIndex   = position-2; // init rival index

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
	let rivalIndex	  = position; // init rival tableData index

	while(rivalIndex < tableData.length){ // check from current position to top of table data

		let rivalData = tableData[rivalIndex]; // all oppenent data
		let rivalPts  = rivalData.points; //rival points


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

// EXECUTION FUNCTIONS
function getHardLgsData(lgId){
	for(key in hardData.lgs){
		if(hardData.lgs[key].id === lgId){ return hardData.lgs[key] }
	}
}

function clearTableRows(section){ // remove all table body children
	while( section.children.length > 0){ 
		section.deleteRow(0)
	}
}

function createTableRow(data, index){ // add row of given data to table at given index
	let crest = createCrestContainer(data.crestURI, data.teamName); // placeholder crest (index 1)
	
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
	[0,3,7,8].forEach((v) => newRow.children[v].setAttribute('class', 'detail'));

	if(!data){
		crest.children[0].className += ' rotateBall';
	}

	// FADE IN TABLE ROW
	newRow.style.opacity = 0; // set opacity to 0
	tableBodyDisp.append(newRow); // add row to table
	setTimeout(() => {newRow.style.opacity=1;}, index*50); // set opacity to 1 after delay
}

function setLoadingTable(){ // clear table and set loading row 
	clearTableRows(tableBodyDisp); 
	clearTableRows(tableFootDisp);
	let newRow = tableBodyDisp.insertRow(0); // create new table row at team postion
 	createTableRow(false, newRow); // create loading row
}

function setErrorMessage(err){
	clearTableRows(tableHeadDisp);
	clearTableRows(tableBodyDisp);
	clearTableRows(tableFootDisp);

	let errHead = document.createElement('h2');
	errHead.textContent = 'Something went wrong :('
	let errMess = document.createElement('p');

	if (err.response) {
	  // The request was made and the server responded with a status code
	  // that falls out of the range of 2xx
		console.log(err.response.data);
		console.log(err.response.status);
		console.log(err.response.headers);
		errMess.innerHTML ='NEEDS TO BE SET.';
	  
	} else if (err.request) {
		// The request was made but no response was received (timeout set at 5 seconds)
		errMess.innerHTML ='SERVER TIMEOUT.';
		console.log(err.request);
	} else {
	  // Something happened in setting up the request that triggered an Error
	  console.log('Error', err.message);
	  errMess.innerHTML ='SPOOKY ERROR.';
	}

	console.log(err.config);
	main.innerHTML='';
	main.append(errHead, errMess);
	
}

function createCrestContainer(img, name){ // create container for table cell img 
	let crestContainer = document.createElement('div'); // create div for team crest cell
	crestContainer.setAttribute('class', 'teamCrest');
	
	if(img){
		let crest = document.createElement('img');
		crest.src = img;
		name ? crest.title = name : crest.title = 'Soccer';
		crestContainer.append(crest);
	}
	else{	
		let icon = document.createElement('i'); //create placeholder image
		icon.setAttribute('class', 'fa fa-futbol-o'); // Font Aweseme Soccerball icon
		icon.setAttribute('aria-hidden', 'true');
		name ? icon.setAttribute('title', name) : icon.setAttribute('title', 'Soccer');

		crestContainer.append(icon); // add placeholder to crest
	}
	return crestContainer;
}

function createTableCell(cellContent, tableRow, isHeaderCell){ // quick create table cell with given content and add to given row
	
	let newCell; 
	isHeaderCell ? newCell = document.createElement('th') : newCell = document.createElement('td');

	typeof cellContent === Object ? newCell.textContent = cellContent : newCell.append(cellContent);

	tableRow.append(newCell);	
}

function setRowPadding(row, pnts){
	for(cell of row.children){
		cell.style.paddingBottom = `${pnts}px`;	
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

function setLeagueTheme(){

	for(key in hardData.lgs){
		if(hardData.lgs[key].id === searchData.leagueId){ bgColor = hardData.lgs[key].color }
	}	

	header.style.backgroundColor = `rgb(${bgColor.join(',')})`;
	footer.style.backgroundColor = `rgb(${bgColor.join(',')})`;
	
	tableRadios.forEach((v,i,a)=>{
		if(v.checked){
			tableCrest[i].style.color = `rgb(${bgColor.join(',')})`;
		}else{
			tableCrest[i].style.color = '#666';
		}
	})
}

setLeague();


// TODO STUFF
// Detail API ERROR messages
// getBestPromotion and getWorstDemotion Do not account for BYE-WEEKS,POSTPONED, and INPLAY GAMES