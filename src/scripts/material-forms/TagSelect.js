import { createPopper } from '@popperjs/core'
import gsap from "gsap";
export const TagSelect = class {
    constructor(container, options) {
        this.container = container;
        this.tagItems = this.container.dataset.tags ? JSON.parse(this.container.dataset.tags) : [];
        this.tagInput = this.container.querySelector('.tag-generator__input');
        this.tagBody = this.container.querySelector('.tag-generator__body');
        this.events = {}
        this.dropdownMenu = ''
        this.dropdownActive = false
        this._init();
    }

    _init() {
        this.createEvents();
        this.createDropdown();
        this.tagItemsUpdate();
        this.addEventListener();
        this.container.getTagSelect = () => this;
    }

    createEvents() {
        this.events['updated'] = new CustomEvent('updated', {
            detail: {
                getTags: () => this.tagItems
            }
        })
    }

    tagItemsUpdate() {
        this.clearAllTags();
        this.tagItems.forEach((tagItem) => {
            const tag = document.createElement('span')
            tag.classList.add('tag-pill')
            tag.innerHTML = `${tagItem.name}`
            this.tagBody.insertBefore(tag, this.tagInput)
        });
       
        this.container.dataset.tags = JSON.stringify(this.tagItems)
        this.tagInput.value = ''
        this.dropDownMenuUpdate();
        this.container.dispatchEvent(this.events['updated'])
        
    }

    pushTagItem(newItem) {
        if(!newItem.name) return
        if(this.tagItems.findIndex((item) => item.name === newItem.name) !== -1) return
        this.tagItems.push(newItem);
        this.tagItemsUpdate();
    }

    removeTagItem(itemIndex) {
        this.tagItems.splice(itemIndex, 1)
        this.tagItemsUpdate()
    }

    clearAllTags() {
        const allTags = this.tagBody.querySelectorAll('.tag-pill');
        allTags.forEach((tag) => tag.remove());
    }

    // Dropdowns
    createDropdown() {
        this.clearDropDown()
        this.dropdownMenu = dropDownMenu({
            text: this.tagInput.value.trim()
        });
        document.body.appendChild(this.dropdownMenu);
        this.dropdownMenu.popper = createPopper(this.tagInput, this.dropdownMenu, {
            placement: `bottom-start`,
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
                                    return []
                            }
                        }
                    },
                },
            ],
        })

        const tagCreateTrigger = this.dropdownMenu.querySelector('.create-tag-trigger')
        tagCreateTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            if(this.tagItems.findIndex((item) => item.name === this.tagInput.value.trim()) !== -1) {
                this.tagInput.focus()
                return
            }
            this.pushTagItem({
                name: this.tagInput.value.trim()
            })
            this.tagInput.focus()
        })
    }

    showDropDown(show) {
        
        if(show) {
            this.dropdownActive = true
            gsap.to(this.dropdownMenu, {
                duration: 0.4,
                autoAlpha: 1
            })
            return
        }

        gsap.to(this.dropdownMenu, {
            duration: 0.4,
            autoAlpha: 0
        })
        this.dropdownActive = false
        
    }

    clearDropDown() {
        if(!this.dropdownMenu) return
        this.dropdownMenu.remove()
        
    }

    dropDownMenuUpdate() {
        if(!this.dropdownMenu) return;
        const dropdownTagpill = this.dropdownMenu.querySelector('.tag-pill')
        dropdownTagpill.innerHTML = `${this.tagInput.value.trim()}`;
        this.dropdownMenu?.popper?.update()
    }

    onInputFocus() {
        this.dropDownMenuUpdate();
        this.showDropDown(true)
    }

    onKeyUp() {
        this.dropDownMenuUpdate()
    }

    onBackspace() {
        if(this.tagInput.value.trim() !== '') return
        if(this.tagItems.length === 0) return
        this.removeTagItem(this.tagItems.length - 1, 1)
    }
    

    addEventListener() {
        this.tagInput.addEventListener('focus', (e) => this.onInputFocus())
        this.tagInput.addEventListener('keyup', (e) => this.onKeyUp())

        this.tagInput.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'Backspace': 
                    this.onBackspace()
                break
                case 'Enter':
                    this.pushTagItem({
                        name: this.tagInput.value.trim()
                    })
                break
            }
        })

        // Nulling on document click
        document.addEventListener('click', (event) => {
            const isClickInside = this.container.contains(event.target) || this.dropdownMenu.contains(event.target)
            
            !isClickInside && this.dropdownActive && this.showDropDown(false)
        })

        //this.tagInput.addEventListener('blur', (e) => this.onInputFocus(false))
    }
}

function  dropDownMenu({...options}) {
    const dropdown = document.createElement('div');
    dropdown.classList.add('dropdown-menu', 'dropdown-menu--tag-select')
    dropdown.innerHTML = `<div class="dropdown-menu__body p-4"><div class="d-flex flex-wrap align-items-center"><a class="create-tag-trigger text-primary" href="#">Create</a> : <span class="tag-pill mx-1">${options.text}</span></div></div>`
    return dropdown;
}