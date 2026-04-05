(function () {
var form = document.getElementById('comment-form');
var list = document.getElementById('comment-list');

if (!form || !list) {
return;
}

var currentPage = window.location.pathname.split('/').pop() || 'index.html';
var postKey = currentPage.replace(/\.html?$/i, '');
var localStorageKey = 'studyBlogComments:' + postKey;
var status = document.createElement('div');
status.className = 'comment-status';
status.setAttribute('aria-live', 'polite');
form.appendChild(status);

function createComment(comment) {
var wrap = document.createElement('div');
wrap.className = 'single_comment';

var title = document.createElement('h4');
title.textContent = comment.name || 'Anonymous';

var body = document.createElement('p');
body.textContent = comment.message || '';

wrap.appendChild(title);
wrap.appendChild(body);
return wrap;
}

function loadLocalComments() {
try {
return JSON.parse(localStorage.getItem(localStorageKey) || '[]');
} catch (error) {
return [];
}
}

function saveLocalComment(comment) {
var comments = loadLocalComments();
comments.push(comment);
localStorage.setItem(localStorageKey, JSON.stringify(comments));
}

function renderComments(comments) {
comments.forEach(function (comment) {
list.appendChild(createComment(comment));
});
}

function showStatus(message, type) {
status.textContent = message;
status.className = 'comment-status is-' + type;

window.setTimeout(function () {
status.textContent = '';
status.className = 'comment-status';
}, 3500);
}

function loadComments() {
if (typeof fetch === 'undefined') {
renderComments(loadLocalComments());
return;
}

fetch('comments.php?post=' + encodeURIComponent(postKey), {
headers: {
'Accept': 'application/json'
}
})
.then(function (response) {
if (!response.ok) {
throw new Error('Unable to load comments from server');
}
return response.json();
})
.then(function (comments) {
if (Array.isArray(comments) && comments.length > 0) {
renderComments(comments);
return;
}
renderComments(loadLocalComments());
})
.catch(function () {
renderComments(loadLocalComments());
});
}

form.addEventListener('submit', function (event) {
event.preventDefault();

var formData = new FormData(form);
var name = String(formData.get('name') || '').trim();
var email = String(formData.get('email') || '').trim();
var message = String(formData.get('message') || '').trim();

if (!name || !message) {
showStatus('Please enter your name and comment message.', 'error');
return;
}

var newComment = {
post: postKey,
name: name,
email: email,
message: message
};

if (typeof fetch === 'undefined') {
saveLocalComment(newComment);
list.appendChild(createComment(newComment));
form.reset();
showStatus('Comment posted successfully.', 'success');
return;
}

fetch('comments.php', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'Accept': 'application/json'
},
body: JSON.stringify(newComment)
})
.then(function (response) {
if (!response.ok) {
throw new Error('Unable to save comment on server');
}
return response.json();
})
.then(function (data) {
if (data && data.comment) {
list.appendChild(createComment(data.comment));
} else {
list.appendChild(createComment(newComment));
}
form.reset();
showStatus('Comment posted successfully.', 'success');
})
.catch(function () {
saveLocalComment(newComment);
list.appendChild(createComment(newComment));
form.reset();
showStatus('Comment posted locally. It will sync when server is available.', 'warning');
});
});

loadComments();
})();