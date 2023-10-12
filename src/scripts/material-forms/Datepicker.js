import { Dropdown } from '@/scripts/dropdowns/Dropdown'
import { utilities, formUtils } from '@/scripts/common/utilities'
import {
    DATE_TIME_LOCAL,
    MONTH_NAMES,
    DAYS_SHORT
} from '@/scripts/config/locale.config'

export class DatepickerSelect extends Dropdown.DropdownMain {
    constructor(container) {
        super(container, 'selectDropdownDatepicker')
        this.pickerEle = this.container.querySelector('.datepicker')
        this.pickerEleB = this.container.querySelector('.datepicker--b')
        this.picker = null
        this.pickerB = null
        this.pickerOptions = this.pickerEle.dataset.pickerOptions ? JSON.parse(this.pickerEle.dataset.pickerOptions) : {}
        this.pickerBOptions = this.pickerEleB && this.pickerEleB.dataset.pickerOptions ? JSON.parse(this.pickerEleB.dataset.pickerOptions) : {}
        this.selectedValue = null
        this.selectedValueB = null
        this.events = []
        this._init()
    }

    async _init() {
        this.createEvents()
        this._initMenu()
        this._addEVentListeners()
        this.createPicker()
        this.container.getDropdown = () => this
    }

    async createPicker() {
        this.picker = await new Datepicker(this.pickerEle, {
            ...this.pickerOptions
        }).init()
        if (this.pickerEleB) {
            this.pickerB = await new Datepicker(this.pickerEleB, {
                ...this.pickerOptions
            }).init()
        }

        this.picker.pickerShow()

        this.picker.addEventListener('dateSelected', (e) => this.onDateSelected(e))

        this.picker.addEventListener('dateApplied', (e) => this.onDateApplied(e, true))

        this.picker.addEventListener('dateCanceled', (e) => this.onDateApplied(e, false))

        if (this.pickerB) {
            this.pickerB.pickerShow()
            this.pickerB.addEventListener('dateSelected', (e) => this.onDateSelectedB(e))
            this.pickerB.addEventListener('dateApplied', (e) => this.onDateApplied(e, true))
            this.pickerB.addEventListener('dateCanceled', (e) => this.onDateApplied(e, false))
        }
        this.container.getDatePicker = () => [this.picker, this.pickerB]

    }

    // EVents custon
    createEvents() {
        super.createEvents()
        this.events['selected'] = new CustomEvent('selected', {
            bubbles: false,
            detail: {
                getSelectedValue: () => [this.selectedValue, this.selectedValueB]
            }
        })

        this.events['applied'] = new CustomEvent('applied', {
            bubbles: false,
            detail: {
                getSelectedValue: () => [this.selectedValue, this.selectedValueB]
            }
        })

        this.events['canceled'] = new CustomEvent('canceled', {
            bubbles: false,
            detail: {
                getSelectedValue: () => [this.selectedValue, this.selectedValueB]
            }
        })
    }

    // Callbacks
    onDateSelected(e) {
        this.selectedValue = e.detail.getValue()
        this.container.dispatchEvent(this.events['selected'])
    }

    onDateSelectedB(e) {
        this.selectedValueB = e.detail.getValue()
        this.container.dispatchEvent(this.events['selected'])

    }

    onDateApplied(e, applied) {
        console.log(e)
        if (!applied) {
            this.container.dispatchEvent(this.events['canceled'])
            return
        }
        //this.selectedValue = e.detail.getValue()
        this.container.dispatchEvent(this.events['applied'])
    }

    // Listeners
    _addEVentListeners() {
        //super._addEVentListeners()
        if (this.trigger.tagName.toLowerCase() === 'input') this.trigger.addEventListener('focus', (e) => !this.show && this.openPanel())

        if (this.trigger.tagName.toLowerCase() !== 'input')
            this.trigger.addEventListener('click', (e) => {
                e.preventDefault()
                !this.show? this.openPanel() : this.closePanel()
            })

        // Nulling on document click
        document.addEventListener('click', (event) => {
            const isClickInside = this.container.contains(event.target) || this.menu.contains(event.target)
            !isClickInside && this.show && this.closePanel()
        })
    }
}

export class Datepicker extends EventTarget {
    constructor(container, options) {
        super()
        if (!($ instanceof Function || jQuery instanceof Function)) {
            console.log('Please Add jQuery for daterange picker')
            return
        }
        this.container = container
        this.input = container.querySelector('[data-picker-input]') || null
        this.labelLinkInput = this.input.dataset.labelLink ? document.querySelector(`${this.input.dataset.labelLink}`) : null
        this.singleDatepicker = this.input.dataset.dateSingle || true
        this.totalSpan = this.input.dataset.maxSpan || 120;

        this.today = new Date()
        this.tomorrow = new Date(new Date().setDate(new Date().getDate() + 1))
        this.minEndDate = new Date(new Date().setDate(new Date().getDate() + 4))

        this.startDate = this.input.dataset.startDate || this.input.value || this.tomorrow
        this.endDate = this.input.dataset.endDate || this.minEndDate
        this.minDate = this.input.dataset.minDate || false

        this.events = []

        this.options = {
            pickerOptions: {
                "autoApply": true,
                "locale": {
                    ...DATE_TIME_LOCAL,
                    "monthNames": MONTH_NAMES,
                    "daysOfWeek": DAYS_SHORT
                },
                "maxSpan": false,
                "linkedCalendars": false,
                "parentEl": this.container,
                "startDate": this.startDate,
                "endDate": this.endDate,
                "minDate": this.minDate,
                "singleDatePicker": this.singleDatepicker,
                ...{
                    ...options,
                    ...this.input.dataset.pickerOptions ? JSON.parse(this.input.dataset.pickerOptions) : {}
                }

            }
        }

    }

    init() {
        this.createEvents()
        return new Promise(async (resolve, reject) => {
            if (window.daterangepicker instanceof Function) {
                this.container && this.buildPicker()
                resolve(this)
                return
            }
            await import(/* webpackChunkName: "daterangepicker" */'@/scss/vendors/daterange.scss')
            await utilities.loadScript(`https://cdn.jsdelivr.net/momentjs/latest/moment.min.js`, 'momentJs')
            await utilities.loadScript(`/js/Plugins/daterangepicker.js`, 'daterangeJs')
            this.container && this.buildPicker()
            resolve(this)
        })
    }

    createEvents() {
        this.events['dateSelected'] = new CustomEvent('dateSelected', {
            bubbles: false,
            detail: {
                getValue: () => this.input.value || null
            }
        })

        this.events['dateApplied'] = new CustomEvent('dateApplied', {
            bubbles: false,
            detail: {
                getValue: () => this.input.value || null
            }
        })

        this.events['dateCanceled'] = new CustomEvent('dateCanceled', {
            bubbles: false,
            detail: {
                getValue: () => this.input.value || null
            }
        })
    }

    buildPicker() {
        $(this.input).daterangepicker(this.options.pickerOptions)
        this.syncVal()
        this._addingEventListeners()
    }

    syncVal() {
        const labelLinkInput = this.labelLinkInput
        let dates = this.input.value.split(' - ')
        const selectedStartDate = dates[0] ? moment(new Date(dates[0])).format(site.settings.dateDisplayFormat) : null
        const selectedEndDate = dates[1] ? moment(new Date(dates[1])).format(site.settings.dateDisplayFormat) : null

        if (labelLinkInput && this.labelLinkInput.nodeName === 'INPUT') {
            labelLinkInput.value = !selectedEndDate ? `${selectedStartDate}` : `${selectedStartDate} - ${selectedEndDate}`
            return
        }

        if (labelLinkInput) {
            labelLinkInput.innerHTML = !selectedEndDate ? `${selectedStartDate}` : `${selectedStartDate} - ${selectedEndDate}`
        }

    }

    getValue() {
        return this.input.value
    }

    // Utility functions
    pickerShow() {
        $(this.input).data('daterangepicker').show()
    }

    _setStartDate(startDate) {
        const pickerInput = this.input
        $(pickerInput).data('daterangepicker').setStartDate(startDate)
        $(pickerInput).data('daterangepicker').updateView()
        return this
    }

    _setEndDate(endDate) {
        const pickerInput = this.input
        $(pickerInput).data('daterangepicker').setEndDate(endDate)
        $(pickerInput).data('daterangepicker').updateView()
        return this
    }

    _setMinDate(minDate) {
        const pickerInput = this.input
        $(pickerInput).data('daterangepicker').setMinDate(minDate)
        $(pickerInput).data('daterangepicker').updateView()
        return this
    }

    // Callbacks
    onInputChange(e) {
        this.syncVal()

        this.dispatchEvent(this.events['dateSelected'])
    }

    onInputApply(ev, picker) {
        this.syncVal()
        this.dispatchEvent(this.events['dateApplied'])
    }

    onInputCanceled(ev, picker) {
        this.syncVal()
        this.dispatchEvent(this.events['dateCanceled'])
    }

    // Listeners
    _addingEventListeners() {
        $(this.input).on('change', (e) => this.onInputChange(e))

        $(this.input).on('apply.daterangepicker', (ev, picker) => this.onInputApply(ev, picker));
        $(this.input).on('cancel.daterangepicker', (ev, picker) => this.onInputCanceled(ev, picker));
    }
}