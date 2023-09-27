import { gsap } from "gsap";
import RevealAnimation from "../RevealAnimation.js"
const CLASS_PRE = 'banner-counter-info'
export class CounterUp extends RevealAnimation {
    constructor(container, options) {
        super(container)
        this.animation = this.$el.dataset.animation
        this.title = this.$el.querySelector(`.${CLASS_PRE}__article-title`) || this.$el
        this.format = this.$el.dataset.format
        this.start = this.$el.dataset.start
        this.end = this.$el.dataset.end
        this.duration = this.$el.dataset.duration || 2
        this.initAlpha = false
        this.counter = {
            val: this.start
        }
        this.options = Object.assign(this.options, {
            defaultDuration: this.duration,
            ...options
        })
        this.init()
    }

    init() {
        this.counterTween()
        this.addScrollController()
    }

    counterTween() {
        this.tween = gsap.to(this.counter, {
            val: this.end,
            duration: this.options.defaultDuration,
            onUpdate: () => {
                this.updateValue()
            }
        })
    }

    updateValue() {
        this.title.innerHTML = this.formatString()
    }

    formatString() {

        if(this.format) {
            return this.addNumberSeperator().replace(/^([\d-,]*)$/g, this.format)
        } else {
            return this.addNumberSeperator()
        }
        
    }

    addNumberSeperator() {
        return Math.round(this.counter.val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
}

// Calling

