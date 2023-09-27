import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger"
import utilities from "@/scripts/common/utilities"
import {addScrollController, refreshAllControllers} from "@/scripts/common/api/scrolltrigger.services"
gsap.registerPlugin(ScrollTrigger)

export class LazyLoad {
    constructor(container) {
        this.$el = container
        this.imgTag = !!this.$el.dataset.img || false
        this.screenSrcs = JSON.parse(this.$el.dataset.imageArray)
        this.sortedScreenSrcs = this.screenSrcs.slice().reverse()
        this.noImageUrl = site.settings.noImageUrl
        this.loadingSrc = ""
        this.prevLoadingSrc = ""
        this.loadingImage = false
        this.loadingError = false
        this.scrollController = null
        this.resizeFunc = null
        this.events = {}
        this.init()
    }

    init() {
        this.createEvents()
        this.$el.classList.add('bg-img--preload')
        this.addingListeners()
    }

    createEvents() {
        this.events['lazyloadedImage'] = new CustomEvent('lazyloadedImage', {
            bubbles: true,
            detail: {
                element: () => this.$el
            }
        })

        this.events['lazyloadedImageError'] = new CustomEvent('lazyloadedImageError', {
            bubbles: true,
            detail: {
                element: () => this.$el
            }
        })
    }

    imageFactory() {
        this.findingLoadingSrc()
        if (this.loadingSrc) this.loadImage()
    }

    findingLoadingSrc() {

        for (let i = 0; i < this.sortedScreenSrcs.length; i++) {
            if (window.innerWidth > this.sortedScreenSrcs[i].screen) {
                this.loadingSrc = this.sortedScreenSrcs[i].src
                break
            }
        }
    }

    loadImage() {
        if (this.prevLoadingSrc === this.loadingSrc) return
        this.loadingImage = true
        this.loadingError = false
        this.loadingClasses()
        utilities.loadImage(this.loadingSrc)
            .then(() => {
                this.loadingImage = false
                this.prevLoadingSrc = this.loadingSrc
                !this.imgTag ? this.addImageBg() : this.addImageTag()
                this.$el.dispatchEvent(this.events['lazyloadedImage'])
            })
            .catch(() => {
                this.loadingImage = false
                this.loadingError = true
                !this.imgTag ? this.addImageBg() : this.addImageTag()
                this.$el.dispatchEvent(this.events['lazyloadedImageError'])
            })
    }

    addImageBg() {
        this.$el.style.backgroundImage = `url(${!this.loadingError ? this.loadingSrc : this.noImageUrl})`
        this.loadingClasses()
    }

    addImageTag() {
        const img = this.$el.querySelector('img')
        img.src = !this.loadingError ? this.loadingSrc : this.noImageUrl
        this.loadingClasses()
        refreshAllControllers()
    }

    loadingClasses() {
        if (this.loadingImage) {
            this.$el.classList.add('bg-img--preload')
            this.$el.classList.remove('bg-img--loaded')
        } else {
            this.$el.classList.remove('bg-img--preload')
            this.$el.classList.add('bg-img--loaded')
        }
    }

    addingListeners() {
        if (this.resizeFunc) window.removeEventListener('resize', this.resizeFunc, false)

        this.scrollController = ScrollTrigger.create({
            scroller: site.settings.scrollerContainer,
            trigger: this.$el,
            start: () => 'top bottom',
            onEnter: () => {
                this.resizeFunc = utilities.debounce(() => {
                    this.imageFactory()
                }, 250)
                this.imageFactory()
                window.addEventListener('resize', this.resizeFunc)

            }
        })

        addScrollController(this.scrollController)
    }

    // addingListenersScrollMagic() {
    //     if (this.resizeFunc) window.removeEventListener('resize', this.resizeFunc, false)

    //     this.scrollController = new ScrollMagic.Controller()

    //     const scene = new ScrollMagic.Scene({
    //             triggerElement: this.$el,
    //             triggerHook: 'onEnter'
    //         })
    //         .on('enter', () => {
    //             this.resizeFunc = utilities.debounce(() => {
    //                 this.imageFactory()
    //             }, 250)
    //             this.imageFactory()
    //             window.addEventListener('resize', this.resizeFunc)
    //         })
    //         .addTo(this.scrollController);
    // }

}

export default LazyLoad