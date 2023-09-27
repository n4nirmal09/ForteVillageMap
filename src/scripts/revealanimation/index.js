(function () {
    window.addEventListener('load', () => {
        setTimeout(() => {
            // Common tranisitions
            let revealAnimationElements = document.querySelectorAll('.reveal-animate')
            revealAnimationElements.forEach(async (ele) => {
                const {CommonTransition}  = await import(/* webpackChunkName: "revealCommonTransitions" */'./reveal-presets/common-transitions')
                new CommonTransition(ele)
            })

            // Counter Ups
            let counterUps = document.querySelectorAll('[data-animation*="counter-up"]')
            counterUps.forEach(async (cu) => {
                const {CounterUp}  = await import(/* webpackChunkName: "revealCommonCounter" */'./reveal-presets/counter')
                new CounterUp(cu)
            })

            // Parallax
            let parallaxElems = document.querySelectorAll('[data-animation="parallax"]')
            parallaxElems.forEach(async (pe) => {
                const {Parallax}  = await import(/* webpackChunkName: "revealCommonParallax" */'./reveal-presets/parallax')
                new Parallax(pe)
            })

        }, 500)
    })
})()
