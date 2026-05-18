// Main JavaScript for LPU Food Ordering

document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart count
    updateCartCount();
    
    // Location sharing functionality
    initLocationSharing();
    
    // Order tracking
    initOrderTracking();
    
    // Admin functionality
    initAdminFeatures();
});

// Update cart count from session storage
function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (!cartCountElement) return;
    
    // Get cart from session storage or initialize empty
    let cart = JSON.parse(sessionStorage.getItem('lpu_cart') || '{}');
    let totalCount = 0;
    
    // Calculate total items in cart
    for (const shopId in cart) {
        for (const itemId in cart[shopId]) {
            totalCount += cart[shopId][itemId].quantity;
        }
    }
    
    cartCountElement.textContent = totalCount;
}

// Location sharing functionality
function initLocationSharing() {
    const locationButtons = document.querySelectorAll('.btn-location');
    
    locationButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (!navigator.geolocation) {
                alert('Geolocation is not supported by your browser');
                return;
            }
            
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting location...';
            
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    // Find the nearest address field
                    const addressField = document.getElementById('delivery-address') || 
                                         document.getElementById('address');
                    
                    if (addressField) {
                        addressField.value = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
                        addressField.placeholder = 'Add your room/hostel details after the coordinates';
                    }
                    
                    button.innerHTML = '<i class="fas fa-map-marker-alt"></i> Location Updated';
                    setTimeout(() => {
                        button.innerHTML = '<i class="fas fa-map-marker-alt"></i> Use Current Location';
                    }, 2000);
                },
                function(error) {
                    alert('Unable to get your location. Please enter manually.');
                    button.innerHTML = '<i class="fas fa-map-marker-alt"></i> Use Current Location';
                }
            );
        });
    });
}

// Order tracking with real-time updates
function initOrderTracking() {
    const orderStatusElements = document.querySelectorAll('.order-status');
    
    orderStatusElements.forEach(element => {
        const orderId = element.getAttribute('data-order-id');
        if (orderId) {
            startOrderTracking(orderId, element);
        }
    });
}

function startOrderTracking(orderId, element) {
    // Function to update order status
    function updateStatus() {
        fetch(`/api/orders/${orderId}/status`)
            .then(response => response.json())
            .then(data => {
                if (data.status) {
                    element.innerHTML = `
                        <span class="status-badge ${data.status}">${data.status.toUpperCase()}</span>
                        <small>Updated just now</small>
                    `;
                }
            })
            .catch(error => {
                console.error('Error updating order status:', error);
            });
    }
    
    // Update immediately
    updateStatus();
    
    // Update every 30 seconds
    setInterval(updateStatus, 30000);
}

// Admin functionality
function initAdminFeatures() {
    // Shop approval system
    const approveButtons = document.querySelectorAll('.btn-approve-shop');
    
    approveButtons.forEach(button => {
        button.addEventListener('click', function() {
            const shopId = this.getAttribute('data-shop-id');
            
            if (confirm('Approve this shop to start accepting orders?')) {
                fetch(`/api/shops/${shopId}/approve`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': getCSRFToken()
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('Shop approved successfully!');
                        location.reload();
                    } else {
                        alert('Error: ' + data.error);
                    }
                });
            }
        });
    });
    
    // Order status update for admin
    const statusUpdateButtons = document.querySelectorAll('.btn-update-status');
    
    statusUpdateButtons.forEach(button => {
        button.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            const newStatus = prompt('Enter new status (placed/preparing/ready/on_the_way/delivered):');
            
            if (newStatus) {
                fetch(`/api/orders/${orderId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': getCSRFToken()
                    },
                    body: JSON.stringify({ status: newStatus })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('Order status updated!');
                        location.reload();
                    } else {
                        alert('Error: ' + data.error);
                    }
                });
            }
        });
    });
}

// CSRF Token helper (you'll need to implement CSRF protection in Flask)
function getCSRFToken() {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.getAttribute('content') : '';
}

// Search functionality
function initSearch() {
    const searchInput = document.getElementById('search-food');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const foodItems = document.querySelectorAll('.menu-item-card, .shop-card');
        
        foodItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });
}

// Add to cart with animation
function addToCartWithAnimation(itemId, shopId) {
    const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
    const cartCount = document.getElementById('cart-count');
    
    // Create animation element
    const animation = document.createElement('div');
    animation.style.position = 'fixed';
    animation.style.width = '20px';
    animation.style.height = '20px';
    animation.style.background = '#667eea';
    animation.style.borderRadius = '50%';
    animation.style.pointerEvents = 'none';
    animation.style.zIndex = '10000';
    
    // Get positions
    const itemRect = itemElement.getBoundingClientRect();
    const cartRect = cartCount.getBoundingClientRect();
    
    // Set start position
    animation.style.left = itemRect.left + 'px';
    animation.style.top = itemRect.top + 'px';
    
    document.body.appendChild(animation);
    
    // Animate
    const animationDuration = 500;
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        
        // Easing function
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        
        // Calculate current position
        const currentX = itemRect.left + (cartRect.left - itemRect.left) * easeOutCubic;
        const currentY = itemRect.top + (cartRect.top - itemRect.top) * easeOutCubic;
        
        animation.style.left = currentX + 'px';
        animation.style.top = currentY + 'px';
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Animation complete
            document.body.removeChild(animation);
            
            // Update cart count with bounce animation
            const currentCount = parseInt(cartCount.textContent);
            cartCount.textContent = currentCount + 1;
            
            cartCount.style.transform = 'scale(1.5)';
            setTimeout(() => {
                cartCount.style.transform = 'scale(1)';
            }, 200);
        }
    }
    
    requestAnimationFrame(animate);
}

// Initialize service worker for PWA capabilities
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js').then(
            function(registration) {
                console.log('ServiceWorker registration successful');
            },
            function(err) {
                console.log('ServiceWorker registration failed: ', err);
            }
        );
    });
}

// Offline detection
window.addEventListener('online', function() {
    document.body.classList.remove('offline');
    showNotification('You are back online!', 'success');
});

window.addEventListener('offline', function() {
    document.body.classList.add('offline');
    showNotification('You are offline. Some features may not work.', 'warning');
});

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', function() {
        notification.remove();
    });
}

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .notification-info { background: #2196F3; }
    .notification-success { background: #4CAF50; }
    .notification-warning { background: #FF9800; }
    .notification-error { background: #f44336; }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        margin-left: 15px;
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;

document.head.appendChild(notificationStyles);

