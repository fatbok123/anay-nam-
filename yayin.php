<?php
// Hedef URL (Site değiştikçe burayı güncelle)
$url = "https://24taraftarium9.xyz/player.php?id=b1&ch=b1";

// Curl ile siteye sahte kimlik gönderiyoruz
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

// BURASI KRİTİK: Kendimizi o sitenin içinden geliyormuş gibi gösteriyoruz
curl_setopt($ch, CURLOPT_REFERER, "https://24taraftarium9.xyz/");
curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

$content = curl_exec($ch);
curl_close($ch);

// Çekilen içeriği ekrana bas
echo $content;
?>
