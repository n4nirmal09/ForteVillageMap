export const SiteSetup = (function (window) {
    /* Main css Chunks */
    function _loadSiteCss() {
        return Promise.all([
            import(/* webpackChunkName: "main" */'@/scss/main.scss'),
        ])
    }

    /* Export css Chunk */
    function _loadExportCss() {
        return import(/* webpackChunkName: "exports" */'@/scss/exports/exports.scss')
    }

    /* Sprite Chunks */
    function _loadSPriteSVG() {
        return Promise.all([
            import("@/scripts/icons")
        ])
    }

    /* Pollyfill Chunks */
    function _loadPollyFills() {
        return Promise.all([
            import(/* webpackChunkName: "pollyFills" */"@/scripts/Pollyfills.js")
        ])
    }

    

    /* Modulle Chunks */
    function _loadModuleChunks() {
        return Promise.all([
            import('@/scripts/maps'),
            import('@/scripts/dropdowns'),
            import('@/scripts/material-forms'),
        ])
    }

    /* Main Setup Class */ 
    const defaultSettings = {
        locale: "en",
        dateDisplayFormat: 'DD/MM/YYYY',
        dateAPIFormat: 'YYYY-MM-DD',
        scrollClassTrigger: 100,
        scrollBarWidth: 0,
        scrollerContainer: window,
        noImageUrl: require('@/assets/images/noimage.jpg').default,
    }

    class Setup {
        constructor() {
            this.name = 'Forte village map'
            this.wrapperElem = document.querySelector('.body-container-wrapper')
            this.modulesLoaded = false
            this.settings = Object.assign(defaultSettings,{})
            this.events = []
            this.#init()
        }

        async #init() {
            this.createEvents()
            await this.updateSettings() // Call for modules only after settings updated
            this.onPreLoad() // Preload Scripts
            await this.#loadModuleChunks() // Load chunks
            this.onLoad() // After Load Scripts
        }
        

        async #loadModuleChunks() {
            const loadedCss = _loadSiteCss.call(this) // Call Main CSS Parallel
            const loadedSprite = _loadSPriteSVG.call(this) // Call SVG sprite Parallel
            const loadedPolly = _loadPollyFills.call(this) // Call PollyFill Parallel
            const loadedChunks = _loadModuleChunks.call(this) // Call All Module chunks Parallel

            return new Promise(async (res, rej) => {
                await loadedCss
                await loadedSprite
                await loadedPolly
                await loadedChunks
                this.modulesLoaded = true
                res('loaded')
            })
            
        }

        async updateSettings() {
            return new Promise(async (res, rej) => {
                const {default:exportVars} = await _loadExportCss.call(this)
                this.settings = Object.assign(defaultSettings, {
                        breakpoints: {
                            desktop: 1280,
                            mobile: parseInt(exportVars.breakpointMobile)
                        },
                        colors: {
                            primary: exportVars.primary,
                            secondary: exportVars.secondary,
                            dark: exportVars.dark,
                            light: exportVars.light
                        },
                    }
                )
                res(true)
            })
            
        }

        // Events
        createEvents() {
            this.events['majorlayoutChange'] = new CustomEvent('majorlayoutChange', {
                bubbles: true,
                detail: {
                    getSiteSetup: () => this
                }
            })
        }

        eventDispatcher(event) {
            window.dispatchEvent(this.events[`${event}`])
        }

        // On preload
        onPreLoad() {
            this.addingEventListeners()
            this.scrollBarWidthUpdate()
        }

        // On site load
        async onLoad() {
            this.wrapperElem.classList.add('loaded') // Adding wrapper Load class
        }

        

        // Others

        // Scroll related
        scrollThreshhold() {
            const scrollerContainer = this.settings.scrollerContainer || window
            if ((scrollerContainer.scrollTop || scrollerContainer.scrollY) > this.settings.scrollClassTrigger) {
                document.querySelector('body').classList.add('scrolled')
                return
            } 
            document.querySelector('body').classList.remove('scrolled');
        }

        scrollDirCheck(e) {
            let delta = ((e.deltaY || -e.wheelDelta || e.detail) >> 10) || 1
            if (delta > 0) {
                document.querySelector('body').classList.remove('scrolling-up')
                document.querySelector('body').classList.add('scrolling-down')
                return
            } 

            document.querySelector('body').classList.remove('scrolling-down')
            document.querySelector('body').classList.add('scrolling-up')
        }
    
        scrollBarWidthUpdate() {
            const outer = document.createElement("div")
            outer.style.visibility = "hidden"
            outer.style.width = "100px"
            outer.style.msOverflowStyle = "scrollbar" // needed for WinJS apps
    
            document.body.appendChild(outer)
    
            const widthNoScroll = outer.offsetWidth
            // force scrollbars
            outer.style.overflow = "scroll"
    
            // add innerdiv
            const inner = document.createElement("div")
            inner.style.width = "100%"
            outer.appendChild(inner)
    
            const widthWithScroll = inner.offsetWidth
    
            // remove divs
            outer.parentNode.removeChild(outer)
            this.settings.scrollBarWidth = widthNoScroll - widthWithScroll
        }
        
        // Lissteners
        addingEventListeners() {
            const scrollerContainer = this.settings.scrollerContainer
            scrollerContainer.addEventListener('scroll', (e) => this.scrollThreshhold(e))
            scrollerContainer.addEventListener('mousewheel', (e) => this.scrollDirCheck(e))
            scrollerContainer.addEventListener('DOMMouseScroll', (e) => this.scrollDirCheck(e))
        }
    }

    return {
        Setup
    }
})(window)

export default SiteSetup
