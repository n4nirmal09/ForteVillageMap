import * as GoogleMap from '@googlemaps/js-api-loader';
import { GOOGLE_API_KEY } from '@/scripts/config/google.config'
import mapStyles from './map.style'

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
            disableDefaultUI: false,
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
        this.groundOverlay - null
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

    addMarker(loc, details) {
        const locString = loc.trim().split(" ")
        const lat = locString[0]
        const long = locString[1]

        const marker = new google.maps.Marker({
            position: new google.maps.LatLng(lat, long),
            //label: labels[labelIndex++ % labels.length],
            icon: details.pin || this.svgMarker,
            details: {
                ...details
            }
        })
        marker.setMap(this.Map)
        marker.addListener("click", () => this.markerClick(marker))
        this.markers.push(marker)
        return marker

    }

    removeAllMarkers() {
        this.selectedMarker = null
        this.markers.forEach((marker) => {
            marker.setMap(null)
        })
        this.markers = []
    }

    // GroundOverlays
    setGroundOverlay(coords, OverlayImg) {
        this.removeGroundOverlays()
        const imageBounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(coords.S, coords.W),//South West coordinates
            new google.maps.LatLng(coords.N, coords.E)); //North east coordinates

        this.groundOverlay = new google.maps.GroundOverlay(OverlayImg, imageBounds);
        this.addGroundOverlays()
    }

    addGroundOverlays() {
        if (!this.groundOverlay) return
        this.groundOverlay.setMap(this.Map);
    }

    removeGroundOverlays() {
        if (!this.groundOverlay) return
        this.groundOverlay.setMap(null)
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

        if (this.selectedMarker === marker) return
        this.selectedMarker = marker
        this.markers.forEach((marker) => {
            marker.setIcon(marker.details.pin || this.svgMarker)
            marker.setZIndex(1)
        })
        this.selectedMarker.setIcon(this.selectedMarker.details.pin || this.svgMarkerActive)
        this.selectedMarker.setZIndex(2)
    }

    markerClick(marker) {
        this.toggleMarkerActive(marker)
        this.$map.dispatchEvent(this.events['markerClick'])
    }

    onMapZoom() {
        this.$map.dispatchEvent(this.events['mapZoomed'])
    }

    // Marker Utilities
    selectMarker(marker) {
        new google.maps.event.trigger(marker, 'click')
    }

    // Listeners
    _addListeners() {
        this.Map.addListener("zoom_changed", () => this.onMapZoom())
    }
}