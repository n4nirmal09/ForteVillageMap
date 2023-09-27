export const Menus = [];

export const addMenuService = (menu) => {
    Menus.push(menu)
}

export const destroyMenuServices = (menu) => {
    if(!menu.$el) return
    const index = Menus.findIndex(m => m.$el === menu.$el)
    if( index !== -1) {
        delete Menus[index]
        Menus.splice(index, 1)
    }
}

export const findActiveMenuService = () => {
    return Menus.find(menu => menu.active) || false
}

export const disableAllMenuService = () => {
    Menus.forEach((menu) => {
        menu.active && menu.close()
    })
}

export const anyMenuTweening = () => {
    return Menus.findIndex(menu => menu.tweening) >= 0
}