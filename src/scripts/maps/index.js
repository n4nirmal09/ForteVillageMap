
(function () {
    let fmaps = document.querySelectorAll('.forte-map')
    fmaps.forEach(async (map) => {
        const { MapController } = await import(/* webpackChunkName: "maps" */'./Maps')
        new MapController.ForteVillageMap(map)
    })

    const dependables = window.moduleChunks?.utilities || []
    dependables.forEach(async (file) => {
        switch (file) {
            case 'maps':
                const { MapController } = await import(/* webpackChunkName: "maps" */ './Maps')
                window.MapController = MapController
                break
        }
    }) 
})()


