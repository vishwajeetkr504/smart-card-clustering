let distChartInstance = null;
let profileChartInstance = null;

document.getElementById('refreshBtn').addEventListener('click', loadAnalyticsData);

window.addEventListener('DOMContentLoaded', loadAnalyticsData);

function loadAnalyticsData() {
    const btn = document.getElementById('refreshBtn');
    btn.innerText = "Analyzing Matrix...";
    btn.disabled = true;

    fetch('/api/analytics')
        .then(response => response.json())
        .then(data => {
            if(data.success) {
                updateDashboard(data.summary);
            } else {
                alert("Error in pipeline process: " + data.error);
            }
        })
        .catch(err => {
            console.error("Pipeline breakdown:", err);
            alert("Failed to reach Python analysis backend server.");
        })
        .finally(() => {
            btn.innerText = "Run Live Analytics";
            btn.disabled = false;
        });
}

function updateDashboard(summary) {
    
    document.getElementById('totalCustomers').innerText = summary.total_customers.toLocaleString();
    document.getElementById('numClusters').innerText = summary.num_clusters;

    // Pie Chart
    const distCtx = document.getElementById('distributionChart').getContext('2d');
    if(distChartInstance) distChartInstance.destroy(); // Clear old memory context
    
    distChartInstance = new Chart(distCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(summary.cluster_distribution),
            datasets: [{
                data: Object.values(summary.cluster_distribution),
                backgroundColor: ['#6366f1', '#a855f7', '#ec4899', '#f59e0b'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#9ca3af' } }
            }
        }
    });

    //  Render Grouped Bar Chart
    const profCtx = document.getElementById('profileChart').getContext('2d');
    if(profileChartInstance) profileChartInstance.destroy();

    const clusters = Object.keys(summary.profiles);
    const avgBalances = clusters.map(c => summary.profiles[c].avg_balance);
    const avgPurchases = clusters.map(c => summary.profiles[c].avg_purchases);
    const avgLimits = clusters.map(c => summary.profiles[c].avg_credit_limit);

    profileChartInstance = new Chart(profCtx, {
        type: 'bar',
        data: {
            labels: clusters,
            datasets: [
                { label: 'Avg Balance', data: avgBalances, backgroundColor: '#6366f1' },
                { label: 'Avg Purchases', data: avgPurchases, backgroundColor: '#a855f7' },
                { label: 'Avg Credit Limit', data: avgLimits, backgroundColor: '#ec4899' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { display: false }, ticks: { color: '#9ca3af' } },
                y: { grid: { color: '#374151' }, ticks: { color: '#9ca3af' } }
            },
            plugins: {
                legend: { position: 'bottom', labels: { color: '#9ca3af' } }
            }
        }
    });

    
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = ""; 

    summary.sample_rows.forEach(row => {
        
        const balance = row.BALANCE ? parseFloat(row.BALANCE).toFixed(2) : '0.00';
        const purchases = row.PURCHASES ? parseFloat(row.PURCHASES).toFixed(2) : '0.00';
        const limit = row.CREDIT_LIMIT ? parseFloat(row.CREDIT_LIMIT).toFixed(2) : '0.00';
        const payments = row.PAYMENTS ? parseFloat(row.PAYMENTS).toFixed(2) : '0.00';

        
        const badgeColors = ['bg-indigo-500/10 text-indigo-400 border-indigo-500/20', 'bg-purple-500/10 text-purple-400 border-purple-500/20', 'bg-pink-500/10 text-pink-400 border-pink-500/20', 'bg-amber-500/10 text-amber-400 border-amber-500/20'];
        const currentBadge = badgeColors[row.Cluster] || 'bg-gray-500/10 text-gray-400';

        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-700/20 transition-colors duration-150";
        tr.innerHTML = `
            <td class="px-6 py-3.5 font-mono text-xs text-gray-400">${row.CUST_ID}</td>
            <td class="px-6 py-3.5">$${balance}</td>
            <td class="px-6 py-3.5">$${purchases}</td>
            <td class="px-6 py-3.5">$${limit}</td>
            <td class="px-6 py-3.5">$${payments}</td>
            <td class="px-6 py-3.5 text-right">
                <span class="inline-flex px-2.5 py-1 text-xs font-semibold tracking-wide border rounded-full ${currentBadge}">
                    Cluster ${row.Cluster}
                </span>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}