<?php
header('Content-Type: application/json');

function get_latest_amount_from_discord($channel_id, $bot_token) {
    $url = "https://discord.com/api/v10/channels/$channel_id/messages?limit=10";
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Content-Type: application/json',
        'Authorization: Bot ' . $bot_token
    ));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    if (curl_errno($ch)) {
        echo json_encode(['error' => 'Curl error: ' . curl_error($ch)]);
        return;
    }
    curl_close($ch);

    $messages = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode(['error' => 'JSON decode error: ' . json_last_error_msg()]);
        return;
    }

    foreach ($messages as $message) {
        if (isset($message['content']) && strpos($message['content'], 'Captured amount:') !== false) {
            preg_match('/Captured amount: ([\d.]+)/', $message['content'], $matches);
            if (isset($matches[1])) {
                echo json_encode(['amount' => $matches[1]]);
                return;
            }
        }
    }

    echo json_encode(['amount' => null]);
}

$channel_id = "1246523057917530204";
$bot_token = "MTIyMDMzNzQ0MTk5MTU2MTI1Ng.GcSMeC.4YqEy_9xBEHLjjn8urmSNAuDTvAY8LFQqkg26s";
get_latest_amount_from_discord($channel_id, $bot_token);
?>
