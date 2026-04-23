const planCatalog = {
    basicNetflix: { name: 'Netflix', tier: 'Basic', monthlyCost: 6.99, category: 'Streaming' },
    standardNetflix: { name: 'Netflix', tier: 'Standard', monthlyCost: 15.49, category: 'Streaming' },
    premiumNetflix: { name: 'Netflix', tier: 'Premium', monthlyCost: 22.99, category: 'Streaming' },
    adSupportedHulu: { name: 'Hulu', tier: 'Ad Supported', monthlyCost: 9.99, category: 'Streaming' },
    withAds: { name: 'HBO Max', tier: 'With Ads', monthlyCost: 9.99, category: 'Streaming' },
    standardDisneyPlus: { name: 'Disney Plus', tier: 'Standard', monthlyCost: 9.99, category: 'Streaming' },
    standardYoutubePremium: { name: 'YouTube Premium', tier: 'Standard', monthlyCost: 13.99, category: 'Streaming' },
    standardAppleTv: { name: 'Apple TV+', tier: 'Standard', monthlyCost: 9.99, category: 'Streaming' },
    individualSpotify: { name: 'Spotify', tier: 'Individual', monthlyCost: 11.99, category: 'Music' },
    studentAppleMusic: { name: 'Apple Music', tier: 'Student', monthlyCost: 5.99, category: 'Music' },
    premiumGrammarly: { name: 'Grammarly', tier: 'Premium', monthlyCost: 12.0, category: 'Productivity' },
    singleAppAdobe: { name: 'Adobe Creative Cloud', tier: 'Single App', monthlyCost: 22.99, category: 'Productivity' },
    standardAmazonPrime: { name: 'Amazon Prime', tier: 'Standard', monthlyCost: 14.99, category: 'Shopping' },
    classicDiscordNitro: { name: 'Discord Nitro', tier: 'Classic', monthlyCost: 4.99, category: 'Communication' },
};

const subscriptionList = document.getElementById('savedSubscriptions');
const pageStatus = document.getElementById('subscriptionStatus');
const customForm = document.getElementById('customSubscriptionForm');

function setStatus(message, isError = false) {
    pageStatus.textContent = message;
    pageStatus.style.color = isError ? '#b00020' : '#1e6b52';
}

function toggleModal(triggerClass, closeClass, backgroundId) {
    const trigger = document.getElementsByClassName(triggerClass)[0];
    const close = document.getElementsByClassName(closeClass)[0];
    const background = document.getElementById(backgroundId);

    if (trigger) {
        trigger.addEventListener('click', function () {
            background.style.display = 'flex';
        });
    }

    if (close) {
        close.addEventListener('click', function () {
            background.style.display = 'none';
        });
    }
}

[
    ['netflix', 'close3', 'background3'],
    ['hboMax', 'close4', 'background4'],
    ['disneyPlus', 'close5', 'background5'],
    ['youtubePremium', 'close6', 'background6'],
    ['appleTv', 'close7', 'background7'],
    ['spotify', 'close8', 'background8'],
    ['appleMusic', 'close9', 'background9'],
    ['grammarly', 'close10', 'background10'],
    ['adobe', 'close11', 'background11'],
    ['amazonPrime', 'close12', 'background12'],
    ['discordNitro', 'close13', 'background13'],
    ['hulu', 'close14', 'background14'],
    ['pinkButtonSubscription', 'close15', 'background15'],
].forEach(([triggerClass, closeClass, backgroundId]) => toggleModal(triggerClass, closeClass, backgroundId));

async function saveSubscription(payload) {
    const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Could not save subscription.');
    }

    return data;
}

async function deleteSubscription(id) {
    const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'DELETE',
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Could not delete subscription.');
    }
}

function renderSubscriptions(subscriptions) {
    subscriptionList.innerHTML = '';

    if (!subscriptions.length) {
        subscriptionList.innerHTML = '<li>No subscriptions saved yet.</li>';
        return;
    }

    subscriptions.forEach((subscription) => {
        const item = document.createElement('li');
        item.className = 'saved-subscription-item';
        item.innerHTML = `
            <strong>${subscription.name}</strong>
            <span>${subscription.tier} — $${Number(subscription.monthlyCost).toFixed(2)}/month</span>
            <button data-id="${subscription._id}" class="delete-subscription-button">Delete</button>
        `;
        subscriptionList.appendChild(item);
    });

    document.querySelectorAll('.delete-subscription-button').forEach((button) => {
        button.addEventListener('click', async () => {
            try {
                await deleteSubscription(button.dataset.id);
                setStatus('Subscription removed.');
                await loadSubscriptions();
            } catch (error) {
                setStatus(error.message, true);
            }
        });
    });
}

async function loadSubscriptions() {
    const response = await fetch('/api/subscriptions');
    const data = await response.json();

    if (!response.ok) {
        renderSubscriptions([]);
        setStatus(data.error || 'Sign in to view your subscriptions.', true);
        return;
    }

    renderSubscriptions(data);
    setStatus('Subscriptions loaded.');
}

Object.keys(planCatalog).forEach((className) => {
    const button = document.getElementsByClassName(className)[0];
    if (!button) {
        return;
    }

    button.addEventListener('click', async () => {
        try {
            await saveSubscription(planCatalog[className]);
            setStatus(`${planCatalog[className].name} added.`);
            await loadSubscriptions();
        } catch (error) {
            setStatus(error.message, true);
        }
    });
});

customForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
        name: document.getElementById('customSubscriptionName').value,
        monthlyCost: document.getElementById('customSubscriptionCost').value,
        tier: 'Custom',
        category: 'Custom',
    };

    try {
        await saveSubscription(payload);
        setStatus(`${payload.name} added.`);
        customForm.reset();
        document.getElementById('background15').style.display = 'none';
        await loadSubscriptions();
    } catch (error) {
        setStatus(error.message, true);
    }
});

loadSubscriptions();
