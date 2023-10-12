import { createPopper } from '@popperjs/core'
import {utilities, formUtils} from '@/scripts/common/utilities'
import gsap from "gsap";
export const Dropdown = (() => {
    class DropdownMain {
        constructor(container, type) {
            this.container = container
            this.trigger = this.container.querySelector('[data-toggle]') || this.container
            this.triggerHook = this.trigger.dataset.triggerHook || 'click'
            this.menu = this.container.querySelector('.dropdown-menu')
            this.placement = this.menu.dataset.placement || 'bottom-start'
            this.offsetPlacement = this.menu.dataset.offsetPlacement || '[]'
            this.appendTo = this.menu.dataset.appendTo || null
            this.searchInput = this.container.querySelector('.dropdown-menu__search-input') || null
            this.selectOptions = this.container.querySelectorAll('.dropdown-item')
            this.type = type
            this.show = false
            this.events = []
            this.options= {
                duration: 0.2,
                ease: 'power3.easeInOut'
            }

            if(this.placement === 'left') {
                this.placement = 'left-start'
            }
        }

        _init() {
            this.createEvents()
            this._initMenu()
            this._addEVentListeners()
            this.container.getDropdown = () => this
        }

        createEvents() {
            this.events['panelUpdated'] = new CustomEvent('panelUpdated', {
                detail: {
                    panelShown: () => this.show
                }
            })
        }

        _initMenu() {
            gsap.set(this.menu, {
                pointerEvents: 'none',
                autoAlpha: 0
            })


            if(this.appendTo && document.querySelector(`${this.appendTo}`)) document.querySelector(`${this.appendTo}`).appendChild(this.menu)
        }

        _createDropdown() {
            if(this.appendTo && document.querySelector(`${this.appendTo}`)) {
                this.menu.style.maxWidth = `${this.container.getBoundingClientRect().width}px`
            }
            createPopper(this.trigger, this.menu, {
                placement: `${this.placement}`,
                //strategy: 'fixed',
                modifiers: [
                    {
                        name: 'offset',
                        options: {
                            offset: ({ reference, popper }) => {
                                switch (this.placement) {
                                    case 'bottom-end':
                                        return [0, 0]
                                        break
                                    default:
                                        return JSON.parse(this.offsetPlacement)
                                }
                            },
                        },
                    },
                ],
            })
        }

        // List update
        updateMenuList(inputItem) {
            const value = inputItem.value.trim().toLowerCase()
            
            this.selectOptions.forEach((option) => {
                const optionVal = option.dataset.label || option.dataset.value || ''
                //const optionVal = option.innerHTML
                if(!optionVal) return
                optionVal.toLowerCase()
                if(formUtils.isEmpty(value)) {
                    //option.innerHTML = optionVal
                    option.classList.remove('d-none')
                    return
                }
                
                let matchReg = new RegExp(`(${value})`, 'g')
                //option.innerHTML = optionVal.replace(matchReg, `<span class="highlight">$1</span>`)
                !optionVal.toLowerCase().match(matchReg) ? option.classList.add('d-none') : option.classList.remove('d-none')
            })
        }

        // Callbacks
        openPanel() {
            this.show = true
            gsap.set(this.menu, {clearProps: "all"})
            this._createDropdown()
            this.panelAnimation()
            this.container.dispatchEvent(this.events['panelUpdated'])
        }

        closePanel() {
            this.show = false
            this.panelAnimation()
            this.trigger.blur();
            this.container.dispatchEvent(this.events['panelUpdated'])
        }

        // Animations
        panelAnimation() {
            const tl = gsap.timeline()
            tl.to(this.menu, {
                autoAlpha: this.show ? 1 : 0,
                pointerEvents: this.show ? '' : 'none',
                duration: this.options.duration,
                ease: this.options.ease
            })
            // switch(this.placement) {
            //     case 'bottom-end':
            //         tl.to(this.menu, {
            //             y: this.show ? '+=20' : '-=20',
            //         }, 0)
            //         break
            // }
        }

        onInputChange(e) {
            return utilities.debounce(() => {
                this.updateMenuList(this.searchInput)
            }, 500)
        }

        // Listeners
        _addEVentListeners() {
            if (this.triggerHook === 'click')
                this.trigger.addEventListener('click', (e) => {
                    e.preventDefault()
                    
                    !this.show? this.openPanel() : this.closePanel()
                })

            if (this.triggerHook === 'hover') {
                this.container.addEventListener('mouseover', (e) => !this.show && this.openPanel())
                this.container.addEventListener('mouseleave', (e) => this.show && this.closePanel())
            }

            // Nulling on document click
            document.addEventListener('click', (event) => {
                const isClickInside = this.container.contains(event.target) || this.menu.contains(event.target)
                !isClickInside && this.show && this.closePanel()
            })

            // Search input
            if(this.searchInput ) {
                this.searchInput.addEventListener('keydown', this.onInputChange())
            }
        }

    }

    class List extends DropdownMain {
        constructor(container) {
            super(container, 'dropdownList')
            this._init()
        }
    }

    return {
        DropdownMain,
        List
    }
})()