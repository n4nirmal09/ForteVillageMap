(function(window) {
    window.addEventListener('load', function(){
        let lazyLoadedElems = document.querySelectorAll('.lazyload')
        setTimeout(function() {
            lazyLoadedElems.forEach(async (ele) => {
                const {LazyLoad} = await import(/* webpackChunkName: "lazyload" */'./Lazyload')
                new LazyLoad(ele)
            })
        }, 250)
    })
})(window)