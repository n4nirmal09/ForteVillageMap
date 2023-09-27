
(function () {
    let fmaps = document.querySelectorAll('.forte-map')
    fmaps.forEach(async (map) => {
        const { MapController } = await import(/* webpackChunkName: "maps" */'./Maps')
        new MapController.ForteVillageMap(map)
    })
})()


