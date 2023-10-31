import GMap from "./GMap"
import { API } from '@/scripts/common/api/api.services'
import {
    GOOGLE_MAP_STYLE
} from '@/scripts/config/google.config.js'

import modalTpl from "./templates/map-modal.template"
import { utilities } from "@/scripts/common/utilities"
import { SelectDropdown } from "@/scripts/material-forms/Select"

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
            this.roadsURL = this.container.dataset.roads || null
            this.roads = []
            this.modal = false
            this.inlineMapOptions = this.APIServices.isJson(this.container.dataset.mapOptions) ? JSON.parse(this.container.dataset.mapOptions) : {}
            this.locale = this.APIServices.isJson(this.container.dataset.locale) ? JSON.parse(this.container.dataset.locale) : {
                "Go to": "Go to",
                "Close": "Close",
            }

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
                    zoomControl: true,
                    styles: '',
                    ...this.inlineMapOptions
                },
                stylesURL: this.container.dataset.mapStyles || null,
                classPrepend: 'interactive-map',
                markersFilterElement: document.querySelector(this.container.dataset.filterLink),
                appendLegendsTo: this.container.dataset.appendLegendsTo ? document.querySelector(this.container.dataset.appendLegendsTo) : null,
                appendNavigationTo: this.container.dataset.appendNavigationTo ? document.querySelector(this.container.dataset.appendNavigationTo) : null,
                editorMode: false
            }, {
                ...options
            })

            this.groundOverlays = this.container.dataset.groundOverlays ? JSON.parse(this.container.dataset.groundOverlays) : []
            this.navigationPanel = null

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
            this.updateFilterOptions()
            const styles = await this.fetchGMapStyles()
            await this.fetchMarkers()
            if(this.roadsURL) await this.fetchRoads()
           
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
            if (this.options.editorMode) this.mapCanvas.dataset.editorMode = true
            if (this.options.editorMode) this.container.innerHTML = `<div> Editor mode: true</div>`
            this.container.appendChild(this.mapCanvas)
        }

        createSpotDetailsModal() {
            if (this.spotDetailsModal) this.spotDetailsModal.remove()
            this.spotDetailsModal = utilities.createNodeParsing(modalTpl({
                mainClass: `${this.options.classPrepend}-modal`,
                locale: this.locale
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
            if (!this.mapCanvas) return
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
            if (!this.markers || this.markers.length === 0) return
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

        async fetchRoads() {
            if (!this.APIServices.isJson(this.roadsURL)) {
                return this.APIServices.getFetch(this.roadsURL)
                .then((data) => {
                    console.log(data)
                    return data
                })
            }
            
            return this.parseData(JSON.parse(this.roadsURL))
        }

        updateMarkers() {
            if (!this.Map) return
            const hotSpots = this.markers
            this.Map.removeAllMarkers()
            const filteredMarkers = hotSpots.filter((spot) => (this.markersFilter.findIndex((markerType) => markerType === spot.type || markerType === 'all') !== -1)).map((marker, markerIndex) => {
                return {
                    ...marker,
                    markerIndex
                }
            })
            filteredMarkers.forEach((spot, markerIndex) => {
                this.Map.addMarker(`${spot.latitude} ${spot.longitude}`, {
                    ...spot
                })
            })
            if (this.options.appendLegendsTo) this.createLegends(filteredMarkers)
        }

        createLegends(legends) {

            if (!this.options.appendLegendsTo) return
            const categories = legends.map((legend) => {
                return {
                    name: legend.categoryName || '',
                    value: legend.type
                }
            })

            this.options.appendLegendsTo.innerHTML = ``
            const legendList = document.createElement('ul')
            legendList.classList.add('legends-list')

            categories.forEach((category) => {
                const categoryColumn = document.createElement('li')
                categoryColumn.classList.add('legends-list__item')
                categoryColumn.innerHTML = `<span class="legends-list__category-name">${category.name || category.value}</span>`

                const categoryDropDown = this.createDropdowns(legends.filter((legend) => legend.type === category.value), {placeholder: this.locale['Search'] || 'Search', selectSwitches: true})
                
                categoryColumn.appendChild(categoryDropDown)
                legendList.appendChild(categoryColumn)
            })


            this.options.appendLegendsTo.appendChild(legendList)

        }

        createDropdowns(dropdownItems, { placeholder, selectSwitches }) {
            const categoryDropDown = document.createElement('div')
            categoryDropDown.classList.add('form-outline', 'form-outline--text-line', 'form-outline--icon-right')
            categoryDropDown.dataset.dropDownSelect = true
            if(selectSwitches) categoryDropDown.dataset.dropdownSelectSwitches = true
            categoryDropDown.innerHTML = `<input class="legends-list__filter-input form-outline__input form-control form-select form-solo" value="" placeholder="${placeholder}" data-toggle="dropdown-toggle" autocomplete="off"><i class="material-icons">expand_more</i>`

            const categoryList = document.createElement('ul')
            categoryList.classList.add('legends-list', 'legends-list--inner', 'dropdown-menu', 'dropdown-menu--select-options')
            dropdownItems.forEach((item) => {
                categoryList.appendChild(this.createDropdownItem({
                    ...item
                }, () => this.Map.selectMarker(item.markerIndex)))
            })

            categoryDropDown.appendChild(categoryList)
            new SelectDropdown(categoryDropDown)
            return categoryDropDown
        }

        createDropdownItem(item, onClickFB) {
            const legendItem = document.createElement('li')
            legendItem.classList.add('legends-list__item', 'dropdown-item')
            legendItem.dataset.label = `${item.name}`
            legendItem.dataset.value = `${item.value || item.type}`
            legendItem.innerHTML = `<span class="legends-list__legend-name">${item.name}</span>`
            if(typeof onClickFB === 'function') {
                legendItem.addEventListener('click', () => {
                    onClickFB()
                })
            }
            
            return legendItem
        }

        // Navigation
        createNavigation() {
            if (!this.options.appendNavigationTo) return
            const navigationContainer = this.options.appendNavigationTo
            navigationContainer.innerHTML = ``
            this.navigationPanel = null
            this.navigationPanel = document.createElement('div')
            this.navigationPanel.classList.add('map-navigation-panel')
            this.navigationPanel.appendChild(this.createNavigationUI())

            navigationContainer.appendChild(this.navigationPanel)

        }

        createNavigationUI() {
            const navigationDiv = document.createElement('div')
            navigationDiv.classList.add('map-navigation-panel__row')
            navigationDiv.innerHTML = `<span class="map-navigation-panel__col map-navigation-panel__col--title">${this.locale["Navigation"] || ''}</span>`
            
            const originCol = document.createElement('div')
            originCol.innerHTML = `<span>${this.locale["Origin"] || 'Origin'}</span>`
            originCol.classList.add('map-navigation-panel__col')
            const destinationCol = document.createElement('div')
            destinationCol.innerHTML = `<span>${this.locale["Destination"] || 'Destination'}</span>`
            destinationCol.classList.add('map-navigation-panel__col')
            const actionCol = document.createElement('div')
            actionCol.classList.add('map-navigation-panel__col', 'map-navigation-panel__col--action')

            const originField = this.createTextField(this.activeSpot, { readOnly: true })
            originCol.appendChild(originField)
            navigationDiv.appendChild(originCol)

            const markers = this.markers.filter((marker) => marker.name !== this.activeSpot.name).map(({name, value}) => {
                return {
                    name,
                    value: value || name
                }
            })
            const destinationField = this.createDropdowns(markers, {placeholder: this.locale['Search'] || 'Search'})
            destinationCol.appendChild(destinationField)
            navigationDiv.appendChild(destinationCol)

            const navigateBtn = document.createElement('span')
            navigateBtn.classList.add('btn', 'btn-outline-dark')
            navigateBtn.innerHTML = `${this.locale["Navigate"] || 'Navigate'}`
            actionCol.appendChild(navigateBtn)
            navigationDiv.appendChild(actionCol)
            
            return navigationDiv
        }

        createTextField(spot, options) {
            
            const formOutline = document.createElement('div')
            formOutline.classList.add('form-outline', 'form-outline--text-line', 'form-outline--icon-right')
            formOutline.innerHTML = `<input class="form-outline__input form-control form-solo" ${options.readOnly ? ' readOnly="true" ' : ''} value="${spot.name}" placeholder="Origin" autocomplete="off">`
            return formOutline
        }

        // Update filter options
        updateFilterOptions() {
            if (!this.options.markersFilterElement) {
                this.markersFilter = ['all']
                return
            }
            const inputs = this.options.markersFilterElement?.querySelectorAll('.map-filter__item-input')
            const checkedValues = []
            inputs.forEach((input) => {
                if (input.checked) checkedValues.push(input.value)
            })
            this.markersFilter = checkedValues

            const markersFilterInput = this.options.markersFilterElement?.querySelector('.map-filter__input')
            if (checkedValues.findIndex((val) => val === 'all') !== -1) {
                markersFilterInput.value = ''
                return
            }
            if (markersFilterInput) markersFilterInput.value = checkedValues.filter((val) => val !== 'all').join(', ')
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
            const $link = this.spotDetailsModal.querySelector(`.${this.options.classPrepend}-modal__link`)

            // $title.innerHTML = spot.name || ''
            headerTitle.innerHTML = spot.name || ''
            detail.innerHTML = spot.details || ''
            description.innerHTML = spot.description || ''
            function isEmptyOrSpaces(str) {
                return str === null || str.match(/^ *$/) !== null || str === "null" || str === "Null";
            }
            if (!isEmptyOrSpaces(`${spot.link}`)) {
                $link.style.display = "inline-flex";
                $link.setAttribute('href', `${spot.link}`)
                $link.innerHTML = spot.linkTitle ? `${spot.linkTitle}` : this.locale["Go to"]
            }
            else {
                $link.style.display = "none";
            }
            // // $link.setAttribute('href', `${spot.link}`)
            this.featuredImage()
        }

        // Overlay image loader
        async loadOverlayImages() {
            if (!this.groundOverlays.length) return

            return Promise.all(this.groundOverlays.map(async (GO) => utilities.loadImage(GO.overlay)))

        }

        // Featured Spot image
        async featuredImage($imagePanel, src) {
            const $image = $imagePanel || this.spotDetailsModal.querySelector(`.${this.options.classPrepend}-modal__featured-image`)
            const imgSrc = src || this.activeSpot["image"]
            $image.classList.remove('d-none')
            if (!imgSrc) {

                $image.classList.add('d-none')
                return
            }
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
            if (!this.Map) return
            this.Map.removeGroundOverlays()
            const mainOverlays = this.mainOverlaySetter()
            if (!mainOverlays.length) return
            mainOverlays.forEach((item) => this.Map.setGroundOverlay(item.coordinates, item.overlay))

        }

        mainOverlaySetter() {
            const zoomLevel = this.Map.getMap().getZoom()
            let mainOverlays = this.groundOverlays.filter((overlaySet) => zoomLevel >= overlaySet.zoomLevel)
            // this.groundOverlays.forEach((overlaySet) => {
            //     if(zoomLevel >= overlaySet.zoomLevel) mainOverlay = overlaySet
            // })

            return mainOverlays
        }

        // Loaders
        mainLoaders() {
            let mainLoader = this.container.querySelector(`.${this.options.classPrepend}__loader`)
            if (mainLoader) mainLoader.remove()
            this.container.classList.remove(`${this.options.classPrepend}--loading`)
            this.options.markersFilterElement?.classList.remove(`loading-map`)
            if (!this.mapLoading) return

            this.container.classList.add(`${this.options.classPrepend}--loading`)
            this.options.markersFilterElement?.classList.add(`loading-map`)
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
            this.createNavigation()
            //if (!this.spotsDetailModalActive) this.showModal(true)
        }

        onMapZoom(e) {
            const map = e.detail.getMap()
            const zoomLevel = map.getZoom()

            this.updateGroundOverlay()
        }

        onFilterChange(e) {
            this.updateFilterOptions()
            this.updateMarkers()
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
            this.container.addEventListener("mapZoomed", (e) => this.onMapZoom(e))

            const filterInputs = this.options.markersFilterElement?.querySelectorAll('.map-filter__item-input') || []
            filterInputs.forEach((input) => {
                input.addEventListener('change', (e) => this.onFilterChange(e))
            })

            window.addEventListener('resize', this._responsiveFunc())
        }
    }
    return {
        ForteVillageMap
    }
})()