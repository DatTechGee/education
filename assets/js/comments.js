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
status.setAttribute('role', 'status');
form.appendChild(status);

function getInitials(name) {
var cleanName = String(name || '').trim();
if (!cleanName) {
return 'A';
}

var parts = cleanName.split(/\s+/).slice(0, 2);
return parts.map(function (part) {
return part.charAt(0).toUpperCase();
}).join('');
}

function createComment(comment) {
var wrap = document.createElement('div');
wrap.className = 'single_comment';

var avatar = document.createElement('div');
avatar.className = 'single_comment_avatar';
avatar.textContent = getInitials(comment.name);

var content = document.createElement('div');
content.className = 'single_comment_content';

var title = document.createElement('h4');
title.textContent = comment.name || 'Anonymous';

var body = document.createElement('p');
body.textContent = comment.message || '';

content.appendChild(title);
content.appendChild(body);
wrap.appendChild(avatar);
wrap.appendChild(content);
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
status.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
status.setAttribute('role', type === 'error' ? 'alert' : 'status');

window.setTimeout(function () {
status.textContent = '';
status.className = 'comment-status';
status.setAttribute('aria-live', 'polite');
status.setAttribute('role', 'status');
}, 3500);
}

function getServerErrorMessage(response) {
return response.json().then(function (data) {
if (data && data.error) {
throw new Error(String(data.error));
}
throw new Error('Unable to complete this request right now.');
}, function () {
throw new Error('Unable to complete this request right now.');
});
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
return getServerErrorMessage(response);
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
showStatus('Could not load comments from server. Showing locally saved comments.', 'warning');
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
return getServerErrorMessage(response);
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
showStatus(' your comment was saved .', 'success');
});
});

loadComments();
})();