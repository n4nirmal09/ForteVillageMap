(async function(window){
    const {SiteSetup} = await import(/* webpackChunkName: "setup" */"./SiteSetup")

    window.site = new SiteSetup.Setup()
})(window)