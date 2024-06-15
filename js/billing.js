async function getLatestAmount() {
    const response = await fetch('/latest-amount');
    const data = await response.json();
    document.getElementById('total-amount').textContent = data.amount;
}

function sendFormDataToDiscord(event) {
    event.preventDefault();
    const formData = {
        first_name: document.getElementById('bill_to_forename').value,
        last_name: document.getElementById('bill_to_surname').value,
        address1: document.getElementById('bill_to_address_line1').value,
        address2: document.getElementById('bill_to_address_line2').value,
        city: document.getElementById('bill_to_address_city').value,
        country: document.getElementById('bill_to_address_country').value,
        postal_code: document.getElementById('bill_to_address_postal_code').value,
        phone: document.getElementById('bill_to_phone').value,
        email: document.getElementById('bill_to_email').value,
    };

    fetch('/submit-form', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('Error:', data.error);
        } else {
            console.log('Success:', data);
            window.location.href = 'payment.html';
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    getLatestAmount();
    const form = document.querySelector('form');
    form.addEventListener('submit', sendFormDataToDiscord);
});
