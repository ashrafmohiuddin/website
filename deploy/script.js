// Configuration
const CONFIG = {
    birthday: new Date('2001-01-13'),
    firstTalked: 2021,
    firstMet: new Date('2024-04-26'),
    appleTotalValue: 0, // Will be calculated
    pic1Path: '', // Will be set when finding PIC1
    usedPics: []
};

// State
let isDarkMode = true;
let viewOnceShown = false;
let transitionTimeout = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeAge();
    initializeViewOncePhoto();
    initializeAppleSection();
    initializeGallery();
    initializeThemeToggle();
    initializeEasterEggs();
});

// Calculate and display age in days
function initializeAge() {
    // Today is January 13, 2026
    const today = new Date('2026-01-13');
    const birthDate = CONFIG.birthday; // January 13, 2001
    const diffTime = today - birthDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const ageDaysElement = document.getElementById('age-days');
    if (ageDaysElement) {
        ageDaysElement.textContent = diffDays.toLocaleString();
    }
}

// Initialize view-once photo feature
function initializeViewOncePhoto() {
    const viewOnceKey = 'sushmitha_view_once_shown';
    const shown = localStorage.getItem(viewOnceKey);
    
    // Show PIC1 if not shown before
    if (!shown) {
        // Small delay to ensure page is loaded
        setTimeout(() => {
            findAndShowPic1();
        }, 500);
    } else {
        // If already shown, ensure it's hidden
        const viewOnceContainer = document.getElementById('view-once-photo');
        if (viewOnceContainer) {
            viewOnceContainer.classList.add('hidden');
        }
    }
}

function findAndShowPic1() {
    // PIC1 - Using an image from around the first meet date (April 26, 2024)
    // Using the first image from April 13, 2024 as it's closest to the first meet
    const pic1Element = document.getElementById('pic1');
    const viewOnceContainer = document.getElementById('view-once-photo');
    
    if (pic1Element && viewOnceContainer) {
        // Use an image from around the first meet date
        pic1Element.src = 'Pics/20250413_164139.jpg'; // PIC1 - special memory
        CONFIG.pic1Path = 'Pics/20250413_164139.jpg';
        
        pic1Element.onerror = () => {
            // Fallback to another April image
            pic1Element.src = 'Pics/20250410_122721.jpg';
            CONFIG.pic1Path = 'Pics/20250410_122721.jpg';
        };
        
        viewOnceContainer.classList.remove('hidden');
        viewOnceShown = true;
        
        // Mark as shown after 5 seconds and hide
        setTimeout(() => {
            viewOnceContainer.style.opacity = '0';
            viewOnceContainer.style.transition = 'opacity 1s ease';
            setTimeout(() => {
                viewOnceContainer.classList.add('hidden');
                localStorage.setItem('sushmitha_view_once_shown', 'true');
            }, 1000);
        }, 5000);
    }
}

function loadRandomPicForViewOnce() {
    // Fallback: load first available image
    const pic1Element = document.getElementById('pic1');
    const viewOnceContainer = document.getElementById('view-once-photo');
    
    if (pic1Element && viewOnceContainer) {
        // We'll load images dynamically
        loadImagesFromFolder().then(images => {
            if (images.length > 0) {
                pic1Element.src = images[0];
                viewOnceContainer.classList.remove('hidden');
                viewOnceShown = true;
                
                setTimeout(() => {
                    viewOnceContainer.classList.add('hidden');
                    localStorage.setItem('sushmitha_view_once_shown', 'true');
                }, 5000);
            }
        });
    }
}

// Initialize Apple Products section
function initializeAppleSection() {
    // Calculate total value of fully speced Apple products
    // iPhone 15 Pro Max (1TB) - ~₹1,79,900
    // MacBook Pro 16" M3 Max (8TB) - ~₹6,99,900
    // iPad Pro 12.9" (2TB) - ~₹2,19,900
    // Apple Watch Ultra 2 - ~₹99,900
    // AirPods Pro 2 - ~₹27,900
    // Mac Studio M2 Ultra - ~₹4,99,900
    // Studio Display - ~₹1,59,900
    // Mac Pro - ~₹6,99,900
    // Total approximate
    
    const appleProducts = {
        'iPhone 15 Pro Max (1TB)': 179900,
        'MacBook Pro 16" M3 Max (8TB)': 699900,
        'iPad Pro 12.9" (2TB)': 219900,
        'Apple Watch Ultra 2': 99900,
        'AirPods Pro 2': 27900,
        'Mac Studio M2 Ultra': 499900,
        'Studio Display': 159900,
        'Mac Pro': 699900
    };
    
    CONFIG.appleTotalValue = Object.values(appleProducts).reduce((sum, price) => sum + price, 0);
    
    const totalElement = document.getElementById('apple-total-value');
    if (totalElement) {
        totalElement.textContent = `₹${CONFIG.appleTotalValue.toLocaleString('en-IN')}`;
    }
    
    // Try to load Apple products image
    loadAppleProductsImage();
}

function loadAppleProductsImage() {
    const appleImg = document.getElementById('apple-products-img');
    if (appleImg) {
        // Use an image that might show Apple products or a nice memory
        // Using one from the April 10 set as it's around the zoom meet time
        appleImg.src = 'Pics/20250410_122847.jpg';
        appleImg.onerror = () => {
            // Fallback
            appleImg.src = 'Pics/20250410_122721.jpg';
            appleImg.onerror = () => {
                appleImg.style.display = 'none';
            };
        };
    }
}

// Initialize Gallery
async function loadImagesFromFolder() {
    // Since we can't directly read folder contents from client-side JS,
    // we'll need to either:
    // 1. Have a server-side endpoint
    // 2. Pre-define the image list
    // 3. Use a build script
    
    // For now, we'll use a predefined list approach
    // In production, you'd generate this list server-side
    
    // Curated selection - removed similar/duplicate images from same dates
    // Keeping diverse moments and reducing total count
    const imageFiles = [
        // Recent memories (2025)
        'Pics/20250708_160354.jpg',
        'Pics/20250527_170916.jpg',
        'Pics/20250527_115913.jpg',
        'Pics/20250513_175923.jpg',
        'Pics/20250511_163153.jpg',
        'Pics/20250510_184528.jpg',
        // First meet period (April 2024) - keeping key ones
        'Pics/20250413_182826.jpg',
        'Pics/20250413_171312.jpg',
        'Pics/20250413_164139.jpg', // PIC1
        'Pics/20250410_141024.jpg',
        'Pics/20250410_122847.jpg', // Apple products
        'Pics/20250410_122721.jpg',
        // March 2024
        'Pics/20250326_212735.jpg',
        'Pics/20250326_163921.jpg',
        'Pics/20250319_204458.jpg',
        // December 2024 - keeping diverse selection
        'Pics/20241213_151319.jpg',
        'Pics/20241213_150919.jpg',
        'Pics/20241213_144642.jpg',
        'Pics/20241213_143115.jpg',
        'Pics/20241213_135717.jpg',
        'Pics/20241211_204825.jpg',
        'Pics/20241211_175003.jpg',
        'Pics/20241211_174413.jpg',
        // November 2024
        'Pics/20241120_174614.jpg',
        'Pics/20241120_172920.jpg',
        // September 2024
        'Pics/20240905_185632.jpg',
        // May 2024
        'Pics/20240531_190754.jpg',
        'Pics/20240531_183228.jpg'
    ];
    
    return imageFiles;
}

async function initializeGallery() {
    const galleryGrid = document.getElementById('gallery-grid');
    if (!galleryGrid) return;
    
    const images = await loadImagesFromFolder();
    
    images.forEach((imagePath, index) => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        
        // Mark images as face-clickable - photos from around first meet (April 2024)
        // and photos that likely have both people together
        // You can adjust this logic based on which photos have both of you
        if (imagePath.includes('202504') || 
            imagePath.includes('202505') || 
            imagePath.includes('202412') ||
            index % 4 === 0) {
            galleryItem.classList.add('face-clickable');
        }
        
        const img = document.createElement('img');
        img.src = imagePath;
        img.alt = `Memory ${index + 1}`;
        img.loading = 'lazy';
        
        img.onerror = () => {
            galleryItem.style.display = 'none';
        };
        
        img.onload = () => {
            CONFIG.usedPics.push(imagePath);
        };
        
        // Add click handler for theme toggle on face-clickable images
        if (galleryItem.classList.contains('face-clickable')) {
            galleryItem.addEventListener('click', (e) => {
                handleFaceClick(e, imagePath);
            });
        }
        
        galleryItem.appendChild(img);
        galleryGrid.appendChild(galleryItem);
    });
    
    // Copy used pics to new folder (this would need server-side support)
    // For now, we'll note which images were used
    saveUsedPicsList();
}

function handleFaceClick(event, imagePath) {
    // Toggle theme when clicking on face in photo
    toggleTheme();
}

// Theme Toggle Functions
function initializeThemeToggle() {
    // Check if theme preference is saved
    const savedTheme = localStorage.getItem('sushmitha_theme');
    if (savedTheme === 'light') {
        switchToLightMode(false);
    }
}

function toggleTheme() {
    if (isDarkMode) {
        switchToLightMode(true);
    } else {
        switchToDarkMode(true);
    }
}

function switchToLightMode(showMessage = true) {
    isDarkMode = false;
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
    localStorage.setItem('sushmitha_theme', 'light');
    
    if (showMessage) {
        showTransitionMessage("I am guiding her towards light... ✨");
    }
}

function switchToDarkMode(showMessage = true) {
    isDarkMode = true;
    document.body.classList.remove('light-mode');
    document.body.classList.add('dark-mode');
    localStorage.setItem('sushmitha_theme', 'dark');
    
    if (showMessage) {
        showTransitionMessage("I will be with you in dark times, as you are with me for so many times... 🌙");
    }
}

function showTransitionMessage(message) {
    const transitionElement = document.getElementById('transition-message');
    const transitionText = document.getElementById('transition-text');
    
    if (transitionElement && transitionText) {
        transitionText.textContent = message;
        transitionElement.classList.remove('hidden');
        
        if (transitionTimeout) {
            clearTimeout(transitionTimeout);
        }
        
        transitionTimeout = setTimeout(() => {
            transitionElement.classList.add('hidden');
        }, 3000);
    }
}

// Easter Eggs
function initializeEasterEggs() {
    // Click on "Happy Birthday" - removed full name display
    const birthdayClick = document.getElementById('birthday-click');
    if (birthdayClick) {
        birthdayClick.style.cursor = 'pointer';
        birthdayClick.addEventListener('click', () => {
            showEasterEggMessage("Nekkanti Madhi Sri Sushmitha Chowdary - I wanna call her mine! 💕");
        });
    }
    
    // Name hint easter egg
    const nameHint = document.getElementById('name-hint');
    if (nameHint) {
        nameHint.addEventListener('click', () => {
            showEasterEggMessage("I wanna call her mine... but I'll settle for Sushmitha! 😉");
        });
    }
    
    // Hidden pun in footer
    const hiddenPun = document.querySelector('.hidden-pun');
    if (hiddenPun) {
        hiddenPun.addEventListener('click', () => {
            showEasterEggMessage("You found the hidden message! I wanna call her mine! 💕");
        });
    }
    
    // "Enjoy" word easter egg
    const enjoyWords = document.querySelectorAll('.enjoy-word');
    enjoyWords.forEach(word => {
        word.addEventListener('click', () => {
            showEasterEggMessage("Enjoy! That's our word! 🎉");
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Press 'E' for Enjoy
        if (e.key === 'e' || e.key === 'E') {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                showEasterEggMessage("Enjoy! 🎊");
            }
        }
        
        // Press 'S' for Sushmitha
        if (e.key === 's' || e.key === 'S') {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                showEasterEggMessage("Sushmitha! The most amazing person! ✨");
            }
        }
    });
}

function showEasterEggMessage(message) {
    // Create a temporary toast message
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--accent-color);
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        z-index: 10001;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Save list of used pics
function saveUsedPicsList() {
    // This would ideally copy files, but from client-side JS we can only track
    // In a real implementation, you'd do this server-side
    localStorage.setItem('sushmitha_used_pics', JSON.stringify(CONFIG.usedPics));
}

// Add CSS for toast animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
