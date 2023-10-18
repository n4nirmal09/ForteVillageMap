import * as GoogleMap from '@googlemaps/js-api-loader';
import { GOOGLE_API_KEY } from '@/scripts/config/google.config'
import mapStyles from './map.style'

const infoWindow = (({name, description, link, image}) => {
    return `<div class="info-window">
        <div class="info-window__body">
            <h3 class="info-window__title">${name}</h3>
            <div class="info-window__scrollable-area">
                <div class="info-window__desc">${description}</div>
                ${image ? `<img class="info-window__img" src="${image}" />` : ''}
            </div>
            
        </div>
    </div>`
})

export default class GMap {
    constructor(mapEle, loaderOptions) {
        this.$map = mapEle
        this.Map = null
        this.MapLoader = null
        this.googleMapLoaderOptions = loaderOptions || {}
        this.setupOptions = {
            center: { lat: 38.932583, lng: 8.932833 },
            zoom: 7,
            styles: mapStyles,
        }

        this.svgMarker = {
            path: "M8.1 4.1c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4 4 1.7 4 4z",
            fillColor: "yellow",
            fillOpacity: 1,
            strokeWeight: 0,
            rotation: 0,
            scale: 5
        }

        this.svgMarkerActive = {
            path: "M10.4 5.4c0 2.8-2.3 5.1-5.1 5.1s-5-2.4-5-5.1S2.6.3 5.4.3s5 2.3 5 5.1z",
            fillColor: "red",
            fillOpacity: 1,
            strokeWeight: 0,
            rotation: 0,
            scale: 8
        }

        this.markers = []
        this.selectedMarker = null

        this.events = []
        this.groundOverlays = []
        this.init()
    }

    init() {
        
        //this.initGoogleMap()
        this.mapEventsCreator()
    }

    // Google maps
    async loadMap() {
        this.MapLoader = new GoogleMap.Loader({
            apiKey: GOOGLE_API_KEY,
            version: "weekly",
            ...this.googleMapLoaderOptions
        })

        const promise = await new Promise((res, rej) => {
            this.MapLoader.load().then(() => {
                res(google)
            }).catch((err) => {
                rej(err)
            })
        })

        return promise
    }

    setMap(google, options) {
        this.Map = null
        const mapOptions = Object.assign(this.setupOptions, options)
        this.Map = new google.maps.Map(this.$map, mapOptions)
        this._addListeners()
    }

    setMapCenter(loc) {
        const locString = loc.split(" ")
        const lat = locString[0]
        const long = locString[1]

        this.Map.setCenter(new google.maps.LatLng(lat, long))
        const marker = this.markers.find(marker => (marker.details.latitude.toString() === lat && marker.details.longitude.toString() === long))
        if (marker) {
            this.toggleMarkerActive(marker)
        }
    }

    mapPanTo(marker) {
        this.Map.panTo(marker.getPosition());
    }


    getMap() {
        return this.Map
    }

    getMarkers() {
        return this.markers
    }

    iconMaker(icon, defaultIcon) {
        if (typeof icon === "string") return icon
        return {...defaultIcon, ...icon}
    }

    addMarker(loc, details) {
        const locString = loc.trim().split(" ")
        const x = details.x || 0
        const y = details.y || 0
        const offsetUnit = details.offsetUnit || 100000
        const lat = parseFloat(locString[0]) + (x * 1/offsetUnit)
        const long = parseFloat(locString[1]) + (y * 1/offsetUnit)
        const icon = this.iconMaker(details.icon, this.svgMarker)
        const label = details.label || null


        const marker = new google.maps.Marker({
            position: new google.maps.LatLng(lat, long),
            label: label,
            icon: icon,
            details: {
                ...details
            }
        })
        marker.setMap(this.Map)
        marker.addListener("click", () => this.markerClick(marker))
        marker.infoWindow = this.createInfoWindow(marker.details)
        this.markers.push(marker)
        return marker

    }

    removeAllMarkers() {
        this.selectedMarker = null
        this.markers.forEach((marker) => {
            marker.setMap(null)
            marker.infoWindow?.close()
        })
        this.markers = []
    }

    // GroundOverlays
    setGroundOverlay(coords, OverlayImg) {
        //this.removeGroundOverlays()
        const imageBounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(coords.S, coords.W),//South West coordinates
            new google.maps.LatLng(coords.N, coords.E)); //North east coordinates

        const overlay = {
            img: new google.maps.GroundOverlay(OverlayImg, imageBounds)
        }
        this.addGroundOverlay(overlay)
    }

    addGroundOverlay(overlay) {
        overlay.img.setMap(this.Map)
        this.groundOverlays.push(overlay)
    }

    removeGroundOverlays() {
        if (!this.groundOverlays.length) return
        this.groundOverlays.forEach((overlay, i) => {
            overlay.img.setMap(null)
            this.groundOverlays.splice(i,1)
        })
    }

    // Create Infowindows
    createInfoWindow(content) {
        let infoString = infoWindow(content)
        return new google.maps.InfoWindow({
            content: infoString,
        })
    }

    showInfoWindow(marker) {
        if(!marker.infoWindow) return
        marker.infoWindow.open({
            anchor: marker,
            map: this.Map
        })
    }

    // Events
    mapEventsCreator() {

        this.events['markerClick'] = new CustomEvent('markerClick', {
            bubbles: true,
            detail: {
                getMarker: () => this.selectedMarker,
                getValue: () => this.selectedMarker.details
            }
        })

        this.events['mapZoomed'] = new CustomEvent('mapZoomed', {
            bubbles: true,
            detail: {
                getMap: () => this.Map
            }
        })

    }

    // Event handlers
    toggleMarkerActive(marker) {

        if (this.selectedMarker === marker) {
            this.showInfoWindow(marker)
            return
        }
        this.selectedMarker = marker
        this.markers.forEach((marker) => {
            const icon = this.iconMaker(marker.details.icon, this.svgMarker)
            marker.setIcon(icon)
            marker.infoWindow?.close()
            marker.setZIndex(1)
        })
        this.selectedMarker.setIcon(this.iconMaker(marker.details.iconActive || marker.details.icon, this.svgMarkerActive))
        this.showInfoWindow(this.selectedMarker)
        this.selectedMarker.setZIndex(2)
    }

    

    markerClick(marker) {
        if(typeof marker === "number") {
            this.toggleMarkerActive(this.markers[marker])
            this.$map.dispatchEvent(this.events['markerClick']) 
            return
        }
        this.toggleMarkerActive(marker)
        this.$map.dispatchEvent(this.events['markerClick'])
    }

    onMapZoom() {
        this.$map.dispatchEvent(this.events['mapZoomed'])
    }

    // Marker Utilities
    selectMarker(marker) {
        if(typeof marker === "number") {
            new google.maps.event.trigger(this.markers[marker], 'click')
            return
        }
        new google.maps.event.trigger(marker, 'click')
    }

    // Listeners
    _addListeners() {
        this.Map.addListener("zoom_changed", () => this.onMapZoom())
    }
}