(function() {
    const Dropdowns = document.querySelectorAll('.dropdown')
    Dropdowns.forEach(async (dd) => {
        if(dd.hasAttribute('data-picker') || dd.hasAttribute('data-dropdown-select') || dd.hasAttribute('data-picker') || dd.hasAttribute('data-dropdown-select-datepicker')) return
        const {Dropdown} = await import(/* webpackChunkName: "dropdowns" */'./Dropdown')
        new Dropdown.List(dd)
    })
}())