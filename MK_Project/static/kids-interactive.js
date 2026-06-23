/**
 * MamaKodal Kids Interactivity & Reward System
 * Features Web Audio API Sound Synthesizer, Confetti Sparks, Star HUD, and Poppable Balloons
 */

class KidsInteractivity {
    constructor() {
        this.audioCtx = null;
        
        // Read authenticated user state from body data attributes if present
        const bodyEl = document.body;
        const isAuth = bodyEl && bodyEl.getAttribute('data-user-authenticated') === 'true';
        if (isAuth) {
            this.stars = parseInt(bodyEl.getAttribute('data-user-stars')) || 0;
            this.level = parseInt(bodyEl.getAttribute('data-user-level')) || 1;
            // Align local storage
            localStorage.setItem('mamakodal_stars', this.stars);
            localStorage.setItem('mamakodal_level', this.level);
        } else {
            this.stars = parseInt(localStorage.getItem('mamakodal_stars')) || 0;
            this.level = parseInt(localStorage.getItem('mamakodal_level')) || 1;
        }
        
        this.balloonInterval = null;

        // Start initialization
        this.init();
    }

    init() {
        // Build the Explorer HUD Widget in DOM
        this.buildHUD();
        // Setup sound engine trigger on first click (browser policy)
        document.addEventListener('click', () => this.initAudioContext(), { once: true });
        // Set up event listeners for page interactions
        this.setupListeners();
        // Start floating balloon spawner
        this.startBalloonSpawner();
        // Initialize progress HUD view
        this.updateHUD();
        // Initialize price range sliders
        this.initPriceSliders();
        // Update cart badge from persistent storage
        this.updateCartBadge();
    }

    initAudioContext() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    // --- SOUND ENGINE (WEB AUDIO API SYNTHESIZER) ---
    playSynthSound(type) {
        this.initAudioContext();
        if (!this.audioCtx) return;

        try {
            const now = this.audioCtx.currentTime;

            if (type === 'pop') {
                // Short downward sine sweep for a balloon pop
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

                gain.gain.setValueAtTime(0.4, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.12);

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.12);
            } 
            else if (type === 'chime') {
                // Bright high-frequency ringing chime
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(987.77, now); // B5 note
                osc.frequency.linearRampToValueAtTime(1318.51, now + 0.08); // E6 note

                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.45);
            } 
            else if (type === 'success') {
                // Magical ascending arpeggio tada chords
                const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C major notes arpeggio
                notes.forEach((freq, idx) => {
                    const osc = this.audioCtx.createOscillator();
                    const gain = this.audioCtx.createGain();
                    
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                    
                    gain.gain.setValueAtTime(0, now);
                    gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
                    
                    osc.connect(gain);
                    gain.connect(this.audioCtx.destination);
                    osc.start(now + idx * 0.08);
                    osc.stop(now + idx * 0.08 + 0.35);
                });
            } 
            else if (type === 'giggle') {
                // Bubbly wobbling frequency sweep simulating giggles
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                const lfo = this.audioCtx.createOscillator();
                const lfoGain = this.audioCtx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(650, now + 0.4);

                lfo.frequency.value = 25; // 25Hz wobble vibrato
                lfoGain.gain.value = 50;  // depth of pitch sweep wobble

                lfo.connect(lfoGain);
                lfoGain.connect(osc.frequency);
                
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.linearRampToValueAtTime(0.25, now + 0.3);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);

                lfo.start(now);
                osc.start(now);
                
                lfo.stop(now + 0.42);
                osc.stop(now + 0.42);
            }
        } catch (e) {
            console.error("Synthesizer error: ", e);
        }
    }

    // --- GAME METRICS & HUD WIDGET ---
    buildHUD() {
        // Remove existing if any
        const oldHUD = document.querySelector('.explorer-hud-widget');
        if (oldHUD) oldHUD.remove();

        const hud = document.createElement('div');
        hud.className = 'explorer-hud-widget';
        hud.setAttribute('title', 'Your Explorer Level! Click to play a giggle sound!');
        hud.innerHTML = `
            <div class="explorer-hud-header">
                <span>🌟 explorer</span>
                <span class="explorer-hud-stars">✨ <span id="stars-level">${this.level}</span></span>
            </div>
            <div class="explorer-progress-container">
                <div class="explorer-progress-fill" id="stars-progress"></div>
            </div>
            <div class="explorer-hud-footer">
                <span id="stars-score">${this.stars}</span> / 100 points
            </div>
        `;
        document.body.appendChild(hud);

        // Click HUD widget triggers a giggle sound
        hud.addEventListener('click', (e) => {
            e.stopPropagation();
            this.playSynthSound('giggle');
            this.spawnSparkles(e.clientX, e.clientY, 8, ['✨', '🎈', '⭐']);
        });

        // Setup Alert banner placeholder
        const alertBanner = document.createElement('div');
        alertBanner.className = 'explorer-popup-alert';
        alertBanner.id = 'explorer-alert';
        document.body.appendChild(alertBanner);
    }

    updateHUD() {
        const progressFill = document.getElementById('stars-progress');
        const starsScore = document.getElementById('stars-score');
        const starsLevel = document.getElementById('stars-level');

        if (progressFill) progressFill.style.width = `${this.stars}%`;
        if (starsScore) starsScore.textContent = this.stars;
        if (starsLevel) starsLevel.textContent = this.level;

        localStorage.setItem('mamakodal_stars', this.stars);
        localStorage.setItem('mamakodal_level', this.level);
    }

    updateCartBadge() {
        const cart = JSON.parse(localStorage.getItem('mamakodal_cart')) || [];
        const count = cart.reduce((total, item) => total + (item.qty || 0), 0);
        
        const cartBtn = document.querySelector('.cart-btn');
        if (cartBtn) {
            let badge = cartBtn.querySelector('.cart-badge-count');
            if (!badge && count > 0) {
                cartBtn.style.position = 'relative';
                badge = document.createElement('span');
                badge.className = 'cart-badge-count';
                badge.style.position = 'absolute';
                badge.style.top = '-5px';
                badge.style.right = '-5px';
                badge.style.background = 'var(--primary)';
                badge.style.color = 'white';
                badge.style.borderRadius = '50%';
                badge.style.padding = '2px 6px';
                badge.style.fontSize = '10px';
                badge.style.fontWeight = 'bold';
                cartBtn.appendChild(badge);
            }
            if (badge) {
                if (count > 0) {
                    badge.textContent = count;
                    badge.style.display = 'block';
                } else {
                    badge.style.display = 'none';
                }
            }
        }
    }

    addStars(amount, x, y) {
        this.stars += amount;
        
        // Visual reward sparkle triggers at client coordinates if provided
        if (x && y) {
            this.spawnSparkles(x, y, 6, ['⭐', '✨']);
        }

        if (this.stars >= 100) {
            this.levelUp();
        } else {
            this.playSynthSound('chime');
            this.updateHUD();
            this.syncStarsWithDB();
        }
    }

    levelUp() {
        this.level += 1;
        this.stars = this.stars - 100;
        if (this.stars < 0) this.stars = 0;

        this.updateHUD();
        this.playSynthSound('success');
        this.syncStarsWithDB();

        // Confetti burst
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                const rx = Math.random() * window.innerWidth;
                const ry = Math.random() * (window.innerHeight * 0.7);
                this.spawnSparkles(rx, ry, 20, ['🎉', '🎈', '⭐', '✨', '🦄', '🦖', '🍭']);
            }, i * 200);
        }

        // Show level-up popup alert banner
        const alert = document.getElementById('explorer-alert');
        if (alert) {
            alert.innerHTML = `🌈 Level Up! Explorer Level ${this.level}! 🎉`;
            alert.classList.add('show');
            setTimeout(() => {
                alert.classList.remove('show');
            }, 3000);
        }
    }

    syncStarsWithDB() {
        const isAuth = document.body && document.body.getAttribute('data-user-authenticated') === 'true';
        if (!isAuth) return;

        fetch('/api/sync-rewards/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                stars: this.stars,
                level: this.level
            })
        })
        .then(res => res.json())
        .then(data => {
            console.log("DB rewards synced:", data);
        })
        .catch(err => {
            console.error("Error syncing rewards:", err);
        });
    }

    // --- SPARKLE PARTICLE SPARK SYSTEM ---
    spawnSparkles(x, y, count = 10, emojis = ['⭐', '✨', '🎈', '🍭', '🎨']) {
        for (let i = 0; i < count; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle-particle';
            
            // Pick random emoji
            sparkle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            
            // Random direction values for CSS animation
            const tx = (Math.random() - 0.5) * 160; // translate X
            const ty = (Math.random() - 0.5) * 160; // translate Y
            const rot = (Math.random() - 0.5) * 720; // rotation
            const scaleEnd = 1.0 + Math.random() * 0.6;
            const duration = 0.5 + Math.random() * 0.5;

            sparkle.style.setProperty('--tx', `${tx}px`);
            sparkle.style.setProperty('--ty', `${ty}px`);
            sparkle.style.setProperty('--rot', `${rot}deg`);
            sparkle.style.setProperty('--scale-end', scaleEnd);
            sparkle.style.setProperty('--duration', `${duration}s`);
            
            // Set starting position
            sparkle.style.left = `${x}px`;
            sparkle.style.top = `${y}px`;

            document.body.appendChild(sparkle);

            // Clean up DOM element
            setTimeout(() => {
                sparkle.remove();
            }, duration * 1000);
        }
    }

    // --- FLOATING BALLOON SPAWNER ---
    startBalloonSpawner() {
        // Clean old interval if running
        if (this.balloonInterval) clearInterval(this.balloonInterval);

        // Spawn a balloon or magic star every 12 seconds
        this.balloonInterval = setInterval(() => {
            this.spawnBalloon();
        }, 12000);
        
        // Spawn one balloon immediately to welcome them!
        setTimeout(() => this.spawnBalloon(), 2000);
    }

    spawnBalloon() {
        // Don't spawn if user is on mobile/tiny screen to avoid clutter
        if (window.innerWidth < 640) return;

        const balloon = document.createElement('div');
        balloon.className = 'floating-balloon';

        // Select items randomly: balloon emojis, cute animals, stars
        const kidsItems = [
            { emoji: '🎈', color: 'rgba(255, 71, 126, 0.85)' },
            { emoji: '🫧', color: 'rgba(36, 210, 240, 0.8)' },
            { emoji: '🧸', color: 'rgba(251, 133, 0, 0.85)' },
            { emoji: '🦖', color: 'rgba(112, 224, 0, 0.85)' },
            { emoji: '🦄', color: 'rgba(157, 78, 221, 0.85)' },
            { emoji: '🌟', color: 'rgba(255, 183, 3, 0.9)' }
        ];
        const item = kidsItems[Math.floor(Math.random() * kidsItems.length)];
        
        balloon.textContent = item.emoji;
        balloon.style.background = item.color;
        balloon.style.left = `${10 + Math.random() * 80}vw`; // Random horizontal position
        
        // Custom animation parameters
        const duration = 6 + Math.random() * 6;
        const drift = 20 + Math.random() * 50;
        const driftBack = -20 - Math.random() * 50;

        balloon.style.setProperty('--duration', `${duration}s`);
        balloon.style.setProperty('--drift', `${drift}px`);
        balloon.style.setProperty('--drift-back', `${driftBack}px`);

        document.body.appendChild(balloon);

        // Click balloon to pop it and gain stars
        balloon.addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = balloon.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            
            this.playSynthSound('pop');
            this.spawnSparkles(cx, cy, 15, ['✨', '🌟', '🌈', '🍭', item.emoji]);
            this.addStars(10, cx, cy);
            
            balloon.remove();
        });

        // Auto remove when animation finishes
        setTimeout(() => {
            if (balloon.parentNode) {
                balloon.remove();
            }
        }, duration * 1000);
    }

    // --- SPECIAL PRICE RANGE SLIDER STYLING ACCORDION ---
    initPriceSliders() {
        document.querySelectorAll('.price-slider').forEach(slider => {
            const updateSlider = () => {
                const min = parseFloat(slider.min) || 0;
                const max = parseFloat(slider.max) || 100;
                const val = parseFloat(slider.value) || 0;
                const percent = ((val - min) / (max - min)) * 100;
                slider.style.setProperty('--value', percent + '%');
            };
            slider.addEventListener('input', updateSlider);
            updateSlider();
        });
    }

    // --- ELEMENT HOOKS & EVENT LISTENERS ---
    setupListeners() {
        // 1. Hook buttons & links clicks for chimes + sparkles
        const interactiveSelectors = [
            '.btn-primary', '.btn-secondary', '.add-to-cart-btn',
            '.write-review-btn', '.checkout-submit-btn', '.form-submit-btn',
            '.cart-btn', '.profile-btn', '.explore-link', '.view-all-link'
        ];

        document.addEventListener('click', (e) => {
            const target = e.target;

            // Handle Add to Cart button click specifically
            const addCartBtn = target.closest('.add-to-cart-btn');
            if (addCartBtn) {
                const card = addCartBtn.closest('.product-card');
                if (card) {
                    const titleEl = card.querySelector('.product-name, .item-title, h3');
                    const title = titleEl ? titleEl.textContent.trim() : 'Unknown Product';
                    
                    const priceEl = card.querySelector('.product-price, .item-unit-price, span[style*="price"]');
                    const price = priceEl ? priceEl.textContent.trim() : '$0.00';
                    
                    const imgEl = card.querySelector('img');
                    const imgUrl = imgEl ? imgEl.getAttribute('src') : '';
                    
                    const catEl = card.querySelector('.item-category, .new-tag');
                    const category = catEl ? catEl.textContent.trim() : 'Product';

                    let cart = JSON.parse(localStorage.getItem('mamakodal_cart')) || [];
                    const existingItem = cart.find(item => item.title === title);
                    if (existingItem) {
                        existingItem.qty += 1;
                    } else {
                        cart.push({ title, price, imgUrl, category, qty: 1 });
                    }
                    localStorage.setItem('mamakodal_cart', JSON.stringify(cart));
                    
                    this.updateCartBadge();
                    
                    // Award stars + play sound
                    this.playSynthSound('chime');
                    this.addStars(10, e.clientX, e.clientY);
                    
                    // Show confirmation popup
                    const alert = document.getElementById('explorer-alert');
                    if (alert) {
                        alert.innerHTML = `🎒 Added "${title}" to your cart! 🛒`;
                        alert.classList.add('show');
                        setTimeout(() => {
                            alert.classList.remove('show');
                        }, 2000);
                    }
                }
                return;
            }

            const matchingElement = interactiveSelectors.some(sel => target.closest(sel));

            if (matchingElement) {
                // If it is a submit button in a form, we handle it separately
                const isFormSubmit = target.closest('button[type="submit"]') || target.closest('.form-submit-btn');
                if (isFormSubmit) {
                    // Let form listener handle it or add quick points
                    this.addStars(15, e.clientX, e.clientY);
                } else {
                    this.addStars(5, e.clientX, e.clientY);
                }
            }
        });

        // 2. Hover elements rewards (gentle chime/giggle on hover cards once in a while)
        let lastHoverTime = 0;
        const hoverCards = ['.product-card', '.showcase-card', '.review-item-card', '.value-card'];
        
        document.addEventListener('mouseover', (e) => {
            const target = e.target;
            const card = hoverCards.some(sel => target.closest(sel));
            if (card) {
                const now = Date.now();
                if (now - lastHoverTime > 3000) { // Throttle sounds so it's not noisy
                    lastHoverTime = now;
                    this.playSynthSound('chime');
                    const rect = target.getBoundingClientRect();
                    this.spawnSparkles(rect.left + rect.width / 2, rect.top + 10, 3, ['✨', '⭐']);
                }
            }
        });

        // 3. Form input interactions (typing gives stars!)
        let inputTimer = null;
        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                // Throttle keyboard stars to avoid spamming
                clearTimeout(inputTimer);
                inputTimer = setTimeout(() => {
                    this.addStars(1);
                }, 500);
            }
        });

        // 4. Form submissions (rewards +25 points)
        document.addEventListener('submit', (e) => {
            e.preventDefault(); // In a mock Django site, let it submit, but trigger celebration first
            this.playSynthSound('success');
            this.addStars(25);
            
            // Visual fireworks from center screen
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            this.spawnSparkles(cx, cy, 30, ['🌈', '✨', '🎈', '⭐', '🦖', '🍿', '🍭']);

            // Show congratulations alert
            const alert = document.getElementById('explorer-alert');
            if (alert) {
                alert.innerHTML = `✨ Form Submitted! +25 Explorer Stars! 🦖`;
                alert.classList.add('show');
                setTimeout(() => {
                    alert.classList.remove('show');
                    // Continue form submission after delay if needed, here we just let the event continue
                    e.target.submit();
                }, 1200);
            }
        });

        // 5. Special hook for reviews star clicks (if they write review)
        document.addEventListener('click', (e) => {
            const star = e.target.closest('.star-rating-selector span, .review-star-clickable');
            if (star) {
                this.playSynthSound('chime');
                this.addStars(10, e.clientX, e.clientY);
                this.spawnSparkles(e.clientX, e.clientY, 8, ['⭐', '✨']);
            }
        });
    }
}

// Instantiate the interactivity layer once the DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.KidsInteractivityInstance = new KidsInteractivity();
    });
} else {
    window.KidsInteractivityInstance = new KidsInteractivity();
}
