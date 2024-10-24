// Image sequence setup
const appleSequenceImages = [];
const treeSequenceImages = [];

// Load apple sequence images
for (let i = 0; i <= 110; i++) {
    appleSequenceImages.push(`images/apple/${`000${i}`.slice(-4)}.png`);
}

// Load tree sequence images
for (let i = 110; i >= 0; i--) {
    treeSequenceImages.push(`images/tree/${`000${i}`.slice(-4)}.png`);
}

// Cross-browser requestAnimationFrame
const requestAnimationFrame = window.requestAnimationFrame || 
    window.mozRequestAnimationFrame || 
    window.webkitRequestAnimationFrame || 
    window.msRequestAnimationFrame;

// EventEmitter class for handling events
class EventEmitter {
    listeners = {}
    addListener(eventName, fn) {
        this.listeners[eventName] = this.listeners[eventName] || [];
        this.listeners[eventName].push(fn);
        return this;
    }
    once(eventName, fn) {
        this.listeners[eventName] = this.listeners[eventName] || [];
        const onceWrapper = () => {
            fn();
            this.off(eventName, onceWrapper);
        }
        this.listeners[eventName].push(onceWrapper);
        return this;
    }
    off(eventName, fn) {
        let lis = this.listeners[eventName];
        if (!lis) return this;
        for (let i = lis.length; i > 0; i--) {
            if (lis[i] === fn) {
                lis.splice(i, 1);
                break;
            }
        }
        return this;
    }
    emit(eventName, ...args) {
        let fns = this.listeners[eventName];
        if (!fns) return false;
        fns.forEach((f) => {
            f(...args);
        });
        return true;
    }
}

// Canvas class for rendering images
class Canvas {
    constructor(e) {
        this.images = e.images;
        this.container = e.container;
        this.cover = e.cover;
        this.displayIndex = 0;
    }

    setup() {
        this.canvas = document.createElement("canvas");
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    renderIndex(e) {
        if (this.images[e]) {
            return this.drawImage(e);
        }
        for (let t = Number.MAX_SAFE_INTEGER, r = e; r >= 0; r--)
            if (this.images[r]) {
                t = r;
                break;
            }
        for (let n = Number.MAX_SAFE_INTEGER, i = e, o = this.images.length; i < o; i++)
            if (this.images[i]) {
                n = i;
                break;
            }
        this.images[t] ? this.drawImage(t) : this.images[n] && this.drawImage(n);
    }

    drawImage(e) {
        this.displayIndex = e;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const x = Math.floor((this.canvas.width - this.images[this.displayIndex].naturalWidth) / 2);
        const y = Math.floor((this.canvas.height - this.images[this.displayIndex].naturalHeight) / 2);
        this.ctx.drawImage(this.images[this.displayIndex], x, y);
    }

    resize() {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.canvas.style.height = `${h}px`;
        this.canvas.style.width = `${w}px`;
        this.canvas.height = h;
        this.canvas.width = w;

        this.renderIndex(this.displayIndex);
    }
}

// Image loader class
class ImgLoader extends EventEmitter {
    constructor(opts) {
        super();
        this.images = opts.imgsRef;
        this.imageNames = opts.images;
        this.imagesRoot = opts.imagesRoot;
        this.sequenceLength = opts.images.length;
        this.complete = false;
        this.loadIndex = 0;

        this.loadNextImage();
    }

    loadImage(e) {
        if (this.images[e]) {
            return this.loadNextImage();
        }
        const onLoad = () => {
            img.removeEventListener('load', onLoad);
            this.images[e] = img;
            if (e === 0) {
                this.emit('FIRST_IMAGE_LOADED');
            }
            this.loadNextImage();
        }
        const img = new Image();
        img.addEventListener('load', onLoad);
        img.src = (this.imagesRoot ? this.imagesRoot : '') + this.imageNames[e];
    }

    loadNextImage() {
        if (this.loadIndex < this.imageNames.length) {
            this.loadImage(this.loadIndex++);
        } else {
            this.complete = true;
            this.emit('IMAGES_LOADED');
        }
    }
}

// Scroll sequence class
class ScrollSequence {
    constructor(opts) {
        this.opts = {
            container: 'body',
            imagesRoot: '',
            cover: false,
            ...opts
        }
        this.container = typeof opts.container === 'object' ?
            opts.container :
            document.querySelector(opts.container);

        this.images = Array(opts.images.length);
        this.imagesToLoad = opts.images;

        this.loader = new ImgLoader({
            imgsRef: this.images,
            images: this.imagesToLoad,
            imagesRoot: this.opts.imagesRoot,
        });

        this.canvas = new Canvas({
            container: this.container,
            images: this.images,
            cover: this.opts.cover
        });

        this.init();
    }

    init() {
        this.canvas.setup();
        this.loader.once('FIRST_IMAGE_LOADED', () => {
            this.canvas.renderIndex(0);
        });
        this.loader.once('IMAGES_LOADED', () => {
            console.log('Sequence Loaded');
        });
    }
}

// Initialize apple and tree sequences
const appleSequence = new ScrollSequence({
    container: '.apple-sequence',
    images: appleSequenceImages,
    imagesRoot: './images/apple/',
});

const treeSequence = new ScrollSequence({
    container: '.tree-sequence',
    images: treeSequenceImages,
    imagesRoot: './images/tree/',
});

// Slider functionality
let currentSlide = 0;
const slides = document.querySelector('.slides');
const totalSlides = document.querySelectorAll('.slide').length;

function showSlide(index) {
    if (index >= totalSlides) {
        currentSlide = 0;
    } else if (index < 0) {
        currentSlide = totalSlides - 1;
    } else {
        currentSlide = index;
    }
    slides.style.transform = `translateX(-${currentSlide * 100}%)`;
}

// Auto slide every 5 seconds
setInterval(() => {
    showSlide(currentSlide + 1);
}, 5000);

// Tab functionality
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const tab = button.getAttribute('data-tab');
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
        });
        document.getElementById(`tab${tab}`).style.display = 'block';
    });
});
