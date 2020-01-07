<?php

$DB_FNAME = dirname(__FILE__) . '/_db/urkunden';

$DB = file_get_contents($DB_FNAME . '.json');

// process the Save request: create a versioned copy of the DB and save the current state

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $js = file_get_contents('php://input');
    $rev_fname = $DB_FNAME . '.' . date('Y-m-d-H-i-s');
    file_put_contents($rev_fname. '.json', $js);
    file_put_contents($DB_FNAME. '.json', $js);
    echo json_encode(array('saved' => 1));
    die;
}
?>

<meta charset="utf8">
<script src="index.js"></script>
<link rel="stylesheet" href="index.css"/>
<script>
    window.DB = <?php echo $DB ?>
</script>
<div id="top"></div>
<div id="content" class="c_tabx"></div>
