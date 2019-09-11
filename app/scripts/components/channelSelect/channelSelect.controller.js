'use strict';

class ChannelSelectController {
    
    constructor ($scope, $element, $translate, uiConfig, DeviceData) {
        'ngInject';

        this.$scope = $scope;
        this.$element = $element;
        this.$translate = $translate;
        this.deviceData = DeviceData;

        this.valueFilter = null;

        this.isModal = false;
        this.isLoaded = false;
        
        this.elementMap = null;

        this.anyDevice = {
            id: 0,
            name: '-- Any Device --'
        };
        this.anyType = {
            id: 0,
            name: '-- Any Type --'
        };

        this.devices = [this.anyDevice];
        this.types = [this.anyType];

        this.type = 0;
        this.device = 0;

        uiConfig.whenReady().then(() => {
            this.devices = this.getDevices();
            this.types = this.getTypes();
            this.isLoaded = true;
        });

        $scope.$watch('$viewContentLoaded', () => { 
            this.ready();
        });

        $scope.$watch('$ctrl.value', (newValue, oldValue, d) => { 
            if (newValue !== oldValue) {
                this.valueFilter = newValue;
                if (this.elementMap) {
                    this.elementMap.val(newValue);
                }
            }
        });
    }

    ready() {
        window.addEventListener('click', e => {
            e = e || window.event;
            let target = e.target || e.srcElement;

            if (this.isModal) {
                if (!this.$element.is(':hover') && 
                    !angular.element(target).hasClass('ui-select-choices-row-inner') && 
                    !angular.element(target.parentNode).hasClass('ui-select-choices-row-inner') &&
                    !target.closest('.ui-select-container')
                ) {
                    this.isModal = false;
                    this.$scope.$apply();
                }
            }
        });


        if (this.map) {
            this.elementMap = angular.element('[name="' + this.map + '"]');
            this.value = this.elementMap.val();
        }

        if (this.usePattern && !this.tip) {
            this.$translate('channel-select.tip.pattern').then(translation => {
                this.tip = translation;
            }, translationId => {
                this.tip = translationId;
            });
        }

        if (this.prerender) {
            if (this.prerender === 'select') {
                this.$element.find('.ui-select-container').scope().$select.open = true;
                this.$element.find('.ui-select-container').find('.ui-select-choices-row').first().find('a').click();
            }
            if (this.prerender === 'filter') {
                this.filter();
            }
        }
    }

    getDevices() {
        return [this.anyDevice].concat(this.deviceData.cellDevices());
    }

    getTypes() {
        let tmp = [];
        this.deviceData.cellTypesUsed().forEach(element => {
            tmp.push({
                id: element,
                name: element,
            });
        });
        return [this.anyType].concat(tmp);
    }

    deviceFilter () {
        return this.device;
    }

    typeFilter () {
        return this.type;
    }

    filter() {
        this.valueFilter = this.value;
        this.isModal = true;
    }

    apply() {
        this.value = this.valueFilter;
        this.isModal = false;
    }
}

export default ChannelSelectController;