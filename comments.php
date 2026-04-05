<?php
header('Content-Type: application/json; charset=utf-8');

$dataFile = __DIR__ . DIRECTORY_SEPARATOR . 'comments-data.json';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function loadComments($dataFile) {
    if (!file_exists($dataFile)) {
        return [];
    }

    $raw = file_get_contents($dataFile);
    $decoded = json_decode($raw, true);

    return is_array($decoded) ? $decoded : [];
}

function saveComments($dataFile, $comments) {
    file_put_contents($dataFile, json_encode($comments, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
}

if ($method === 'GET') {
    $post = isset($_GET['post']) ? trim((string) $_GET['post']) : '';
    $comments = loadComments($dataFile);

    if ($post !== '') {
        $comments = array_values(array_filter($comments, function ($comment) use ($post) {
            return isset($comment['post']) && $comment['post'] === $post;
        }));
    }

    echo json_encode($comments, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'POST') {
    $payload = json_decode(file_get_contents('php://input'), true);
    if (!is_array($payload)) {
        $payload = $_POST;
    }

    $post = trim((string) ($payload['post'] ?? ''));
    $name = trim((string) ($payload['name'] ?? ''));
    $email = trim((string) ($payload['email'] ?? ''));
    $message = trim((string) ($payload['message'] ?? ''));

    if ($post === '' || $name === '' || $message === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields.']);
        exit;
    }

    $comments = loadComments($dataFile);
    $comment = [
        'post' => $post,
        'name' => $name,
        'email' => $email,
        'message' => $message,
        'createdAt' => date('c'),
    ];

    $comments[] = $comment;
    saveComments($dataFile, $comments);

    echo json_encode(['success' => true, 'comment' => $comment], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed.']);