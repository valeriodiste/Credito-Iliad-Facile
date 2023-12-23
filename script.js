/*
NOTE: Website uses https://github.com/gnuns/allorigins to bypass CORS policy, i.e. it makes a request through the API at the website to the unofficial Iliad API at https://github.com/MattVoid/Iliad-Unofficial-API
*/

// Variables
// NOTE: for some reason, the "iliad-unofficial-api" does not return username, user_id and number (as instead written in the API specification)...
let username;
let user_id;
let number;
// Main info to be shown
let credit;
let renewal;
// Attempt to 
const MAX_TOTAL_LOGIN_ATTEMPTS_IN_CASE_OF_ERROR = 15;
// sessionStorage.removeItem('token');
const RECOVER_ERRORS = true;
const USE_SESSION_STORAGE = false;
document.addEventListener('DOMContentLoaded', function () {
	// Check if this page has, in its url, parameters for the user id and password
	let params = new URLSearchParams(window.location.search);
	// If the parameters are present, try to login
	if (params.has('userid') && params.has('password') && params.has('check') && params.get('check') != 0) {
		// Login with the parameters
		let userid = params.get('userid');
		let password = params.get('password');
		let check = params.get('check');
		check = parseInt(check);
		if (check >= 1) {
			// Redirect on this page but without the parameters in the url
			console.log("User ID: " + userid);
			console.log("Password: " + password);
			login(userid, password);
		}
	} else {
		// Check if the user is already logged in
		// NOTE: Session storage functionalities are currently inactive...
		if (sessionStorage.getItem('token')) {
			// Redirect to the dashboard
			let token = sessionStorage.getItem('token');
			console.log("Token stored: " + token);
			if (!token || token == 'undefined') {
				// Remove it from the local storage and reload the page
				console.log("Token undefined, reloading...");
				sessionStorage.removeItem('token');
				window.location.reload();
			} else {
				// Use the token to get the credit
				use_token(token);
			}
		} else {
			// Show the login form
			document.getElementById('login-form').style.display = 'block';
			document.getElementById('loading').style.display = 'none';
			// Check if the user has already tried to login
			let params = new URLSearchParams(window.location.search);
			if (params.has('check')) {
				// Show an alert
				let check = params.get('check');
				if (check == 0) {
					// Add class "error" to the login form
					document.getElementById('login-form').classList.add('error');
					// Fill username and password fields with the parameters
					let userid = params.get('userid');
					let password = params.get('password');
					document.getElementById('user-id').value = userid;
					document.getElementById('password').value = password;
				}
			}
		}
	}
	// Add event listener to the login button
	document.getElementById('login-submit').addEventListener('click', function (event) {
		// Prevent default
		// Get the user id and password from the input fields
		let userid = document.getElementById('user-id').value;
		let password = document.getElementById('password').value;
		// Check if the user id and password are empty
		if (userid == '' || password == '') {
			console.log('Empty user id or password...');
		} else {
			event.preventDefault();
			// Redirect on this page but with the parameters in the url
			let check = MAX_TOTAL_LOGIN_ATTEMPTS_IN_CASE_OF_ERROR;
			if (params.has('check')) {
				check = params.get('check');
				check = parseInt(check);
				if (check == 0) {
					check = MAX_TOTAL_LOGIN_ATTEMPTS_IN_CASE_OF_ERROR;
				}
			}
			// Wait some time before trying to log back in
			reload_page_in_case_of_error(userid, password, check);
		}
	});
	// Add event listener to "show-password" button
	document.getElementById('show-password').addEventListener('click', function (event) {
		// Get the password input field
		let password_input = document.getElementById('password');
		// Check if the password is already shown
		if (password_input.type == 'password') {
			// Show the password
			password_input.type = 'text';
		} else {
			// Hide the password
			password_input.type = 'password';
		}
	});
});
function login(userid, password) {
	// Make a request to the API "https://iliad-unofficial-api.glitch.me/login/?userid={userid}&password={password}" using a proxy to bypass CORS policy
	// Use api.allorigins.win to bypass CORS policy
	let url = 'https://iliad-unofficial-api.glitch.me/login/?userid=' + userid + '&password=' + password;
	console.log("Trying to access URL: " + url);
	fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`)
		.then(response => {
			if (response.ok) return response.json()
			throw new Error('Network response was not ok.')
		})
		.then(data => {
			// Check JSON response
			let response = JSON.parse(data.contents);
			if (response.status == 'ok' || response.status == 'success') {
				// Received a valid response
				let token = response.data.token;
				if (token) {
					// Set variables
					username = response.data.name;
					user_id = response.data.id;
					number = response.data.number;
					// Save the token in the local storage
					if (USE_SESSION_STORAGE) sessionStorage.setItem('token', token);
					console.log("Token received: " + token);
					console.log("ID utente: " + user_id);
					console.log("Utente: " + username);
					console.log("Numero: " + number);
					// Use the token to get the credit
					use_token(token);
				} else {
					// Response does not contain token (user id and password are probably wrong)
					console.log("Token not found in response...");
					// Reload the page with parameter "check=0" to go back to the login page (since the user id or password are for sure wrong in this case)
					reload_page_in_case_of_error(userid, password, 0);
				}
			} else {
				// Received an invalid response
				console.log(response);
				if (RECOVER_ERRORS) {
					recover_error();
				} else {
					let alert_text = "ERRORE (in 'login(...)' from 'iliad-unofficial-api'):\n" + response.status + "\n\n" + response.message;
					alert(alert_text);
				}
			}
		})
		.catch(error => {
			// Received an error
			console.log(error);
			if (RECOVER_ERRORS) {
				recover_error();
			} else {
				let alert_text = "ERRORE (in 'login(...)' from 'api.allorigins.win':\n" + error.message;
				alert(alert_text);
			}
		});

}
function use_token(token) {
	// Make a request to same API but with "/credit/get/?token={token}&type=italy"
	let url = 'https://iliad-unofficial-api.glitch.me/credit/get/?token=' + token + '&type=italy';
	console.log("Trying to access URL: " + url);
	fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`)
		.then(response => {
			if (response.ok) return response.json()
			throw new Error('Network response was not ok.')
		})
		.then(data => {
			// Check JSON response
			let response = JSON.parse(data.contents);
			if (response.status == 'ok' || response.status == 'success') {
				// Received a valid response
				credit = response.data.credit;
				renewal = response.data.renewal;
				console.log("Credit: " + credit);
				console.log("Renewal: " + renewal);
				// Append the info to the body
				append_info();
			} else {
				// Received an invalid response
				console.log(response);
				if (RECOVER_ERRORS) {
					recover_error();
				} else {
					let alert_text = "ERRORE (in 'use_token(...)' from 'iliad-unofficial-api'):\n" + response.status + "\n\n" + response.message;
					alert(alert_text);
				}
			}
		})
		.catch(error => {
			// Received an error
			console.log(error);
			if (RECOVER_ERRORS) {
				recover_error();
			} else {
				let alert_text = "ERRORE (in 'use_token(...)' from 'api.allorigins.win':\n" + error.message;
				alert(alert_text);
			}
		});
}
function append_info() {
	// Remove any existing div with id "iliad-info"
	let old_div = document.getElementById('iliad-info');
	if (old_div) {
		old_div.remove();
	}
	// Append a div with id "iliad-info" to the body
	let div = document.createElement('div');
	div.id = 'iliad-info';
	div.style.display = 'none';
	document.body.appendChild(div);
	// Append the info to the div
	function create_info_div(id, text, textIsHTML = false) {
		let div = document.createElement('div');
		div.id = id;
		if (textIsHTML) {
			div.appendChild(text);
		} else {
			div.innerText = text;
		}
		return div;
	}
	// Prettify date in "DD/MM/YYYY" format into "DD Month YYYY"
	function prettify_date(date) {
		let date_split = date.split('/');
		let day = date_split[0];
		let month = date_split[1];
		let year = date_split[2];
		let months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
			'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
		return day + ' ' + months[month - 1] + ' ' + year;
	}
	// Prettify price, i.e. from NN.NN€ to an element with bigger font size for the integer part and a smaller font size for the decimal part, all preceded by the euro symbol
	function prettify_price(price) {
		let price_no_euro = price.replace('€', '');
		let price_split = price_no_euro.split('.');
		let integer = price_split[0];
		let decimal = price_split[1];
		let div = document.createElement('div');
		div.classList.add('price');
		let integer_span = document.createElement('span');
		integer_span.classList.add('integer');
		integer_span.innerText = integer;
		let decimal_span = document.createElement('span');
		decimal_span.classList.add('decimal');
		decimal_span.innerText = decimal;
		decimal_span.style.fontSize = '0.75em';
		div.appendChild(integer_span);
		div.appendChild(document.createTextNode('.'));
		div.appendChild(decimal_span);
		div.appendChild(document.createTextNode('€'));
		return div;
	}
	let info_div = document.getElementById('iliad-info');
	// NOTE: for some reason, the "iliad-unofficial-api" does not return username, user_id and number (as instead written in the API specification)...
	// info_div.appendChild(create_info_div('username', username));
	// info_div.appendChild(create_info_div('user-id', user_id));
	// info_div.appendChild(create_info_div('number', number));
	// Show main info
	info_div.appendChild(create_info_div('credit-name', "Credito:"));
	// info_div.appendChild(create_info_div('credit', prettify_price(credit), true));
	let credit_string = "€" + credit.replace('.', ',').replace('€', '');
	info_div.appendChild(create_info_div('credit', credit_string));
	info_div.appendChild(create_info_div('renewal-name', "Rinnovo:"));
	info_div.appendChild(create_info_div('renewal', prettify_date(renewal)));
	// Hide the login form and show the info
	document.getElementById('login-form').style.display = 'none';
	document.getElementById('loading').style.display = 'none';
	info_div.style.display = 'block';
}
function recover_error() {
	// If we have userid, password and check parameters in URL, reload the page with same parameters and check parameter to [check]-1
	let params = new URLSearchParams(window.location.search);
	if (params.has('userid') && params.has('password') && params.has('check')) {
		let userid = params.get('userid');
		let password = params.get('password');
		let check = params.get('check');
		check = parseInt(check);
		check -= 1;
		// wait 1 second before redirecting
		reload_page_in_case_of_error(userid, password, check);
	}
}
function reload_page_in_case_of_error(user_id, password, check_vaule) {
	// Waits for longer and longer the more attempts are made (before reloading page in case of error)
	let min_time_to_wait = 500;
	let max_time_to_wait = 3000;
	let time_to_wait = min_time_to_wait + (max_time_to_wait - min_time_to_wait) * (MAX_TOTAL_LOGIN_ATTEMPTS_IN_CASE_OF_ERROR - check_vaule) / MAX_TOTAL_LOGIN_ATTEMPTS_IN_CASE_OF_ERROR;
	setTimeout(function () {
		window.location.href = 'index.html?userid=' + user_id + '&password=' + password + '&check=' + check_vaule;
	}, time_to_wait);
}
