export default ({local}) => {
    console.log(local)
    return `<div class="hotel-detail">
                <div class="hotel-detail__header">
                    <h3 class="hotel-detail__header-title"></h3>
                    <span class="hotel-detail__back-link btn btn-text">
                    <svg class="icon-svg icon-svg--outline mr-1">
                        <use class="times" xlink:href="#icon-times"></use>
                        <use class="angle" xlink:href="#icon-angle-left"></use>
                    </svg><span class="hotel-detail__back-link-text">${ local.backToListBtn || 'Back to list'}</span></span>
                </div>
                <div class="hotel-detail__body">
                    <div class="hotel-detail__featured-image bg-img aspect-ratio--4x3"></div>
                    <div class="hotel-detail__content">
                        <div class="hotel-detail__address"></div>
                        <h3 class="hotel-detail__title"></h3>
                        <p class="hotel-detail__description"></p>
                    </div>
                </div>
                <div class="hotel-detail__action"><a class="hotel-detail__link btn btn-outline-dark btn-block" href="#">${ local.goToWebsiteBtn || 'Go to website'}</a></div>
            </div>`
}