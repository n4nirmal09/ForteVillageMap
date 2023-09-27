export const ScrollControllers = []

export const addScrollController = (controller) => {
    if(controller) ScrollControllers.push(controller)
}

export const refreshAllControllers = () => {
    ScrollControllers.forEach(c => c.refresh(true))
}