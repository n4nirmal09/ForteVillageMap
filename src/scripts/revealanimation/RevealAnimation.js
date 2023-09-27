import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger"
import {addScrollController, refreshAllControllers} from "@/scripts/common/api/scrolltrigger.services"

gsap.registerPlugin(ScrollTrigger)


export default class RevealAnimations {
    constructor(container) {
        this.$el = container
        this.animation = this.$el.dataset.animation
        this.options = {
            trigger: this.$el.dataset.trigger || this.$el,
            triggerHook: this.$el.dataset.hook || 'top bottom',
            triggerEndHook: this.$el.dataset.endHook || 'bottom top',
            toggleActions: this.$el.dataset.toggleAction || 'play',
            offset: this.$el.dataset.offset || 0,
            reverse: this.$el.dataset.reverse || true,
            defaultDuration: this.$el.dataset.duration || 1,
            defaultRevealEase: this.$el.dataset.ease || "power2.inOut",
            defaultStagger: this.$el.dataset.stagger || 0.1,
            delay: this.$el.dataset.delay || 0
        }
        this.initAlpha = true
        this.scrollController = null
        this.scrollOptions = null
        this.tween = null

        // Setting up the ele, overriding css reset
        if(this.initAlpha) gsap.set(this.$el, { autoAlpha: 1 })

        
    }

    addCallbacks() {
        if(this.onCompleteCallBack) this.tween.eventCallback('onComplete', () => this.onCompleteCallBack())
        if(this.onStartCallBack) this.tween.eventCallback('onComplete', () => this.onStartCallBack())
    }

    addScrollController() {
        if (!this.tween) return
        this.addCallbacks()
        let scrollOptions = {
            scroller: site.settings.scrollerContainer,
            animation: this.tween,
            trigger: this.options.trigger,
            start: () => {
                return this.options.triggerHook
            },
            toggleActions: this.options.toggleActions,
            //markers: true
            //endTrigger: "#otherID",
            //end: this.options.triggerEndHook,
            // onToggle: self => console.log("toggled, isActive:", self.isActive),
            // onUpdate: self => {
            //     console.log("progress:", self.progress.toFixed(3), "direction:", self.direction, "velocity", self.getVelocity());
            // }
        }

        if (this.scrollOptions) Object.assign(scrollOptions, this.scrollOptions)

        this.scrollController = ScrollTrigger.create(scrollOptions)
        addScrollController(this.scrollController)
    }
}
