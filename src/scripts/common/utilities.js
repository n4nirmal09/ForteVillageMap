"user strict"
export const utilities = {
    options: {
        scrollTop: 0,
        scrollLeft: 0
    },

    debounce(func, wait, immediate) {
        var timeout;
        return function () {
            var context = this,
                args = arguments;
            var later = function () {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        }
    },

    isIE() {

        var ua = window.navigator.userAgent;

        var msie = ua.indexOf('MSIE ');
        if (msie > 0) {
            // IE 10 or older => return version number
            return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
        }

        var trident = ua.indexOf('Trident/');
        if (trident > 0) {
            // IE 11 => return version number
            var rv = ua.indexOf('rv:');
            return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
        }

        var edge = ua.indexOf('Edge/');
        if (edge > 0) {
            // Edge (IE 12+) => return version number
            return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
        }



        // other browser
        return false;

    },

    isFuIOS() {
        var iosQuirkPresent = function () {
            var audio = new Audio();
    
            audio.volume = 0.5;
            return audio.volume === 1;   // volume cannot be changed from "1" on iOS 12 and below
        };
    
        var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        var isAppleDevice = navigator.userAgent.includes('Macintosh');
        var isTouchScreen = navigator.maxTouchPoints >= 1;   // true for iOS 13 (and hopefully beyond)
    
        return isIOS || (isAppleDevice && (isTouchScreen || iosQuirkPresent()));
    },

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? true : false
    },

    async loadImage(src) {
        const img = new Image()
        img.src = src
        const imgLoadPromise = await new Promise((resolve, reject) => {
            img.onload = function () {
                resolve('loaded')
            }
            img.onerror = function (err) {
                reject(err)
            }
        })

        return imgLoadPromise
    },

    loadScript(src, id) {
        let scriptTag = document.querySelector(`[id*="${id}"]`)
        
        return new Promise((resolve, reject) => {
            if(window[`${id}ScriptLoaded`]) {
                resolve()
                return
            }

            if(!scriptTag) {
                scriptTag = document.createElement('script')
                scriptTag.setAttribute('id', `${id}`)
                scriptTag.src = `${src}`
                document.body.append(scriptTag)
            }

            scriptTag?.addEventListener('load', () => {
                window[`${id}ScriptLoaded`] = true
                resolve()
            })
            scriptTag?.addEventListener('error', reject)
        })
    },

    getStyle(e, styleName) {
        var styleValue = "";
        if (document.defaultView && document.defaultView.getComputedStyle) {
            styleValue = document.defaultView.getComputedStyle(e, "").getPropertyValue(styleName);
        } else if (e.currentStyle) {
            styleName = styleName.replace(/\-(\w)/g, function (strMatch, p1) {
                return p1.toUpperCase();
            });
            styleValue = e.currentStyle[styleName];
        }
        return styleValue;
    },

    triggerFocus(element) {
        var eventType = "onfocusin" in element ? "focusin" : "focus",
            bubbles = "onfocusin" in element,
            event;

        if ("createEvent" in document) {
            event = document.createEvent("Event");
            event.initEvent(eventType, bubbles, true);
        }
        else if ("Event" in window) {
            event = new Event(eventType, { bubbles: bubbles, cancelable: true });
        }

        element.focus();
        element.dispatchEvent(event);
    },

    toggleWindowScroll(scroll) {
        if (!scroll) {
            utilities.options.scrollTop = window.pageYOffset || document.documentElement.scrollTop
            utilities.options.scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
            window.addEventListener('scroll', utilities.disableScroll)
        } else {
            utilities.options.scrollTop = 0
            utilities.options.scrollLeft = 0
            window.removeEventListener('scroll', utilities.disableScroll)
        }
    },

    disableScroll(e) {
        window.scrollTo(utilities.options.scrollLeft, utilities.options.scrollTop)
    },


    createNodeParsing(s) {
        return new DOMParser().parseFromString(s, 'text/html').body.firstElementChild
    },

    rootCssVariables() {
        document.documentElement.style
            .setProperty('--mobile-breakpoint', `${site.settings.breakpoints.mobile}px`);
    },

    isJson(data) {
        try {
            JSON.parse(data);
        } catch (e) {
            return false;
        }
        return true;
    },

    getGsapTargets(timeline) {

        function addTargets(list, target) {

            if (Array.isArray(target)) target.forEach(checkTarget);
            else if (target.nodeType === 1) list.push(target);
            else if (target.jquery) target.each(function () { list.push(this); });

            function checkTarget(el) {
                if (el.jquery) list.push(el[0]);
                else if (el.nodeType === 1) list.push(el);
                else if (typeof el === "string") list.push(document.querySelector(el));
            }
            return list;
        }

        return timeline
            .getChildren(true, true, false)
            .map(function (tween) { return tween.target; })
            .reduce(addTargets, [])
            .filter(function (target, i, list) { return list.indexOf(target) === i; });
    },

    formatDateForApi(dateString) {
        return moment(dateString, site.settings.dateDisplayFormat).format(site.settings.dateAPIFormat)
    },

    noOfDays(startDate, endDate) {
        if (!startDate || !endDate) return null
        return (new Date(utilities.formatDateForApi(endDate)).getTime() -
            new Date(utilities.formatDateForApi(startDate)).getTime()) / (1000 * 3600 * 24)
    },

    formatTimeForSlots(dateTimeString) {
        const formatedTime = dateTimeString.split('+')[0]
        return moment(formatedTime).format('hh:mm')
    },

    windowPanel(href, windowName, { width = 400, height = 400 }) {
        var myWindow = window.open(`${href}`, `${windowName}`, `width=${width},height=${height}`)
        if (!myWindow || myWindow.closed || typeof myWindow.closed == 'undefined') {
            alert('Pop-up Blocker is enabled! Please add this site to your exception list.')
        }
        return myWindow
    },

    resizePlayer(container, aspectRatio) {
        const iframe = container.querySelector('iframe')

        if (!iframe) return

        let win = container,
            width = win.clientWidth,
            playerWidth,
            height = win.clientHeight,
            playerHeight,
            ratio = aspectRatio || 16 / 9

        if (width / ratio < height) {
            playerWidth = Math.ceil(height * ratio)
            Object.assign(
                iframe.style,
                {
                    width: `${playerWidth}px`,
                    height: `${height}px`,
                    left: `${(width - playerWidth) / 2}px`,
                    top: 0
                }
            )


        } else {
            playerHeight = Math.ceil(width / ratio)

            Object.assign(
                iframe.style,
                {
                    width: `${width}px`,
                    height: `${playerHeight}px`,
                    left: 0,
                    top: `${(height - playerHeight) / 2}px`
                }
            )
        }
    },

    isNodeEle(ele) {
        return ele instanceof Element || ele instanceof HTMLDocument
    }
}

export const formUtils = {
    isEmpty(val) {
        return !val && /^\s*$/.test(val)
    },

    isEmail(mail) {
        return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/.test(mail)
    },

    isPhone(phone) {
        return /^(\d){1}(-|\s)?(\d){3}(-|\s)?(\d){3}(-|\s)?(\d){4}$/.test(phone)
    },

    sanitizeString(val) {
        let str = val
        str = str.replace(/\s+[^a-zA-Z0-9]/g, "")
        return str
    }
}

export default utilities