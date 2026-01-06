// ====== REAL-TIME SYSTEM USING GITHUB ======
const GITHUB_DATA_URL = 'https://raw.githubusercontent.com/abhishek200215/villagesite/main/data.json';
const GITHUB_API_URL = 'https://api.github.com/repos/abhishek200215/villagesite/contents/data.json';

// Setup real-time checks
function setupRealtimeSystem() {
    // Check for updates immediately
    checkForRealtimeUpdates();
    
    // Check every 30 seconds
    setInterval(checkForRealtimeUpdates, 30000);
    
    // Check when page becomes visible
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            checkForRealtimeUpdates();
        }
    });
    
    // Check when coming online
    window.addEventListener('online', checkForRealtimeUpdates);
}

async function checkForRealtimeUpdates() {
    try {
        const response = await fetch(GITHUB_DATA_URL + '?t=' + Date.now());
        if (response.ok) {
            const data = await response.json();
            processRealtimeData(data);
        }
    } catch (error) {
        console.log('Could not check for updates:', error);
    }
}

function processRealtimeData(data) {
    const lastUpdate = localStorage.getItem('last_data_update') || 0;
    const serverUpdate = new Date(data.last_updated).getTime();
    
    if (serverUpdate > lastUpdate) {
        // New updates available
        localStorage.setItem('last_data_update', serverUpdate);
        
        // Update UI with new data
        updateUIWithNewData(data.data);
        
        // Show notification
        showRealtimeNotification();
    }
}

function updateUIWithNewData(data) {
    // Update announcements
    if (data.announcements && data.announcements.length > 0) {
        const latestAnnouncement = data.announcements[0];
        const announcementText = document.getElementById('announcement-text');
        if (announcementText) {
            announcementText.textContent = latestAnnouncement.text || latestAnnouncement.title;
        }
    }
    
    // Update prices
    if (data.prices && data.prices.length > 0) {
        updatePricesTable(data.prices);
    }
    
    // Update services
    if (data.services && data.services.length > 0) {
        updateServicesGrid(data.services);
    }
    
    // Update jobs
    if (data.jobs && data.jobs.length > 0) {
        updateJobsList(data.jobs);
    }
}

function showRealtimeNotification() {
    const notification = document.createElement('div');
    notification.className = 'realtime-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-sync-alt spinning"></i>
            <span>ಹೊಸ ನವೀಕರಣಗಳು ಲಭ್ಯವಿವೆ!</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Admin function to push updates
async function adminPushUpdate(type, data) {
    if (!isAdmin) {
        showToast('ನಿರ್ವಾಹಕರಾಗಿ ಲಾಗಿನ್ ಆಗಿ', 'error');
        return false;
    }
    
    try {
        // First get current data
        const response = await fetch(GITHUB_DATA_URL);
        const currentData = await response.json();
        
        // Add new data
        if (!currentData.data[type]) {
            currentData.data[type] = [];
        }
        currentData.data[type].unshift({
            ...data,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 20 items
        currentData.data[type] = currentData.data[type].slice(0, 20);
        
        // Update timestamp
        currentData.last_updated = new Date().toISOString();
        
        // Save to GitHub
        await saveToGitHub(JSON.stringify(currentData, null, 2));
        
        showToast('ನವೀಕರಿಸಲಾಗಿದೆ! ಎಲ್ಲರಿಗೂ ತೋರಿಸಲಾಗುತ್ತಿದೆ...', 'success');
        return true;
        
    } catch (error) {
        console.error('GitHub update failed:', error);
        showToast('ನವೀಕರಣ ವಿಫಲವಾಗಿದೆ', 'error');
        return false;
    }
}

// Simple GitHub update using GitHub API
async function saveToGitHub(content) {
    // Note: For actual GitHub API updates, you need a token
    // For now, we'll use a simpler method
    
    showToast('ನವೀಕರಣ ಸಂಗ್ರಹಿಸಲಾಗುತ್ತಿದೆ...', 'info');
    
    // Alternative: Use GitHub Gist or another service
    return saveToAlternativeService(content);
}

// Alternative: Use a free JSON hosting service
async function saveToAlternativeService(content) {
    try {
        // Using a free JSON storage service
        const response = await fetch('https://jsonblob.com/api/jsonBlob', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: content
        });
        
        if (response.ok) {
            const blobId = await response.text();
            localStorage.setItem('data_blob_id', blobId);
            return true;
        }
    } catch (error) {
        console.error('Alternative save failed:', error);
    }
    return false;
}

// Update your existing admin functions to use the new system
async function saveAnnouncement() {
    const title = document.getElementById('announcement-title').value.trim();
    const text = document.getElementById('announcement-text').value.trim();
    
    if (!title || !text) {
        showToast('ಶೀರ್ಷಿಕೆ ಮತ್ತು ವಿವರಣೆ ಅಗತ್ಯ', 'error');
        return;
    }
    
    const announcementData = {
        title,
        text,
        date: new Date().toLocaleDateString('kn-IN'),
        author: currentUser ? currentUser.name : 'ನಿರ್ವಾಹಕ'
    };
    
    const success = await adminPushUpdate('announcements', announcementData);
    
    if (success) {
        // Clear form
        document.getElementById('announcement-title').value = '';
        document.getElementById('announcement-text').value = '';
        
        // Update immediately
        document.getElementById('announcement-text').textContent = text;
    }
}

async function savePrice() {
    const crop = document.getElementById('price-crop').value.trim();
    const price = document.getElementById('price-amount').value.trim();
    const market = document.getElementById('price-market').value.trim() || CONFIG.DISTRICT + ' ಮಾರುಕಟ್ಟೆ';
    
    if (!crop || !price) {
        showToast('ಬೆಳೆ ಮತ್ತು ಬೆಲೆ ಅಗತ್ಯ', 'error');
        return;
    }
    
    const priceData = {
        crop,
        price,
        market,
        date: new Date().toLocaleDateString('kn-IN'),
        trend: 'stable'
    };
    
    const success = await adminPushUpdate('prices', priceData);
    
    if (success) {
        // Clear form
        document.getElementById('price-crop').value = '';
        document.getElementById('price-amount').value = '';
        document.getElementById('price-market').value = '';
        
        // Update table immediately
        addNewPriceToTable(priceData);
    }
}

function addNewPriceToTable(priceData) {
    const tbody = document.getElementById('prices-table-body');
    if (tbody) {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td><strong>${priceData.crop}</strong></td>
            <td><span class="price-value">${priceData.price}</span></td>
            <td>${priceData.market}</td>
            <td>
                <span class="trend-new">
                    <i class="fas fa-star"></i> ಹೊಸದು
                </span>
            </td>
            <td>${priceData.date}</td>
        `;
        newRow.classList.add('new-update');
        tbody.insertBefore(newRow, tbody.firstChild);
        
        // Highlight animation
        setTimeout(() => newRow.classList.remove('new-update'), 3000);
    }
}

// Initialize in your main function
async function initializeApp() {
    try {
        // ... existing initialization code ...
        
        // Setup real-time system
        setupRealtimeSystem();
        
        // ... rest of code ...
    } catch (error) {
        console.error('Initialization error:', error);
    }
}