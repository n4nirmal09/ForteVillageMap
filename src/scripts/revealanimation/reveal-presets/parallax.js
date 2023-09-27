import { gsap } from "gsap";
import RevealAnimation from "../RevealAnimation.js"
export class Parallax extends RevealAnimation {
    constructor(container, animation) {
        super(container)
        this.animation = this.$el.dataset.animation
        this.type = this.$el.dataset.parallaxType || 'background'

        this.init()
    }

    init() {
        this.parallax()
        this.addScrollController()
    }

    videoFixedPositioning() {
        const video = this.$el.querySelector('.bg-vid')
        const eleRect = this.$el.getBoundingClientRect()
        const bodyRect = document.body.getBoundingClientRect()
        video.style.position = 'fixed'

    }

    parallax() {
        const ele = this.$el
        const startHook = this.$el.dataset.parallaxStart
        let tween = gsap.timeline()
        let to = 50

        gsap.from(this.$el, { autoAlpha: 0 }) // for smooth reveal

        if (this.type === 'transform') {
            const bg = this.$el.querySelector('.bg-img') || this.$el.querySelector('.bg-vid') || this.$el
            const bgHeight = bg.getBoundingClientRect().height
            const bgWidth = bg.getBoundingClientRect().width
            tween.to(bg, {
                duration: 1,
                //y: () => `${bgHeight / 2}px`,
                yPercent: to,
                rotation: 0.001,
                ease: 'none'
            }, 0)
        } else {
            const bg = this.$el.querySelector('.bg-img') || this.$el
            const bgHeight = bg.getBoundingClientRect().height
            tween.to(bg, {
                duration: 1,
                backgroundPosition: () => `50% ${-bgHeight / 2}px`,
                ease: "none"
            }, 0)
        }

        this.scrollOptions = {
            scrub: true
        }
        this.tween = tween
    }
}
