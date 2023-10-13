import { gsap } from "gsap"
import { Dropdown } from '@/scripts/dropdowns/Dropdown'
import { utilities } from '@/scripts/common/utilities'

export class SelectDropdown extends Dropdown.DropdownMain {
    constructor(container) {
        super(container, 'selectDropdownList')
        this.selectedValue = null
        this.selectOptions = gsap.utils.toArray(this.container.querySelectorAll('.dropdown-item'))

        this.selectSwitches  = !!this.container.dataset.dropdownSelectSwitches || false
        this.widget = null
        this.widgetSubmitBtnTitle = this.container.dataset.widgetFooterBtnTitle || 'Add'
        this.widgetContainer = null
        this.widgetShown = false

        this.events = []
        this._init()
    }

    _init() {
        this.createEvents()
        this._addEVentListeners()
        this.updateSelected()
        this._initMenu()
        this.container.getSelectDropDown = () => this
    }

    // EVents custon
    createEvents() {
        super.createEvents()
        this.events['selected'] = new CustomEvent('selected', {
            bubbles: true,
            detail: {
                getSelectedValue: () => this.selectedValue,
                getSelectedWidget: () => this.widget,
                getSelectedWidgetContainer: () => this.widgetContainer
            }
        })
    }

    // Selected value update
    updateSelected() {
        this.selectedValue = null
        this.selectOptions.forEach((option, iOption) => {
            if (option.hasAttribute('data-selected')) {
                this.selectedValue = {
                    value: option.dataset.value,
                    label: option.dataset.label || option.dataset.value,
                    widget: option.dataset.widget || null,
                    ele: option
                }
                if (this.selectedValue.widget) this.switchWidget()
            }
        })
        this.container.dispatchEvent(this.events['selected'])
    }
    

    // Html updates
    updateInput() {
        if(!this.selectedValue) {
            this.trigger.value = ''
            return
        }
        this.trigger.value = this.selectedValue.label
    }

    updateMenuList(input) {
        super.updateMenuList(input)
    }

    // Callbacks
    selectOption(e) {
        e.preventDefault()
        //if(e.currentTarget.hasAttribute('data-selected')) return
        this.selectOptions.forEach(option => {
            option.removeAttribute('data-selected')
        })
        e.currentTarget.setAttribute('data-selected', true)
        this.updateSelected()
    }

    onSelect(e) {
        this.updateInput()
        if (this.selectedValue?.widget) {
            this.showWidget(true)
            return
        }
        this.show && this.closePanel()
    }

    onInputChange() {
        return utilities.debounce((e) => {
            this.updateMenuList(e.target)
        }, 500)
    }

    setValue(val='') {
        if (!this.selectOptions) return
        this.selectOptions.forEach($item => {
            if($item.dataset.value === val) {
                $item.setAttribute('data-selected',true)

                return
            }
            $item.removeAttribute('data-selected')
        })
        this.updateSelected()
    }

    refresh() {
        this.selectOptions = this.menu.querySelectorAll('.dropdown-item')
        this.selectOptions.forEach((option) => option.addEventListener("click", (e) => this.selectOption(e)))
        
    }

    _addEVentListeners() {
        if (this.trigger instanceof HTMLInputElement) {
            this.trigger.addEventListener('focus', (e) => !this.show && this.openPanel())
            //this.trigger.addEventListener('blur', (e) => this.show && this.closePanel())
            this.trigger.addEventListener('keydown', this.onInputChange())
        } else {
            if (this.triggerHook === 'click')
                this.trigger.addEventListener("click", (e) => !this.show ? this.openPanel() : this.closePanel())
            if (this.triggerHook === 'hover') {
                this.container.addEventListener('mouseover', (e) => !this.show && this.openPanel())
                this.container.addEventListener('mouseleave', (e) => this.show && this.closePanel())
            }
            
        }


        this.selectOptions.forEach((option) => {
            if(this.selectSwitches) return
            option.addEventListener("click", (e) => this.selectOption(e))
        })

        // Nulling on document click
        document.addEventListener('click', (event) => {
            const preventDropdownClose = document.body.classList.contains('prevent-dropdown-close')
            if(preventDropdownClose) return
            const isClickInside = this.container.contains(event.target) || this.menu.contains(event.target)
            !isClickInside && this.show && this.closePanel()
        })
        this.container.addEventListener('selected', (e) => this.onSelect(e))

        // Search input
        if (this.searchInput) {
            this.searchInput.addEventListener('keydown', this.onInputChange())
        }

    }
}