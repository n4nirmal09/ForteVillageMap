(() => {
    const selectDropdowns = document.querySelectorAll('[data-dropdown-select]')
    selectDropdowns.forEach(async (sd) => {
        const { SelectDropdown } = await import(/* webpackChunkName: "materialSelect" */'./Select')
        new SelectDropdown(sd)
    })
    
    // Module injection to HTML
    const dependables = window.moduleChunks?.utilities || []
    dependables.forEach(async (file) => {
        switch (file) {
            case 'select':
                const { SelectDropdown } = await import(/* webpackChunkName: "materialSelect" */ './Select')
                window.SelectDropdown = SelectDropdown
                break
        }
    }) 
})()