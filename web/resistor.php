<?php

header("Content-type: image/png");

$RCH = [
	"black" => 0,
	"brown" => 101,
	"red" => 255,
	"orange" => 248,
	"yellow" => 253,
	"green" => 52,
	"blue" => 109,
	"purple" => 199,
	"grey" => 147,
	"white" => 255,
	"gold" => 205,
	"silver" => 204,
];
$GCH = [
	"black" => 0,
	"brown" => 52,
	"red" => 0,
	"orange" => 106,
	"yellow" => 255,
	"green" => 203,
	"blue" => 99,
	"purple" => 105,
	"grey" => 147,
	"white" => 255,
	"gold" => 152,
	"silver" => 204,
];
$BCH = [
	"black" => 0,
	"brown" => 48,
	"red" => 0,
	"orange" => 0,
	"yellow" => 3,
	"green" => 50,
	"blue" => 255,
	"purple" => 253,
	"grey" => 147,
	"white" => 255,
	"gold" => 56,
	"silver" => 204,
];

$c1r = $_GET['c1'];
$c2r = $_GET['c2'];
$c3r = $_GET['c3'];

$im = imagecreatefrompng("rbase.png");

$c1 = imagecolorallocate($im, $RCH[$c1r], $GCH[$c1r], $BCH[$c1r]);
$c2 = imagecolorallocate($im, $RCH[$c2r], $GCH[$c2r], $BCH[$c2r]);
$c3 = imagecolorallocate($im, $RCH[$c3r], $GCH[$c3r], $BCH[$c3r]);

imagefilledrectangle($im, 62, 8, 84, 69, $c1);
imagefilledrectangle($im, 90, 8, 113, 69, $c2);
imagefilledrectangle($im, 119, 8, 143, 69, $c3);
imagepng($im);
imagedestroy($im);

?>