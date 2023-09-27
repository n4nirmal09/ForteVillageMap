export default ({local={}, mainClass='modal'}) => {
    return `<div class="${mainClass}">
                <div class="${mainClass}__header">
                    <h4 class="${mainClass}__header-title"></h4>
                    <span class="${mainClass}__header-close btn btn-outline-gray-light" >
                        close
                    </span>
                </div>
                <div class="${mainClass}__body">
                    <div class="${mainClass}__content">
                        <p class="${mainClass}__detail display-6"></p>
                        <p class="${mainClass}__description small"></p>
                    </div>
                    <div class="${mainClass}__featured-image bg-img aspect-ratio--4x3"></div>
                </div>
                <div class="${mainClass}__action"><a class="${mainClass}__link btn btn-outline-gray-light btn-box" href="#">${ local.goToWebsiteBtn || 'Go to website'}</a></div>
            </div>`
}