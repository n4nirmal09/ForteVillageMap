export const Forms = (() => {

    class FormAuto{
        constructor(input, options) {
            this.input = input

            this._init()
        }

        _init() {
            this.setWidth()
            this._addEventListeners()
        }

        setWidth() {
            this.input.setAttribute('size', this.input.value.length);
        }

        _addEventListeners() {
            this.input.addEventListener('input', () => this.setWidth());
        }
    }

    class FormEdit{
        constructor(container, options) {
            this.container = container
            this.input = this.container.querySelector('.edit-form-inline__input')
            this.originalValue = this.input.value
            this.triggers = this.container.querySelectorAll('.edit-form-inline__trigger')
            this.actions = this.container.querySelector('.edit-form-inline__actions')
            this.actionSave = this.container.querySelector('.edit-form-inline__trigger-save')
            this.actionCancel = this.container.querySelector('.edit-form-inline__trigger-cancel')
            this.readonly = this.input.readOnly
            this.events = {}
            this._init()
        }

        _init() {
            this.createEvents()
            this._addEventListeners()
            this.container.getFormEdit = () => this
        }

        createEvents() {
            this.events['onSave'] = new CustomEvent('onSave', {
                detail: {
                    getValue: () => this.input.value
                }
            })
        }

        isEmpty(val) {
            return /^\s*$/.test(val)
        }

        setReadonly(readonly) {
            this.readonly = readonly
            if(this.readonly) {
                this.container.classList.remove('edit-form-inline--edit','edit-form-inline--focus')
                this.input.classList.add('no-interaction')
                this.actions.classList.remove('edit-form-inline__actions--active')
                this.triggers.forEach((trigger) => trigger.style.opacity = 1)
                this.input.readOnly = this.readonly
                this.input.blur()
                return
            }

            this.container.classList.add('edit-form-inline--edit', 'edit-form-inline--focus')
            this.input.classList.remove('no-interaction')
            this.actions.classList.add('edit-form-inline__actions--active')
            this.triggers.forEach((trigger) => trigger.style.opacity = 0)
            this.input.readOnly = this.readonly
            this.input.focus()
        }

        onSave(e) {
            if(this.isEmpty(this.input.value)) {
                this.input.value = this.originalValue
                !this.readonly && this.setReadonly(true)
                return
            }
            if(e.currentTarget.classList.contains('edit-form-inline__trigger-cancel')) {
                this.input.value = this.originalValue
                !this.readonly && this.setReadonly(true)
                return
            }
            this.originalValue = this.input.value
            !this.readonly && this.setReadonly(true)
            this.container.dispatchEvent(this.events['onSave'])
        }

        _addEventListeners() {
            this.triggers.forEach((trigger) => {
                trigger.addEventListener('click', () => {
                    this.readonly && this.setReadonly(false)
                })
            })

            // this.input.addEventListener('blur', (e) => {
            //     e.preventDefault()
            //     !this.readonly && this.setReadonly(true)
            // })
            this.input.addEventListener("keypress", (event) => {
                if (event.key === "Enter")  this.onSave(event)
            });

            [this.actionSave, this.actionCancel].forEach((trigger) => {
                trigger.addEventListener('click', (e) => this.onSave(e))
            })
        }
    }

    return {
        FormAuto,
        FormEdit
    }
    
})()