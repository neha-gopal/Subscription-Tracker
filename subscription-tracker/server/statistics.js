const statusText = document.getElementById('statsStatus');
const statsList = document.getElementById('statsSubscriptionList');
const monthlyTotal = document.getElementById('monthlyTotal');
const yearlyTotal = document.getElementById('yearlyTotal');
const subscriptionCount = document.getElementById('subscriptionCount');

function setStatsStatus(message, isError = false) {
    statusText.textContent = message;
    statusText.style.color = isError ? '#b00020' : '#1e6b52';
}

async function loadStatistics() {
    const response = await fetch('/api/statistics');
    const data = await response.json();

    if (!response.ok) {
        setStatsStatus(data.error || 'Could not load statistics.', true);
        return;
    }

    subscriptionCount.textContent = data.count;
    monthlyTotal.textContent = `$${data.totalMonthly.toFixed(2)}`;
    yearlyTotal.textContent = `$${data.totalYearly.toFixed(2)}`;

    statsList.innerHTML = '';
    data.subscriptions.forEach((subscription) => {
        const item = document.createElement('li');
        const noticeDate = new Date(subscription.noticeDate).toLocaleDateString();
        item.textContent = `${subscription.name} (${subscription.tier}) — $${subscription.monthlyCost.toFixed(2)}/month — reminder: ${noticeDate}`;
        statsList.appendChild(item);
    });

    if (!data.subscriptions.length) {
        statsList.innerHTML = '<li>No subscription data yet.</li>';
    }

    setStatsStatus('Statistics loaded.');
}

loadStatistics();
