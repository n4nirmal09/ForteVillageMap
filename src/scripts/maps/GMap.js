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
        this.editorMode = !!this.$map.dataset.editorMode  || false
        this.infoPopup = false
        this.zoomTimer = null
        this.setupOptions = {
            center: { lat: 38.932583, lng: 8.932833 },
            zoom: 7,
            styles: mapStyles,
        }

        this.svgMarker = {
            path: "M8.1 4.1c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4 4 1.7 4 4z",
            fillColor: "blue",
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

        this.spotlightIcon = './images/spotlight.png'

        this.markers = []
        this.selectedMarker = null

        this.events = []
        this.groundOverlays = []

        this.iconAnimateInterval = null
        this.iconAnimateTimeout = null

        this.spotlightMarkers = []
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
            libraries: ['places', 'marker'],
            ...this.googleMapLoaderOptions
        })

        const promise = await new Promise((res, rej) => {
            this.MapLoader.importLibrary('maps').then(() => {
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
        if(typeof defaultIcon === "string") return defaultIcon
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


        // const circleMarker = new google.maps.Marker({
        //     map: this.Map,
        //     position: new google.maps.LatLng(lat, long),
        //     icon: {
        //         ...this.svgMarker,
        //         scale: 3.5,  
        //         anchor: new google.maps.Point(4, 7) 
        //     },
        //     zIndex: 0  // Make sure it's behind the main icon
        // });

        const mainMarker = new google.maps.Marker({
            map: this.Map,
            position: new google.maps.LatLng(lat, long),
            title: label,
            label: label,
            icon: typeof icon === "string" ? {
                url: icon,
                //scaledSize: new google.maps.Size(18, 18),
            } : icon,
            details: {
                ...details
            },
            //zIndex: 1
        })
        //mainMarker.setMap(this.Map)

        const markerObj = {
            //circleMarker,
            mainMarker
        }
        markerObj.mainMarker.addListener("click", () => this.markerClick(markerObj))
        if(this.infoPopup) marker.infoWindow = this.createInfoWindow(marker.details)
        this.markers.push(markerObj)
        return markerObj

    }
    

    removeAllMarkers() {
        this.selectedMarker = null
        this.markers.forEach((marker) => {
            marker.mainMarker.setMap(null)
            if(this.infoPopup) marker.infoWindow?.close()
        })
        this.markers = []
        this.clearActiveMarkers()
    }

    // GroundOverlays
    setGroundOverlay(coords, OverlayImg) {
        //this.removeGroundOverlays()
        
        const imageBounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(coords.S, coords.W),//South West coordinates
            new google.maps.LatLng(coords.N, coords.E)); //North east coordinates

        const overlay = {
            img: new google.maps.GroundOverlay(OverlayImg, imageBounds),
        }
        this.addGroundOverlay(overlay)
    }

    addGroundOverlay(overlay) {
        if(this.editorMode) overlay.img.addListener("rightclick", (e) => this.onRightClick(e))
        
        overlay.img.setMap(this.Map)
        
        //overlay.addListener("rightclick", (e) => this.onRightClick(e))
        this.groundOverlays.push(overlay)
        
    }

    removeGroundOverlays() {
        if (!this.groundOverlays.length) return
        this.groundOverlays.forEach((overlay, i) => {
            overlay.img.setMap(null)
        })

        this.groundOverlays = []

        
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

    

    clearActiveMarkers() {
        if (this.spotlightMarkers.length) {
            this.spotlightMarkers.forEach(({slm, mim, iconAnimationInterval, iconAnimationTimeout}) => {
                if (slm) slm.setMap(null);
                if (mim) mim.setMap(null);
                if (iconAnimationInterval) clearInterval(iconAnimationInterval);
                if (iconAnimationTimeout) clearTimeout(iconAnimationTimeout);
            });
            this.spotlightMarkers = [];
        }
    }

    // Event handlers
    toggleMarkerActive({mainMarker: marker}) {
        
        
        if (this.selectedMarker === marker) {
            this.showInfoWindow(marker)
            return
        }


        this.selectedMarker = marker
        this.markers.forEach(({mainMarker: marker}) => {
            //const icon = this.iconMaker(marker.details.icon, this.svgMarker)
           // marker.setIcon(icon)
            marker.infoWindow?.close()
            marker.setZIndex(1)
            marker.setAnimation(null);
        })

        this.clearActiveMarkers()

        this.createActiveMarkers(marker)
        
        // this.selectedMarker.setIcon(this.iconMaker(marker.details.iconActive, {
        //     url: this.getRandomSpotlightIcon(),
        //     scaledSize: new google.maps.Size(40, 50),
        // }))
        // this.selectedMarker.setZIndex(2)
        
        // this.markerAnimationAndRemove(this.selectedMarker)
        // this.iconAnimateInterval = setInterval(() => {
        //     this.markerAnimationAndRemove(this.selectedMarker)
        // }, 8000)
        
        this.showInfoWindow(this.selectedMarker)
        
    }

    createActiveMarkers(markerId) {
        
        let marker = typeof markerId === 'number' ? this.markers[markerId].mainMarker : markerId

        const existingMarker = this.spotlightMarkers.find((m) => m.mim === marker)
        if (existingMarker) return

        const spotLightMarker = new google.maps.Marker({
            position: marker.getPosition(),
            map: this.Map,
            icon: {
                url: this.getRandomSpotlightIcon(),
                scaledSize: new google.maps.Size(40, 50),  
                anchor: new google.maps.Point(20, 58),  
            },
            zIndex: 2, 
        })

        const mainIconMarker = marker.details.icon ? new google.maps.Marker({
            position: marker.getPosition(),
            map: this.Map,
            icon: {
                url: marker.details.icon,
                scaledSize: new google.maps.Size(24, 24),
                anchor: new google.maps.Point(12, 50),
            },
            zIndex: 3,
        }) : null;

        const activeMarkerObj = {
            slm: spotLightMarker,
            mim: mainIconMarker,
            iconAnimationInterval: null,
            iconAnimationTimeout: null,
        }
        this.spotlightMarkers.push(activeMarkerObj);
    
        
        this.animateMarker(activeMarkerObj)
    }

    getRandomSpotlightIcon() {
        const colors = ['red', 'yellow', 'blue', 'dark-blue']
        const randomColor = colors[Math.floor(Math.random() * colors.length)]
        return `./images/spotlight-${randomColor}.png`
    }

    animateMarker(markerObj) {
        this.markerAnimationAndRemove(markerObj);
    
        markerObj.iconAnimationInterval = setInterval(() => {
            this.markerAnimationAndRemove(markerObj)
            
        }, 8000)
    }

    markerAnimationAndRemove(markerObj) {
        if(!markerObj) return
        if(markerObj.slm) markerObj.slm.setAnimation(google.maps.Animation.BOUNCE)
        if(markerObj.mim) markerObj.mim.setAnimation(google.maps.Animation.BOUNCE)
        
        markerObj.iconAnimateTimeout =  setTimeout(() => {
            if(markerObj.slm) markerObj.slm.setAnimation(null)
            if(markerObj.mim) markerObj.mim.setAnimation(null)
            markerObj.iconAnimateTimeout = null
        }, 2800);
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
        if(this.zoomTimer) clearTimeout(this.zoomTimer)
        this.zoomTimer = setTimeout(() => this.$map.dispatchEvent(this.events['mapZoomed']), 250)
        //this.$map.dispatchEvent(this.events['mapZoomed'])
    }

    onRightClick(e) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        const content = `Latitude: <strong>${lat}</strong><br>Longitude: <strong>${lng}</strong>`;
        const infoWindow = new google.maps.InfoWindow();
        infoWindow.setContent(content)
        infoWindow.setPosition(e.latLng)
        infoWindow.open(this.Map)
       
    }

    // Marker Utilities
    selectMarker(marker) {
        if(typeof marker === "number") {
            new google.maps.event.trigger(this.markers[marker].mainMarker, 'click')
            return
        }
        new google.maps.event.trigger(marker, 'click')
    }

    // Listeners
    _addListeners() {
        this.Map.addListener("zoom_changed", () => this.onMapZoom())
        if(this.editorMode) this.Map.addListener("rightclick", (e) => this.onRightClick(e))
       
    }
}