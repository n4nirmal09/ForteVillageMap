import {
    BASE_URL,
} from "@/scripts/config/api.config"


export const API = (($) => {
    class Controller {
        constructor(options) {
            this.options = Object.assign(defaultApiOptions, this.options)
            //this.service = null
            this.init()
        }

        init() {
            this.setupAjaxBase()
        }

        setupAjaxBase() {
            $.ajaxSetup({
                //mode: 'cors',
                crossDomain: true,
                //referrerPolicy: 'no-referrer',
                // beforeSend: (xhr, options) => {
                //     options.url = this.options.baseUrl + this.options.url
                // }
            })
        }

        get(url) {
            return $.get(url, (data, status) => data)
        }

        async getFetch(url) {
            let token = ''
            
            const res = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token?.["access_token"] || ''}`
                }
            })
            return res.json()
        }

        async post(url, data) {
            //return $.post(url, data)
            let token = ''

            const requestOptions = {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token?.["access_token"] || ''}`
                },
                body: JSON.stringify(data).replace(/\\"/g, '')
            }
            const res = await fetch(url, requestOptions)
            return res.json()
        }

        del() {

        }

        isJson(data) {
            try {
                JSON.parse(data)
            } catch (e) {
                return false;
            }
            return true;
        }
    }

    const defaultApiOptions = {
        baseUrl: BASE_URL
    }

    return {
        Controller
    }
})(jQuery)
