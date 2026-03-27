/**
 * 3Dtag Pricing Page JavaScript
 * Handles billing toggle, upgrade flow, and payment modals
 */

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const billingToggle = document.getElementById('billing-toggle');
    const monthlyPrices = document.querySelectorAll('.amount.monthly');
    const yearlyPrices = document.querySelectorAll('.amount.yearly');
    const upgradeButtons = document.querySelectorAll('.upgrade-btn');
    const contactSalesButtons = document.querySelectorAll('.contact-sales');
    const paymentModal = document.getElementById('payment-modal');
    const modalClose = paymentModal.querySelector('.modal-close');
    const confirmPaymentBtn = paymentModal.querySelector('.confirm-payment');
    const paymentMethods = document.querySelectorAll('.payment-method');
    const wechatQR = document.getElementById('wechat-qr');

    // State
    let selectedTier = 'pro';
    let selectedPaymentMethod = 'wechat';

    // Billing toggle handler
    billingToggle.addEventListener('change', () => {
        const isYearly = billingToggle.checked;

        monthlyPrices.forEach(el => {
            el.style.display = isYearly ? 'none' : 'inline';
        });

        yearlyPrices.forEach(el => {
            el.style.display = isYearly ? 'inline' : 'none';
        });

        // Update modal prices if open
        updateModalPrice();
    });

    // Upgrade button clicks
    upgradeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedTier = btn.dataset.tier;
            openPaymentModal();
        });
    });

    // Contact sales buttons
    contactSalesButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            alert('感谢您的关注！我们的销售团队将在 24 小时内与您联系。\n\n您也可以直接发送邮件至：sales@3dtag.shop');
        });
    });

    // Open payment modal
    function openPaymentModal() {
        const tierNames = {
            'pro': '专业版',
            'team': '团队版'
        };

        const tierPrices = {
            'pro': { monthly: '¥29/月', yearly: '¥23/月' },
            'team': { monthly: '¥79/月', yearly: '¥63/月' }
        };

        const isYearly = billingToggle.checked;
        const cycle = isYearly ? '年付' : '月付';
        const price = isYearly ? tierPrices[selectedTier].yearly : tierPrices[selectedTier].monthly;

        document.getElementById('modal-title').textContent = `升级到${tierNames[selectedTier]}`;
        document.getElementById('summary-tier').textContent = tierNames[selectedTier];
        document.getElementById('summary-cycle').textContent = cycle;
        document.getElementById('summary-price').textContent = price;

        // Reset payment method
        selectPaymentMethod('wechat');
        wechatQR.style.display = 'block';

        paymentModal.classList.remove('hidden');
    }

    // Update modal price when toggle changes (if modal open)
    function updateModalPrice() {
        if (paymentModal.classList.contains('hidden')) return;

        const tierPrices = {
            'pro': { monthly: '¥29/月', yearly: '¥23/月' },
            'team': { monthly: '¥79/月', yearly: '¥63/月' }
        };

        const isYearly = billingToggle.checked;
        const price = isYearly ? tierPrices[selectedTier].yearly : tierPrices[selectedTier].monthly;
        document.getElementById('summary-price').textContent = price;
        document.getElementById('summary-cycle').textContent = isYearly ? '年付' : '月付';
    }

    // Close modal
    modalClose.addEventListener('click', () => {
        paymentModal.classList.add('hidden');
    });

    paymentModal.addEventListener('click', (e) => {
        if (e.target === paymentModal) {
            paymentModal.classList.add('hidden');
        }
    });

    // Payment method selection
    paymentMethods.forEach(method => {
        method.addEventListener('click', () => {
            const methodName = method.dataset.method;
            selectPaymentMethod(methodName);
        });
    });

    function selectPaymentMethod(method) {
        selectedPaymentMethod = method;
        paymentMethods.forEach(m => m.classList.remove('selected'));
        document.querySelector(`[data-method="${method}"]`).classList.add('selected');

        // Show appropriate QR/content
        if (method === 'wechat') {
            wechatQR.style.display = 'block';
        } else if (method === 'alipay') {
            wechatQR.style.display = 'block';
            wechatQR.querySelector('.qr-placeholder i').className = 'fas fa-qrcode';
            wechatQR.querySelector('.qr-placeholder span').textContent = '支付宝支付二维码';
        } else if (method === 'card') {
            wechatQR.style.display = 'none';
            // In a real implementation, show credit card form
        }
    }

    // Confirm payment (demo)
    confirmPaymentBtn.addEventListener('click', () => {
        const tierNames = {
            'pro': '专业版',
            'team': '团队版'
        };

        const methodNames = {
            'wechat': '微信支付',
            'alipay': '支付宝',
            'card': '信用卡'
        };

        // Show processing state
        confirmPaymentBtn.disabled = true;
        confirmPaymentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';

        // Simulate payment processing
        setTimeout(() => {
            paymentModal.classList.add('hidden');
            confirmPaymentBtn.disabled = false;
            confirmPaymentBtn.innerHTML = '确认支付';

            // Show success message (in a real app, this would redirect to payment gateway)
            showNotification({
                type: 'success',
                title: '支付成功！',
                message: `感谢您升级到${tierNames[selectedTier]}！权限已激活，开始探索更多功能吧！`,
                duration: 5000
            });

            // In production, the user would be redirected to the payment provider
            // and then back to the app with a success callback
        }, 2000);
    });

    // Notification system (simple implementation)
    function showNotification({ type, title, message, duration = 5000 }) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
            <button class="notification-close">&times;</button>
        `;

        // Styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            maxWidth: '400px',
            padding: '1rem 1.5rem',
            background: type === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: '1001',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            animation: 'slideInRight 0.3s ease-out'
        });

        document.body.appendChild(notification);

        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });

        // Auto remove
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }

    // Add animation styles dynamically
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        .notification-close {
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0;
            line-height: 1;
        }
    `;
    document.head.appendChild(style);

    // Initialize payment method
    selectPaymentMethod('wechat');

    // Google Auth buttons integration (placeholder)
    // In a real implementation, this would integrate with auth-client.js
    const authButtons = document.getElementById('auth-buttons');
    if (authButtons) {
        authButtons.innerHTML = `
            <button class="btn btn-secondary" onclick="window.location.href='index.html'">
                <i class="fas fa-user"></i> 登录
            </button>
        `;
    }

    console.log('Pricing page initialized. Billing toggle:', billingToggle.checked ? 'yearly' : 'monthly');
});
