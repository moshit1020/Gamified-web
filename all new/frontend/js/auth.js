// Authentication functions
class AuthManager {
    constructor() {
        this.apiBaseUrl = '/api/auth';
        this.authToken = localStorage.getItem('authToken');
    }

    // Register new user
    async register(userData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (data.success) {
                // Store token and user data
                this.authToken = data.data.token;
                localStorage.setItem('authToken', this.authToken);
                localStorage.setItem('userData', JSON.stringify(data.data.user));
                
                return {
                    success: true,
                    user: data.data.user,
                    token: data.data.token
                };
            } else {
                return {
                    success: false,
                    message: data.message,
                    errors: data.errors || []
                };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                message: 'Network error. Please try again.'
            };
        }
    }

    // Login user
    async login(email, password) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                // Store token and user data
                this.authToken = data.data.token;
                localStorage.setItem('authToken', this.authToken);
                localStorage.setItem('userData', JSON.stringify(data.data.user));
                
                return {
                    success: true,
                    user: data.data.user,
                    token: data.data.token
                };
            } else {
                return {
                    success: false,
                    message: data.message
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'Network error. Please try again.'
            };
        }
    }

    // Verify current token
    async verifyToken() {
        if (!this.authToken) {
            return { success: false, message: 'No token found' };
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/verify`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            const data = await response.json();

            if (data.success) {
                // Update stored user data
                localStorage.setItem('userData', JSON.stringify(data.data.user));
                return {
                    success: true,
                    user: data.data.user
                };
            } else {
                // Token is invalid, clear it
                this.logout();
                return {
                    success: false,
                    message: data.message
                };
            }
        } catch (error) {
            console.error('Token verification error:', error);
            this.logout();
            return {
                success: false,
                message: 'Network error'
            };
        }
    }

    // Logout user
    logout() {
        this.authToken = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
    }

    // Get current user data
    getCurrentUser() {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    }

    // Check if user is logged in
    isLoggedIn() {
        return !!this.authToken;
    }

    // Get auth token
    getToken() {
        return this.authToken;
    }

    // Redirect based on user type
    redirectToDashboard(userType) {
        switch (userType) {
            case 'admin':
                window.location.href = '/frontend/admin-dashboard.html';
                break;
            case 'student':
                window.location.href = '/frontend/student-dashboard.html';
                break;
            default:
                window.location.href = '/';
        }
    }
}

// Global auth manager instance
const authManager = new AuthManager();

// Form handling functions
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;

    authManager.login(email, password)
        .then(result => {
            if (result.success) {
                showNotification('Login successful!', 'success');
                // Redirect to appropriate dashboard
                setTimeout(() => {
                    authManager.redirectToDashboard(result.user.userType);
                }, 1000);
            } else {
                showNotification(result.message, 'error');
            }
        })
        .catch(error => {
            console.error('Login error:', error);
            showNotification('Login failed. Please try again.', 'error');
        })
        .finally(() => {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
}

function handleRegister(event) {
    event.preventDefault();
    
    const formData = {
        firstName: document.getElementById('registerFirstName').value,
        lastName: document.getElementById('registerLastName').value,
        email: document.getElementById('registerEmail').value,
        grade: parseInt(document.getElementById('registerGrade').value),
        password: document.getElementById('registerPassword').value,
        confirmPassword: document.getElementById('registerConfirmPassword').value
    };

    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.grade || !formData.password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    if (formData.password !== formData.confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    if (formData.password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }

    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating Account...';
    submitBtn.disabled = true;

    authManager.register(formData)
        .then(result => {
            if (result.success) {
                showNotification('Registration successful!', 'success');
                // Redirect to student dashboard
                setTimeout(() => {
                    authManager.redirectToDashboard('student');
                }, 1000);
            } else {
                if (result.errors && result.errors.length > 0) {
                    showNotification(result.errors[0].msg, 'error');
                } else {
                    showNotification(result.message, 'error');
                }
            }
        })
        .catch(error => {
            console.error('Registration error:', error);
            showNotification('Registration failed. Please try again.', 'error');
        })
        .finally(() => {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
}

// Auth tab switching
function switchAuthTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update forms
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.add('hidden');
    });
    document.getElementById(`${tabName}Form`).classList.remove('hidden');
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Initialize auth system
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    if (authManager.isLoggedIn()) {
        const user = authManager.getCurrentUser();
        if (user) {
            // Redirect to appropriate dashboard
            authManager.redirectToDashboard(user.userType);
            return;
        }
    }

    // Set up form event listeners
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Set up tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            switchAuthTab(this.dataset.tab);
        });
    });
});

// Export for use in other files
window.authManager = authManager;
