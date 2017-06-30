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
			a.innerHTML = grey("Thread " + saved_title + " deleted");
			continue;
		}
		GM_setValue(titlekey, a.innerHTML.trim());

		var elem = document.createElement("span");
		a.appendChild(elem);
		elem.innerHTML = "Loading...";

		var key = board + ":" + id;
		var oldreplies = GM_getValue(key, 0);
		var closed = false;
		if (a.style.color.trim().length > 0) {
			// post is closed.
			closed = true;
		}
		var closedkey = key + ":closed_replies";
		if (!closed) {
			xhr_and_key(board, a, id, key, oldreplies, closed, elem, closedkey);
		} else {
			var closedreplies = GM_getValue(closedkey, "no");
			if (closedreplies === "no") {
				xhr_and_key(board, a, id, key, oldreplies, closed, elem, closedkey);
			} else {
				comparison_and_update_elem(key, closedreplies, a, elem, closed, oldreplies);
				//elem.innerHTML = elem.innerHTML + " (cached)"; // debug
			}
		}
	}

};

var grey = function grey(text) {
	return color("grey", text);
};
var red = function red(text) {
	return color("red", text);
};
var color = function color(c, text) {
	return "<span style='color: " + c + ";'>" + text + "</span>";
};

var xhr_and_key = (function xhr_and_key(board, a, id, key, oldreplies, closed, elem, closedkey) {

	var xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function() {
		if(xmlHttp.readyState == 4 && xmlHttp.status == 200) {
			var jsontext = xmlHttp.responseText;
			jsontext = jsontext.replace(/(?:\r\n|\r|\n)/g, " ");
			var idx = jsontext.indexOf("https://boards.dangeru.us/static");
			while (jsontext[idx] != '}') idx++;
			var b = jsontext.slice(0, idx) + '"' + jsontext.slice(idx);
			try {
				var json = JSON.parse(b);
				var replies = json.replies.length;
				comparison_and_update_elem(key, replies, a, elem, closed, oldreplies);
				if (closed) {
					GM_setValue(closedkey, replies);
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

var comparison_and_update_elem = function(key, replies, a, elem, closed, oldreplies) {
	if (oldreplies < replies) {
		elem.innerHTML = red("+" + (replies - oldreplies));
		// we have to wrap this in a closure because otherwise it clicking any post would only update the last post processed in this loop
		set_onclick_listener(key, replies, a, elem, closed);
	} else {
		elem.innerHTML = grey(replies);
	}
};

var set_onclick_listener = function set_onclick_listener(key, replies, a, elem, closed) {
	a.addEventListener("click", function() {
		GM_setValue(key, replies);
		elem.innerHTML = grey(replies);
	});
};


// In chrome, the userscript runs in a sandbox, and will never see these events
// Hence the run-at document-end
//document.addEventListener('DOMContentLoaded', onload);
//document.onload = onload;

// One of these should work, and the started variable should prevent it from starting twice (I hope)
function GM_main() {
	onload();
}
onload();

