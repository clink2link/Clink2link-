<?php

$code = $_GET['code'] ?? '';

if ($code == '') {
    header("Location: /");
    exit;
}

header("Location: /task1.html?code=" . urlencode($code));
exit;

?>
