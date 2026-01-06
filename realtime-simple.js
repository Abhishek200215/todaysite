// Simple working real-time system
class SimpleRealtime {
    constructor() {
        this.dataUrl = 'https://abhishek200215.github.io/villagesite/data.json';
        this.lastUpdate = null;
        this.updateCallbacks = [];
    }
    
    start() {
        console.log('Starting real-time system...');
        
        // Check immediately
        this.checkForUpdates();
        
        // Check every 30 seconds
        setInterval(() => this.checkForUpdates(), 30000);
        
        // Check when tab becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkForUpdates();
            }
        });
    }
    
    async checkForUpdates() {
        try {
            // Add cache busting
            const response = await fetch(this.dataUrl + '?t=' + Date.now());
            
            if (response.ok) {
                const data = await response.json();
                this.handleNewData(data);
            }
        } catch (error) {
            console.log('Update check failed (offline?)');
        }
    }
    
    handleNewData(data) {
        const newTimestamp = data.last_updated;
        
        if (!this.lastUpdate || newTimestamp !== this.lastUpdate) {
            this.lastUpdate = newTimestamp;
            this.notifyAll(data.data);
            this.showUpdateNotification();
        }
    }
    
    notifyAll(data) {
        // Notify all registered callbacks
        this.updateCallbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Callback error:', error);
            }
        });
        
        // Update specific sections
        this.updateSpecificSections(data);
    }
    
    updateSpecificSections(data) {
        // Update announcement bar
        if (data.announcements && data.announcements.length > 0) {
            const latest = data.announcements[0];
            const el = document.getElementById('announcement-text');
            if (el) {
                el.textContent = latest.text || latest.title;
                el.classList.add('updated');
                setTimeout(() => el.classList.remove('updated'), 2000);
            }
        }
        
        // Add new prices to table
        if (data.prices && data.prices.length > 0) {
            this.updatePricesTable(data.prices);
        }
    }
    
    updatePricesTable(prices) {
        const tbody = document.getElementById('prices-table-body');
        if (!tbody) return;
        
        // Clear and rebuild table with new data
        let html = '';
        prices.slice(0, 10).forEach(price => {
            html += `
                <tr class="${price.isNew ? 'new-price' : ''}">
                    <td><strong>${price.crop}</strong></td>
                    <td><span class="price-value">${price.price}</span></td>
                    <td>${price.market}</td>
                    <td>
                        <span class="trend-${price.trend || 'stable'}">
                            <i class="fas fa-${this.getTrendIcon(price.trend)}"></i>
                            ${this.getTrendText(price.trend)}
                        </span>
                    </td>
                    <td>${price.date}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    }
    
    getTrendIcon(trend) {
        const icons = {
            'up': 'arrow-up',
            'down': 'arrow-down',
            'stable': 'minus',
            'new': 'star'
        };
        return icons[trend] || 'minus';
    }
    
    getTrendText(trend) {
        const texts = {
            'up': 'ಹೆಚ್ಚಳ',
            'down': 'ಕಡಿಮೆ',
            'stable': 'ಸ್ಥಿರ',
            'new': 'ಹೊಸದು'
        };
        return texts[trend] || 'ಸ್ಥಿರ';
    }
    
    showUpdateNotification() {
        // Create notification
        const notification = document.createElement('div');
        notification.className = 'live-update-notification';
        notification.innerHTML = `
            <div class="update-alert">
                <i class="fas fa-bell"></i>
                <span>ಹೊಸ ಮಾಹಿತಿ ನವೀಕರಿಸಲಾಗಿದೆ!</span>
                <button onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: linear-gradient(135deg, #4CAF50, #2E7D32);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 9999;
            animation: slideIn 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
        
        // Click to close
        notification.addEventListener('click', function(e) {
            if (e.target.tagName !== 'BUTTON') {
                this.remove();
            }
        });
    }
    
    onUpdate(callback) {
        this.updateCallbacks.push(callback);
    }
}

// Initialize
const realtime = new SimpleRealtime();

// Start when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        realtime.start();
    });
} else {
    realtime.start();
}

// Make globally available
window.simpleRealtime = realtime;