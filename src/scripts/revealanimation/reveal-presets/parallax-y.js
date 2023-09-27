import { gsap } from "gsap";
import RevealAnimation from "../RevealAnimation.js"
class Parallax extends RevealAnimation {
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

    parallax() {
        const $eleChild = this.$el.children
        let tween = gsap.timeline()
        let from = 100
        let to = -20
        

        gsap.from(this.$el, { autoAlpha: 0 }) // for smooth reveal

        tween.from($eleChild, {
            duration: 1,
            //y: () => `${bgHeight / 2}px`,
            yPercent: from,
            rotation: 0.001,
            ease: 'none'
        })
        .to($eleChild, {
            duration: 1,
            //y: () => `${bgHeight / 2}px`,
            yPercent: to,
            rotation: 0.001,
            ease: 'none'
        })

        this.scrollOptions = {
            scrub: true
        }
        this.tween = tween
    }
}


// Calling
(function () {
    window.addEventListener('load', function() {
        let revealAnimationElements = document.querySelectorAll('[data-animation="parallax-y"]')
        revealAnimationElements.forEach((ele) => {
            new Parallax(ele)
        })
    })
})()
