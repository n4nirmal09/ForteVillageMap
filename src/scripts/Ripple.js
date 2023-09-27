import { gsap } from "gsap";
export default class Ripple {
    constructor(container) {
        this.$el = container || document.body
        this.ripple = null
        this.rippleSize = 20
        this.tween = null
        this.cleanUpTimer = null
        this.center = !!this.$el.dataset.rippleCenter || false
        this.init()
    }

    init() {
        this.addListners()
        this.$el.getRipple = () => this
    }

    clearRipple() {
        this.ripple && this.ripple.remove()
        this.tween && this.tween.kill()
        this.rippple = null
        this.tween = null
    }

    drawRipple(e) {
        this.clearRipple()
        this.cleanUpTimer && clearTimeout(this.cleanUpTimer)
        this.ripple = document.createElement('span')
        const diameter = Math.max(this.$el.clientWidth, this.$el.clientHeight)
        const radius = diameter / 2
        const eleRect = this.$el.getBoundingClientRect()
        this.ripple.style.width = this.ripple.style.height = diameter > 20 ? `${diameter}px` : `${this.rippleSize}px`
        this.ripple.style.left = !this.center ? `${e.clientX - (eleRect.left + radius)}px` : '50%'
        this.ripple.style.top = !this.center ? `${e.clientY - (eleRect.top + radius)}px` : '50%'
        this.ripple.classList.add('ripple-wave')

        gsap.set(this.ripple, { scale: 0 })
        if (this.center) gsap.set(this.ripple, { scale: 0, xPercent: -50, yPercent: -50 })

        this.$el.appendChild(this.ripple)

        this.tween = gsap.to(this.ripple, {
            scale: 2,
            autoAlpha: 0,
            duration: 0.4,
            //onComplete: () => this.clearRipple()
        })

        this.cleanUpTimer = setTimeout(() => {
            this.clearRipple()
        }, 2000)
    }

    addListners() {
        this.$el.addEventListener('click', (e) => this.drawRipple(e))
    }
}

(function () {
    document.querySelectorAll('[data-ripple]').forEach((ele) => new Ripple(ele))
})()