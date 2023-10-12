import utilities from "@/scripts/common/utilities"
import fileTpl from './templates/file-tile'

export function UploadBox(container) {
    this.container = container;
    this.fileTile;
    this.extension = '';
    this.uploadProgress = 0;
    this.filename = '';
    this.filesize = '';
    this.error = false;
    this.errorMessage = '';
    this.uploadSuccess = false
    this.deleteAction = null
    this._init()
}

UploadBox.prototype = {
    _init() {
        this.createHTML();
        this.showBox(true);
    },

    createHTML() {
        this.fileTile = utilities.createNodeParsing(fileTpl());
        this.updateInnerHtml();
        this.container.appendChild(this.fileTile);
    },

    updateInnerHtml() {
        const extNode = this.fileTile.querySelector('.file-tile__extension');
        const fileNameNode = this.fileTile.querySelector('.file-tile__name');
        const fileSizeNode = this.fileTile.querySelector('.file-tile__size');
        const progressNode = this.fileTile.querySelector('.progress');
        const progressBarNode = this.fileTile.querySelector('.progress-bar');
        const errorMessageNode = this.fileTile.querySelector('.file-tile__error');
        const deleteButtonNode = this.fileTile.querySelector('.file-tile__action-delete');

        this.fileTile.style.borderColor =
            this.fileTile.style.background =
            deleteButtonNode.style.background =
            progressBarNode.style.background =
            deleteButtonNode.style.color = ''

        progressBarNode.classList.add('bg-secondary')

        if (this.error) {
            progressBarNode.classList.remove('bg-secondary')
            this.fileTile.style.borderColor = deleteButtonNode.style.color = progressBarNode.style.background = `${site.settings.colors.error}`;
            this.fileTile.style.background = deleteButtonNode.style.background = `${utilities.setHexOpacity(site.settings.colors.error, 0.1)}`;
        }

        if (this.uploadSuccess) {
            progressBarNode.classList.remove('bg-secondary')
            this.fileTile.style.borderColor = progressBarNode.style.background = `${site.settings.colors.success}`;
            this.fileTile.style.background = `${utilities.setHexOpacity(site.settings.colors.success, 0.1)}`;
        }

        extNode.innerHTML = this.extension
        fileNameNode.innerHTML = this.filename
        fileSizeNode.innerHTML = this.fileSizeFormatter()
        errorMessageNode.innerHTML = this.errorMessage
        progressBarNode.style.width = `${this.uploadProgress}%`

        // Update listeners
        if (this.deleteAction)
            this.setDeleteAction(this.deleteAction)
    },

    // Utilities
    fileSizeFormatter() {
        return utilities.formatBytes(this.filesize, 0)
    },

    // Methods
    setContent(values) {
        // Modal Updates 
        this.filename = values.filename || this.filename;
        this.extension = values.extension || this.extension;
        this.filesize = values.filesize || this.filesize;
        this.uploadProgress = values.uploadProgress ? parseInt(values.uploadProgress) : this.uploadProgress;
        this.uploadSuccess = values.uploadSuccess || this.uploadSuccess;
        this.filename = values.filename || this.filename;
        this.error = values.error ?? this.error;
        this.errorMessage = values.errorMessage ?? this.errorMessage;
        this.updateInnerHtml()
    },

    setProgress(value) {
        var progressBar = this.container.querySelector('[data-progress-bar]')
        this.uploadProgress = parseInt(value)
        if (progressBar) progressBar.style.width = this.uploadProgress + '%'
    },

    clear() {
        this.extension = '';
        this.uploadProgress = 0;
        this.filename = '';
        this.filesize = '';
        this.error = false;
        this.errorMessage = '';
        this.uploadSuccess = false
    },

    showBox(show) {
        this.container.style.display = show ? 'block' : 'none'
    },

    setDeleteAction(action) {
        var deleteAction = this.fileTile.querySelector('.file-tile__action-delete');

        deleteAction?.addEventListener("click", action)
    }
}

/* Uploader */
export function Uploader(file, container, options = {}) {
    this.parentContainer = container || window;
    this.element = null
    this.file = file
    this.uploadObject = null
    this.error = false
    this.options = {
        deleteAction: options.deleteAction || null,
        onUpload: options.onUpload || null,
        onError: options.onError || null,
        ajaxURL: options.ajaxURL || null,
        allowedTypes: options.allowedTypes || 'all',
        maxSize: options.maxSize || null,
        hiddenTransfer: options.hiddenTransfer || false
    }

    this._init();
}

Uploader.prototype = {
    _init: function () {
        this.validate()
        if (this.options.hiddenTransfer) {
            this.ajaxCall();
            return
        }
        this.createElement();
    },

    createElement() {
        this.element = document.createElement('div');
        this.element.classList.add('multi-file-item', 'upload_file_box', 'my-2');
        this.uploadObject = new UploadBox(this.element);
        this.parentContainer.appendChild(this.element);
        this.initUploadObject();

    },

    initUploadObject() {
        this.uploadObject.setContent({
            filename: this.file.name,
            extension: this.file.name.split('.').reverse()[0],
            filesize: this.file.size
        });

        if (this.options.deleteAction) this.uploadObject.deleteAction = () => this.options.deleteAction(this);
        this.ajaxCall();
    },

    ajaxCall() {
        if (this.options.ajaxURL === "") return
        if (this.error) {
            this.errorHandler()
            return
        }
        var formdata = new FormData();
        formdata.append("file", this.file);
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    if (this.options.onUpload instanceof Function) this.options.onUpload(JSON.parse(xhr.response));
                    this.completeHandler()
                    return
                }
                this.error = xhr.response ? `${xhr.response.substring(0, 500)}` : true
                this.errorHandler()
            }
        }
        xhr.upload.addEventListener("progress", (e) => this.progressHandler(e), false);
        //xhr.addEventListener("load", () => this.completeHandler(), false);
        //xhr.addEventListener("error", this.errorHandler, false);
        //xhr.addEventListener("abort", this.abortHandler, false);

        if (this.options.ajaxURL) {
            xhr.open("POST", `${this.options.ajaxURL}`);
            xhr.send(formdata);
        }

    },

    // Error validation
    validate() {
        this.error = false
        // Type validation
        const extension = this.file.name.split('.').reverse()[0]
        const extReg = new RegExp(`${extension}`, 'g')
        if (this.options.allowedTypes.trim().match(extReg) === null && this.options.allowedTypes !== "all") {
            this.error = 'File type not allowed'
            return false
        }

        this.error = false
        return true
    },

    // Handlers
    progressHandler(e) {
        var percent = (e.loaded / e.total) * 100;
        this.uploadObject?.setProgress(percent);
    },

    completeHandler() {
        if (this.error) return
        setTimeout(() => {
            this.uploadObject?.setContent({
                uploadSuccess: true
            })
        }, 500)
    },

    errorHandler() {
        if(!this.error) return
        this.uploadObject?.setContent({
            error: true,
            errorMessage: `${this.error}`
        })

        if (this.options.onError instanceof Function) this.options.onError(this.error);
    },

    abortHandler() {

    },

    // Methods
    remove() {
        if (this.element) {
            this.parentContainer.removeChild(this.element)
            this.element = null
        }
    }
}

window.formUpload = {
    UploadBox,
    Uploader
}
