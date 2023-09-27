import { defaults } from "autoprefixer";
import { gsap } from "gsap";
import RevealAnimation from "../RevealAnimation.js"
export class CommonTransition extends RevealAnimation {
    constructor(container, animation) {
        super(container)
        this.animation = animation || this.$el.dataset.animation
        this.animationOptions = {
            ease: this.options.defaultRevealEase,
            delay: this.options.delay,
            duration: this.options.defaultDuration
        }
        this.init()
    }

    init() {
        this.switchAnimations()
        this.addScrollController()
    }

    switchAnimations() {
        switch (this.animation) {
            case 'stagger-from-bottom':
                this.tween = this.staggerFromBottom()
                break
            case 'from-bottom':
                this.tween = this.fromBottom()
                break
            case 'fade-in':
                this.tween = this.fadeIn()
                break
            case 'fade-in-stagger':
                this.tween = this.fadeInStagger()
                break
            default:
                this.tween = null
        }
    }

    // Animations

    staggerFromBottom() {
        const els = this.$el.children
        //gsap.set(els, { autoAlpha: 0 })
        
        return gsap.from(els, {
            autoAlpha: 0,
            y: 50,
            stagger: this.options.defaultStagger,
            ...this.animationOptions
        })
    }

    fromBottom() {
        return gsap.from(this.$el, {
            autoAlpha: 0,
            y: 50,
            ...this.animationOptions
        })
    }

    fadeInStagger() {
        const els = this.$el.children
        return gsap.from(els, {
            autoAlpha: 0,
            stagger: this.options.defaultStagger,
            ...this.animationOptions
        })
    }

    fadeIn() {
        return gsap.from(this.$el, {
            autoAlpha: 0,
            ...this.animationOptions,
        })
    }

    // Callback defining
    onCompleteCallBack() {
        const els = this.$el.children
        if (els.length) gsap.set(els, { clearProps: "transform" })
    }
}

export default CommonTransition
