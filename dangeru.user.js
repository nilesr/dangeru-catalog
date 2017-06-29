// ==UserScript==
// @name 		danger/u/ catalog
// @namespace 	https://niles.xyz
// @include 	http://boards.dangeru.us/*
// @include 	https://boards.dangeru.us/*
// @version		1.0
// @grant 		GM_getValue
// @grant 		GM_setValue
// @run-at 		document-end
// ==/UserScript==
var started = false;
var onload = function () {

	// Only start once
	if (started) {
		return;
	}
	started = true;

	var href = document.location.href;
	href = href.substr(0, href.lastIndexOf("/"));
	var board = href.substr(href.lastIndexOf("/") + 1);
	var as = document.getElementsByTagName("a");
	for (var i = 0; i < as.length; i++) {
		var a = as[i];
		if (a.href.indexOf("thread.php") < 0) {
			continue;
		}

		var idx = a.href.indexOf("thread.php");
		while (a.href[idx] != "=") idx++;
		var id = a.href.substr(idx + 1);
		var titlekey = board + ":" + id + ":title";
		var saved_title = GM_getValue(titlekey, id);

		if (a.innerHTML.trim().length === 0) {
			a.innerHTML = "<span style='color: grey;'>Thread " + saved_title + " deleted</span>";
			continue;
		}
		GM_setValue(titlekey, a.innerHTML.trim());
		the_fn(board, a, id);
	}

};

var the_fn = (function the_fn(board, a, id) {

	var elem = document.createElement("span");
	a.appendChild(elem);
	elem.innerHTML = "Loading...";

	var xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function() {
		if(xmlHttp.readyState == 4 && xmlHttp.status == 200) {
			var jsontext = xmlHttp.responseText;
			jsontext = jsontext.replace(/(?:\r\n|\r|\n)/g, " ");
			var idx = jsontext.indexOf("https://boards.dangeru.us/static");
			while (jsontext[idx] != '}') idx++;
			var b = jsontext.slice(0, idx) + '"' + jsontext.slice(idx);
			var key = board + ":" + id;
			var oldreplies = GM_getValue(key, 0);
			try {
				var json = JSON.parse(b);
				var replies = json.replies.length;
				if (oldreplies < replies) {
					elem.innerHTML = "<span style='color:red;'>+" + (replies - oldreplies) + "</span>";
					// we have to wrap this in a closure because otherwise it clicking any post would only update the last post processed in this loop
					the_other_fn(key, replies, a, elem);
				} else {
					elem.innerHTML = "<span style='color: grey;'>" + replies + "</span>";
				}

			} catch (e) {
				elem.innerHTML = "Error.";
				console.log(e);
			}
		}
	};
	xmlHttp.open("GET", "https://boards.dangeru.us/api.php?type=thread&board=" + board + "&ln=250&thread=" + id, true); // true for asynchronous
	xmlHttp.send(null);
});

var the_other_fn = (function(key, replies, a, elem) {
	a.addEventListener("click", function() {
		GM_setValue(key, replies);
		elem.innerHTML = "<span style='color: grey;'>" + replies + "</span>";
	});
});


// In chrome, the userscript runs in a sandbox, and will never see these events
// Hence the run-at document-end
//document.addEventListener('DOMContentLoaded', onload);
//document.onload = onload;

// One of these should work, and the started variable should prevent it from starting twice (I hope)
function GM_main() {
	onload();
}
onload();

