export default () => {
    return `<div class="file-tile">
    <div class="file-tile__meta"><span class="file-tile__extension display-7 btn btn-primary--faded-light"></span></div>
    <div class="file-tile__content">
       <div class="file-tile__head">
          <h6 class="file-tile__name text-primary"></h6>
          <span class="file-tile__size display-7"></span>
       </div>
       <div class="file-tile__error my-1 display-7 text-error">
       </div>
       <div class="file-tile__progress-bar my-1">
          <div class="progress-wrapper">
             <div class="progress bg-secondary--faded-light">
                <div class="progress-bar bg-secondary" role="progressbar" aria-valuemin="0" aria-valuemax="100"></div>
             </div>
          </div>
       </div>
    </div>
    <div class="file-tile__actions"><a class="file-tile__action-delete btn btn-icon  btn-fab btn-secondary--faded-light" href="#"><i class="material-icons">delete</i></a></div>
 </div>`
}

