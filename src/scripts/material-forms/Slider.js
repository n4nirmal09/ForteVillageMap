import { gsap } from "gsap"
const CLASS_PRE = 'generic-slider'


function _loadSliderCSS() {
    return import(/* webpackChunkName: "ui-slider" */'@/scss/slider/ui-slider.base.scss')
}
function _loadSliderJS() {
    return import(/* webpackChunkName: "uiSliderJs" */'noUiSlider')
}

export const Slider = (() => {
    class RangeSlider {
        constructor(container, options) {
            this.container = container
            this.sliderEle = this.container.querySelector(`.${CLASS_PRE}__slider`)
            this.slider = null
            this.options = Object.assign({
                sliderOptions: {
                    start: [20, 80],
                    connect: true,
                    range: {
                        'min': 0,
                        'max': 100
                    }
                },
                inputSetting: {},
                showText: false,
                valuePrefix: '',
                cssPrefix: 'ui-slider-',
            },{
                ...options,
                ...this.container.dataset.options ? JSON.parse(this.container.dataset.options) : {}
            })


            this.minText = null
            this.maxText = null

            this.interpolationMap = []

            this.events = []

            this.onslideTimmer = null

            this._init()
        }

        async _init() {
            this._createEvents()
            this._createInterpolationMap()
            await _loadSliderCSS.call(this)
            window.noUiSlider = await _loadSliderJS.call(this)
            this.sliderCreate()
            if(this.options.showText) this.createText()
            this.container.getSlider = () => this

            this._addEventListeners()
        }

        _createEvents() {
            this.events['sliderChange'] = new CustomEvent('sliderChange', {
                bubbles: true,
                detail: {
                    getVal: () =>  this.slider?.get()
                }
            })

            this.events['sliderUpdate'] = new CustomEvent('sliderUpdate', {
                bubbles: true,
                detail: {
                    getVal: () =>  this.slider?.get(),
                    getPositions: () => this.slider?.getPositions()
                }
            })
        }

        _createInterpolationMap() {
            const inputSetting = this.options.inputSetting
            this.interpolationMap = inputSetting.valueInterpolate ? inputSetting.valueInterpolate.map((value) => parseInt(value.percent)) : []
        }

        sliderCreate() {
            this.slider = noUiSlider.create(this.sliderEle, {
                ...this.options.sliderOptions,
                cssPrefix: this.options.cssPrefix,
                padding: [0, 0],
            });
        }

        createText() {
            const sliderOptions = this.options.sliderOptions
            if(typeof sliderOptions.start === 'number') {
                this.minText = this.createInput('min')
                return
            }
            
            if(typeof sliderOptions.start === 'object' && sliderOptions.start.length >= 1) {
                sliderOptions.start.forEach((value, i) => {
                    if(i === 0) {
                        this.minText = this.createInput('min')
                        return
                    }
                    if(i === 1) {
                        this.maxText = this.createInput('max')
                        return
                    }
                });
            }

            const textGroup = document.createElement('div')
            textGroup.classList.add(`${CLASS_PRE}__text-group`)
            if(this.minText) textGroup.appendChild(this.minText)
            if(this.maxText) textGroup.appendChild(this.maxText)

            this.container.appendChild(textGroup)

            this.updateFields()
        }

        createInput(type) {
            const textField = document.createElement('div')
            textField.classList.add(`${CLASS_PRE}__text-group-field`, `${CLASS_PRE}__text-group-field--${type}`)
            textField.innerHTML = `<div class="form-outline form-outline--icon-right"><input class="form-outline__input form-control" value="" placeholder=" "> <label class="form-outline__label">
            ${this.options.inputSetting[`${type}PlaceHolder`] || type}
            </label></div><label></label>`
            // const input = document.createElement('input')
            // input.classList.add('form-control')
            // textField.appendChild(input)
            return textField
        }

        // Slider utilities
        reset() {
            this.slider.reset()
        }

        setValue(val) {
            this.slider.set(val)
        }

        // Snap utils
        snapValues(val) {
            return gsap.utils.snap({values:[...this.interpolationMap]}, val)
        }

        // Htmls updates
        updateFields() {
            const values = [...this.slider.get()]
            if(this.minText) this.updateFieldValue(this.minText, this.interpolatedValue(values[0]))
            if(this.maxText) this.updateFieldValue(this.maxText, this.interpolatedValue(values[1]))
        }

        interpolatedValue(val) {
            if(this.interpolationMap.length === 0) return Math.round(val)
            return this.options.inputSetting.valueInterpolate.find((interVal) => interVal.percent === this.snapValues(val)).value || this.snapValues(val)
        }

        updateFieldValue(field, value) {
            const input = field.querySelector('input')
            input.value = `${value} ${this.options.valuePrefix}`
        }

        addActiveClassForDropdowns(add) {
            if(this.onslideTimmer) clearTimeout(this.onslideTimmer);
            if(add) {
                document.body.classList.add('prevent-dropdown-close');
                return
            }

            this.onslideTimmer = setTimeout(() => {
                document.body.classList.remove('prevent-dropdown-close')
            }, 500)
        }

        // EVent callbacks
        onUpdate() {
            this.updateFields()
            this.container.dispatchEvent(this.events['sliderUpdate'])
        }

        onChange() {
            this.container.dispatchEvent(this.events['sliderChange'])
        }

        onStart() {
            const insideDropdown = !!this.container.closest('.dropdown-menu')
            if(insideDropdown) this.addActiveClassForDropdowns(true)
        }

        onEnd() {
            const insideDropdown = !!this.container.closest('.dropdown-menu')
            if(insideDropdown) this.addActiveClassForDropdowns(false)
        }



        _addEventListeners() {
            this.slider.on('update', () => this.onUpdate());
            this.slider.on('change', () => this.onChange());
            this.slider.on('start', () => this.onStart());
            this.slider.on('end', () => this.onEnd());
            
        }
    }

    return {
        RangeSlider
    }
})()

export default Slider