/**
 * 3Dtag Pricing Page JavaScript
 * Handles billing toggle, upgrade flow, and payment modals
 */

document.addEventListener('DOMContentLoaded', () => {
    // Elements (with null checks for safety)
    const billingToggle = document.getElementById('billing-toggle');
    const monthlyPrices = document.querySelectorAll('.amount.monthly');
    const yearlyPrices = document.querySelectorAll('.amount.yearly');
    const upgradeButtons = document.querySelectorAll('.upgrade-btn');
    const contactSalesButtons = document.querySelectorAll('.contact-sales');
    const paymentModal = document.getElementById('payment-modal');
    const wechatQR = document.getElementById('wechat-qr');

    // State
    let selectedTier = 'pro';
    let selectedPaymentMethod = 'wechat';

    // Billing toggle handler
    if (billingToggle) {
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
    }

    // Upgrade button clicks - only these trigger modal
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

        const isYearly = billingToggle ? billingToggle.checked : false;
        const cycle = isYearly ? '年付' : '月付';
        const price = isYearly ? tierPrices[selectedTier].yearly : tierPrices[selectedTier].monthly;

        document.getElementById('modal-title').textContent = `升级到${tierNames[selectedTier]}`;
        document.getElementById('summary-tier').textContent = tierNames[selectedTier];
        document.getElementById('summary-cycle').textContent = cycle;
        document.getElementById('summary-price').textContent = price;

        // Reset payment method
        selectPaymentMethod('wechat');
        if (wechatQR) wechatQR.style.display = 'block';

        paymentModal.classList.remove('hidden');
    }

    // Update modal price when toggle changes (if modal open)
    function updateModalPrice() {
        if (!paymentModal || paymentModal.classList.contains('hidden')) return;

        const tierPrices = {
            'pro': { monthly: '¥29/月', yearly: '¥23/月' },
            'team': { monthly: '¥79/月', yearly: '¥63/月' }
        };

        const isYearly = billingToggle ? billingToggle.checked : false;
        const price = isYearly ? tierPrices[selectedTier].yearly : tierPrices[selectedTier].monthly;
        document.getElementById('summary-price').textContent = price;
        document.getElementById('summary-cycle').textContent = isYearly ? '年付' : '月付';
    }

    // Close modal - centralized function
    function closeModal() {
        if (paymentModal) {
            paymentModal.classList.add('hidden');
        }
    }

    // Close modal handlers (setup after DOM loaded)
    if (paymentModal) {
        // Close button
        const modalCloseBtn = paymentModal.querySelector('.modal-close');
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeModal();
            });
        }

        // Click outside modal content
        paymentModal.addEventListener('click', (e) => {
            if (e.target === paymentModal) {
                closeModal();
            }
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !paymentModal.classList.contains('hidden')) {
                closeModal();
            }
        });
    }

    // Payment method selection
    const paymentMethods = document.querySelectorAll('.payment-method');
    paymentMethods.forEach(method => {
        method.addEventListener('click', () => {
            const methodName = method.dataset.method;
            selectPaymentMethod(methodName);
        });
    });

    function selectPaymentMethod(method) {
        selectedPaymentMethod = method;
        paymentMethods.forEach(m => m.classList.remove('selected'));
        const selectedMethodEl = document.querySelector(`[data-method="${method}"]`);
        if (selectedMethodEl) {
            selectedMethodEl.classList.add('selected');
        }

        // Show appropriate QR/content
        if (wechatQR) {
            if (method === 'wechat' || method === 'alipay') {
                wechatQR.style.display = 'block';
                if (method === 'alipay') {
                    const qrIcon = wechatQR.querySelector('.qr-placeholder i');
                    const qrText = wechatQR.querySelector('.qr-placeholder span');
                    if (qrIcon) qrIcon.className = 'fas fa-qrcode';
                    if (qrText) qrText.textContent = '支付宝支付二维码';
                } else {
                    const qrIcon = wechatQR.querySelector('.qr-placeholder i');
                    const qrText = wechatQR.querySelector('.qr-placeholder span');
                    if (qrIcon) qrIcon.className = 'fas fa-qrcode';
                    if (qrText) qrText.textContent = '微信支付二维码';
                }
            } else if (method === 'card') {
                wechatQR.style.display = 'none';
            }
        }
    }

    // Initialize payment method
    selectPaymentMethod('wechat');

    // Confirm payment button
    const confirmPaymentBtn = document.querySelector('#payment-modal .confirm-payment');
    if (confirmPaymentBtn) {
        confirmPaymentBtn.addEventListener('click', () => {
            const tierNames = {
                'pro': '专业版',
                'team': '团队版'
            };

            // Show processing state
            confirmPaymentBtn.disabled = true;
            confirmPaymentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';

            // Simulate payment processing
            setTimeout(() => {
                closeModal();
                confirmPaymentBtn.disabled = false;
                confirmPaymentBtn.innerHTML = '确认支付';

                // Show success message
                showNotification({
                    type: 'success',
                    title: '支付成功！',
                    message: `感谢您升级到${tierNames[selectedTier]}！权限已激活，开始探索更多功能吧！`,
                    duration: 5000
                });
            }, 2000);
        });
    }

    // Notification system
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

        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => notification.remove());
        }

        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; } to { opacity: 0; }
        }
        .notification-close {
            background: none; border: none; color: white;
            font-size: 1.5rem; cursor: pointer; padding: 0; line-height: 1;
        }
    `;
    document.head.appendChild(style);

    console.log('Pricing page initialized.');
});
