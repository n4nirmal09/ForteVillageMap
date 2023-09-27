import GMap from "./GMap"
import { API } from '@/scripts/common/api/api.services'
import {
    GOOGLE_MAP_STYLE
} from '@/scripts/config/google.config.js'

import modalTpl from "./templates/map-modal.template"
import { utilities } from "@/scripts/common/utilities"

export const MapController = (() => {
    class ForteVillageMap {
        constructor(container, options) {
            this.container = container
            this.mapCanvas = null
            this.spotDetailsModal = null
            this.spotsDetailModalActive = false
            this.spotDetailClose = null
            this.activeSpot = null
            this.Map = null
            this.googleMapLoaderOptions = {}
            this.APIServices = new API.Controller()
            this.mapLoading = false
            this.markers = this.container.dataset.markers || []
            this.markersLoading = false
            this.markersFilter = ['all']
            this.modal = false
            this.options = Object.assign({
                mapOptions: {
                    restriction: {
                        latLngBounds: {
                            north: 38.94287213966831,
                            south: 38.92836424033743,
                            east: 8.937440372730721,
                            west: 8.924896661531204,
                        },
                        strictBounds: false,                     
                    },
                    zoom: 18,
                    center: { lat: 38.932583, lng: 8.932833 },
                    minZoom: 18,
                    disableDefaultUI: true,
                    styles: ''
                },
                stylesURL: GOOGLE_MAP_STYLE,
                classPrepend: 'interactive-map'
            },{
                ...options
            })

            this.groundOverlays = this.container.dataset.groundOverlays ? JSON.parse(this.container.dataset.groundOverlays) : []
            
            this._init()
        }

        async _init() {
            !this.Map && this.mapSetup()
        }

        // Setup 
        async mapSetup() {
            this.mapLoading = true;
            this.createHTML();
            this.updateHTML();
            const styles = await this.fetchGMapStyles()
            await this.fetchMarkers()
            this.options.mapOptions.styles = styles
            this.initGoogleMap()
            const images = await this.loadOverlayImages()
            this.mapLoading = false;
            this.updateHTML();
            this._addEventListeners()
        }


        // HTML creations
        createHTML() {
            this.createMapCanvas()
            this.createSpotDetailsModal()
        }

        createMapCanvas() {
            if (this.mapCanvas) this.mapCanvas.remove()
            this.mapCanvas = document.createElement('div')
            this.mapCanvas.classList.add(`${this.options.classPrepend}__canvas`)
            this.container.appendChild(this.mapCanvas)
        }

        createSpotDetailsModal() {
            if(this.spotDetailsModal) this.spotDetailsModal.remove()
            this.spotDetailsModal  = utilities.createNodeParsing(modalTpl({
                mainClass: `${this.options.classPrepend}-modal`
            }))
            this.spotDetailClose = this.spotDetailsModal.querySelector(`.${this.options.classPrepend}-modal__header-close`)
            this.container.appendChild(this.spotDetailsModal)

        }

        // Fetching Styles
        async fetchGMapStyles() {
            return this.APIServices.getFetch(this.options.stylesURL)
                    .then((data) => {
                        this.markersLoading = false
                        return data
                    })
        }

        // Google map 
        async initGoogleMap() {
            if(!this.mapCanvas) return
            this.Map = null
            this.Map = new GMap(this.mapCanvas, this.googleMapLoaderOptions)
            const google = await this.Map.loadMap()
            this.Map.setMap(google, this.options.mapOptions)
            this.updateMarkers()
            this.updateGroundOverlay()
        }

        //Markers
        // ---- Fetching Markersdata
        async fetchMarkers() {
            if(!this.markers || this.markers.length === 0) return
            if (!this.APIServices.isJson(this.markers)) {
                this.markersLoading = true
                return this.APIServices.getFetch(this.markers)
                    .then((data) => {
                        this.markersLoading = false
                        this.markers = data
                        return this.markers
                    })
            }
            return this.parseData(JSON.parse(this.markers))
        }

        updateMarkers() {
            if(!this.Map) return
            const hotSpots = this.markers
            this.Map.removeAllMarkers()
            hotSpots.forEach(spot => {
                if( (this.markersFilter.findIndex((markerType) => markerType === spot.type || markerType === 'all') !== -1 ) )
                    this.Map.addMarker(`${spot.latitude} ${spot.longitude}`, {
                        ...spot
                    })
            })
        }

        // Modal detail functions
        showModal(show) {
            this.spotsDetailModalActive = show
            this.spotsDetailModalActive ? this.spotDetailsModal.classList.add(`${this.options.classPrepend}-modal--show`) :
            this.spotDetailsModal.classList.remove(`${this.options.classPrepend}-modal--show`)
        }

        updateModal() {
            if (!this.spotDetailsModal || !this.activeSpot) return
            const spot = this.activeSpot
            // const $title = this.spotDetailsModal.querySelector(`.${this.options.classPrepend}-modal__title`)
            const headerTitle = this.spotDetailsModal.querySelector(`.${this.options.classPrepend}-modal__header-title`)
            const detail = this.spotDetailsModal.querySelector(`.${this.options.classPrepend}-modal__detail`)
            // const $body = this.spotDetailsModal.querySelector(`.${this.options.classPrepend}-modal__body`)
            const description = this.spotDetailsModal.querySelector(`.${this.options.classPrepend}-modal__description`)
            // const $link = this.spotDetailsModal.querySelector(`.${this.options.classPrepend}-modal__link`)

            // $title.innerHTML = spot.name || ''
            headerTitle.innerHTML = spot.name || ''
            detail.innerHTML = spot.details || ''
            description.innerHTML = spot.description || ''
            // function isEmptyOrSpaces(str) {
            //     return str === null || str.match(/^ *$/) !== null || str === "null" || str === "Null";
            // }
            // if (!isEmptyOrSpaces(`${spot.link}`)) {
            //     $link.style.display = "inline-flex";

            //     $link.setAttribute('href', `${spot.link}`)
            // }
            // else {
            //     $link.style.display = "none";
            // }
            // // $link.setAttribute('href', `${spot.link}`)
            this.featuredImage()
        }

        // Overlay image loader
        async loadOverlayImages() {
            if(!this.groundOverlays.length) return
            
            return Promise.all( this.groundOverlays.map(async (GO) => utilities.loadImage(GO.overlay)))
            
        }

        // Featured Spot image
        async featuredImage($imagePanel, src) {
            const $image = $imagePanel || this.spotDetailsModal.querySelector(`.${this.options.classPrepend}-modal__featured-image`)
            const imgSrc = src || this.activeSpot["image"]
            $image.classList.remove(`bg-img--loaded`)
            $image.classList.add(`bg-img--preload-small`)
            let imageLoaded = ''
            try {
                imageLoaded = await utilities.loadImage(imgSrc)
            } catch (err) {
                imageLoaded = ''
                $image.style.backgroundImage = `url(${settings.noImageUrl})`
            }

            if (imageLoaded === 'loaded') $image.style.backgroundImage = `url(${imgSrc})`
            $image.classList.add(`bg-img--loaded`)
            $image.classList.remove(`bg-img--preload-small`)
        }

        // Html updates
        updateHTML() {
            this.mainLoaders()
            this.updateModal()
        }

        // Set ground overlays
        updateGroundOverlay() {
            if(!this.Map) return
            const mainOverlay = this.groundOverlays[0]
            this.Map.setGroundOverlay(mainOverlay.coordinates, mainOverlay.overlay)
        }

        // Loaders
        mainLoaders() {
            let mainLoader = this.container.querySelector(`.${this.options.classPrepend}__loader`)
            if(mainLoader) mainLoader.remove()
            this.container.classList.remove(`${this.options.classPrepend}--loading`)
            if(!this.mapLoading)  return

            this.container.classList.add(`${this.options.classPrepend}--loading`)
            mainLoader = document.createElement('div');
            mainLoader.classList.add(`${this.options.classPrepend}__loader`)
            mainLoader.innerHTML = `<span class="spinner"><span class="spinner-border"><span class="sr-only">loading ...</span></span></span>`
            this.container.appendChild(mainLoader)
        }

        // Callbacks
        onMarkerClick(e) {
            const value = e.detail.getValue()
            const marker = e.detail.getMarker()
            this.activeSpot = value
            this.Map.mapPanTo(marker)
            this.updateHTML()
            if (!this.spotsDetailModalActive) this.showModal(true)
        }

        // Resize Func
        _responsiveFunc() {
            return utilities.debounce(() => {
                // Resize funcs here
            }, 250)
        }

        // EventListeners
        _addEventListeners() {
            this.container.addEventListener("markerClick", (e) => this.onMarkerClick(e))
            this.spotDetailClose.addEventListener("click", () => this.spotsDetailModalActive && this.showModal(false))

            window.addEventListener('resize', this._responsiveFunc())
        }
    }
    return {
        ForteVillageMap
    }
})()