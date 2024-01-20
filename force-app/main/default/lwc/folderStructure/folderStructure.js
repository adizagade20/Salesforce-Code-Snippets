import { LightningElement, track, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRecord, createRecord, deleteRecord, updateRecord } from 'lightning/uiRecordApi';
import LightningConfirm from 'lightning/confirm';
import { NavigationMixin, CurrentPageReference } from 'lightning/navigation';

import getObjectName from '@salesforce/apex/FolderStructure.getObjectName';
import getStructureData from '@salesforce/apex/FolderStructure.getStructureData';


export default class FolderStructure extends LightningElement {
    @track recordId;
    @track objectApiName;

    @track isLoaded = false;

    @track showSpinner;
    @track data;

    @track propertyPaddingClass;
    @track buildingPaddingClass;
    @track floorPaddingClass;
    @track unitPaddingClass;

    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference) {
            this.recordId = currentPageReference.state.recordId;
        }
    }

    connectedCallback() {

    }


    renderedCallback() {
        const tableRows = this.template.querySelectorAll('.table-rows');
        for (let i = 0; i < tableRows.length; i++) {
            tableRows[i].addEventListener('mouseover', () => {
                const row = tableRows[i];
                const rowType = row.dataset.rowType;
                const { propertyIndex, buildingIndex, floorIndex, unitIndex } = row.dataset;

                if (rowType == 'property') {
                    const propertyChildRows = this.template.querySelectorAll(`[data-property-index="${propertyIndex}"]`);
                    for (let j = 0; j < propertyChildRows.length; j++) {
                        propertyChildRows[j].classList.add('hovered');
                    }
                }
                else if (rowType == 'building') {
                    const buildingChildRows = this.template.querySelectorAll(`[data-property-index="${propertyIndex}"][data-building-index="${buildingIndex}"]`);
                    for (let j = 0; j < buildingChildRows.length; j++) {
                        buildingChildRows[j].classList.add('hovered');
                    }
                }
                else if (rowType == 'floor') {
                    const floorChildRows = this.template.querySelectorAll(`[data-property-index="${propertyIndex}"][data-building-index="${buildingIndex}"][data-floor-index="${floorIndex}"]`);
                    for (let j = 0; j < floorChildRows.length; j++) {
                        floorChildRows[j].classList.add('hovered');
                    }
                }
                else if (rowType == 'unit') {
                    tableRows[i].classList.add('hovered');
                }
            });

            tableRows[i].addEventListener('mouseleave', () => {
                const row = tableRows[i];
                const rowType = row.dataset.rowType;
                const { propertyIndex, buildingIndex, floorIndex, unitIndex } = row.dataset;

                if (rowType == 'property') {
                    const propertyChildRows = this.template.querySelectorAll(`[data-property-index="${propertyIndex}"]`);
                    for (let j = 0; j < propertyChildRows.length; j++) {
                        propertyChildRows[j].classList.remove('hovered');
                    }
                }
                else if (rowType == 'building') {
                    const buildingChildRows = this.template.querySelectorAll(`[data-property-index="${propertyIndex}"][data-building-index="${buildingIndex}"]`);
                    for (let j = 0; j < buildingChildRows.length; j++) {
                        buildingChildRows[j].classList.remove('hovered');
                    }
                }
                else if (rowType == 'floor') {
                    const floorChildRows = this.template.querySelectorAll(`[data-property-index="${propertyIndex}"][data-building-index="${buildingIndex}"][data-floor-index="${floorIndex}"]`);
                    for (let j = 0; j < floorChildRows.length; j++) {
                        floorChildRows[j].classList.remove('hovered');
                    }
                }
                else if (rowType == 'unit') {
                    tableRows[i].classList.remove('hovered');
                }
            });

        }
    }


    @wire(getObjectName, { recordId: '$recordId' })
    wiredObjectName({ error, data }) {
        console.log('wiredObjectName', JSON.stringify({ error, data }));
        if (data) {
            this.objectApiName = data;
            this.getStructureData();

            switch (this.objectApiName) {
                case 'Property__c': {
                    this.propertyPaddingClass = 'padding-left-level0';
                    this.buildingPaddingClass = 'padding-left-level1';
                    this.floorPaddingClass = 'padding-left-level2';
                    this.unitPaddingClass = 'padding-left-level3';
                    break;
                }
                case 'Building__c': {
                    this.propertyPaddingClass = 'padding-left-level0';
                    this.buildingPaddingClass = 'padding-left-level0';
                    this.floorPaddingClass = 'padding-left-level1';
                    this.unitPaddingClass = 'padding-left-level2';
                    break;
                }
                case 'Floor__c': {
                    this.propertyPaddingClass = 'padding-left-level0';
                    this.buildingPaddingClass = 'padding-left-level0';
                    this.floorPaddingClass = 'padding-left-level0';
                    this.unitPaddingClass = 'padding-left-level1';
                    break;
                }
                case 'Unit__c': {
                    this.propertyPaddingClass = 'padding-left-level0';
                    this.buildingPaddingClass = 'padding-left-level0';
                    this.floorPaddingClass = 'padding-left-level0';
                    this.unitPaddingClass = 'padding-left-level0';
                    break;
                }

            }
        }
        else if (error) {
            console.log(error);
        }
    }


    getStructureData() {
        this.showSpinner = true;

        getStructureData({ recordId: this.recordId })
            .then(result => {
                // console.log('result', JSON.stringify(result));
                this.data = result;

                const isPropertyExpanded = this.objectApiName == 'Property__c' || this.objectApiName == 'Building__c' || this.objectApiName == 'Floor__c' || this.objectApiName == 'Unit__c';
                const isBuildingExpanded = this.objectApiName == 'Building__c' || this.objectApiName == 'Floor__c' || this.objectApiName == 'Unit__c';
                const isFloorExpanded = this.objectApiName == 'Floor__c' || this.objectApiName == 'Unit__c';
                const isUnitExpanded = this.objectApiName == 'Unit__c';

                let isVisible = false;
                for (let a = 0; a < this.data.length; a++) {
                    let property = this.data[a];
                    if (property.id == this.recordId) {
                        isVisible = true;
                    }
                    // property.isExpanded = true;
                    property.isExpanded = isPropertyExpanded;
                    property.isVisible = isVisible;
                    console.log('property isExpanded', property.isExpanded, 'isVisible', property.isVisible);
                    property.isActionAvailable = true;
                    property.propertyIndex = a;
                    for (let b = 0; b < property.buildings.length; b++) {
                        let building = property.buildings[b];
                        if (building.id == this.recordId) {
                            isVisible = true;
                        }
                        // building.isExpanded = true;
                        building.isExpanded = isBuildingExpanded;
                        building.isVisible = isVisible;
                        console.log('building isExpanded', building.isExpanded, 'isVisible', building.isVisible);
                        building.isActionAvailable = true;
                        building.buildingIndex = b;
                        for (let c = 0; c < building.floors.length; c++) {
                            let floor = building.floors[c];
                            if (floor.id == this.recordId) {
                                isVisible = true;
                            }
                            // floor.isExpanded = true;
                            floor.isExpanded = isFloorExpanded;
                            floor.isVisible = isVisible;
                            console.log('floor isExpanded', floor.isExpanded, 'isVisible', floor.isVisible);
                            floor.isActionAvailable = true;
                            floor.floorIndex = c;
                            for (let d = 0; d < floor.units.length; d++) {
                                let unit = floor.units[d];
                                if (unit.id == this.recordId) {
                                    isVisible = true;
                                }
                                unit.isExpanded = true;
                                unit.isExpanded = isUnitExpanded;
                                unit.isVisible = isVisible;
                                console.log('unit isExpanded', unit.isExpanded, 'isVisible', unit.isVisible);
                                unit.isActionAvailable = true;
                                unit.unitIndex = d;
                            }
                        }
                    }
                }
                console.log('result', JSON.stringify(result));
                this.showSpinner = false;
            })
            .catch(error => {
                console.log(error);
            });
    }


    handleExpandClick(event) {
        const { propertyIndex, buildingIndex, floorIndex, unitIndex } = event.currentTarget.dataset;
        console.log('handleExpandClick', propertyIndex, buildingIndex, floorIndex, unitIndex);

        if (propertyIndex && !buildingIndex && !floorIndex && !unitIndex) {
            this.data[propertyIndex].isExpanded = !this.data[propertyIndex].isExpanded;
        }
        else if (propertyIndex && buildingIndex && !floorIndex && !unitIndex) {
            this.data[propertyIndex].buildings[buildingIndex].isExpanded = !this.data[propertyIndex].buildings[buildingIndex].isExpanded;
        }
        else if (propertyIndex && buildingIndex && floorIndex && !unitIndex) {
            this.data[propertyIndex].buildings[buildingIndex].floors[floorIndex].isExpanded = !this.data[propertyIndex].buildings[buildingIndex].floors[floorIndex].isExpanded;
        }
        else if (propertyIndex && buildingIndex && floorIndex && unitIndex) {
            this.data[propertyIndex].buildings[buildingIndex].floors[floorIndex].units[unitIndex].isExpanded = !this.data[propertyIndex].buildings[buildingIndex].floors[floorIndex].units[unitIndex].isExpanded;
        }
    }


    handleRowAddItem(event) {
        const { propertyIndex, buildingIndex, floorIndex, unitIndex } = event.currentTarget.dataset;
        console.log(propertyIndex, buildingIndex, floorIndex, unitIndex);

        console.log('before', JSON.stringify(this.data));
        if (propertyIndex && !buildingIndex && !floorIndex && !unitIndex) {
            const property = this.data[propertyIndex];
            if (!property.isExpanded) {
                property.isExpanded = true;
            }
            if (!property.buildings) {
                property.buildings = [];
            }
            property.buildings.push({
                isVisible: true,
                propertyIndex: propertyIndex,
                buildingIndex: property.buildings.length
            });
        }
        else if (propertyIndex && buildingIndex && !floorIndex && !unitIndex) {
            const building = this.data[propertyIndex].buildings[buildingIndex];
            if (!building.isExpanded) {
                building.isExpanded = true;
            }
            if (!building.floors) {
                building.floors = [];
            }
            building.floors.push({
                isVisible: true,
                propertyIndex: propertyIndex,
                buildingIndex: buildingIndex,
                floorIndex: building.floors.length
            });
        }
        else if (propertyIndex && buildingIndex && floorIndex && !unitIndex) {
            const floor = this.data[propertyIndex].buildings[buildingIndex].floors[floorIndex];
            console.log('floor', JSON.stringify(floor));
            if (!floor.isExpanded) {
                floor.isExpanded = true;
            }
            if (!floor.units) {
                floor.units = [];
            }
            floor.units.push({
                isVisible: true,
                propertyIndex: propertyIndex,
                buildingIndex: buildingIndex,
                floorIndex: floorIndex,
                unitIndex: floor.units.length
            });
            console.log('floor', JSON.stringify(floor));
        }
        console.log('after', JSON.stringify(this.data));

    }


    async handleFooterVisibility() {
        let isModified = false;
        for (const property of this.data) {
            if (!property.id) {
                isModified = true;
                break;
            }

            if (property.buildings) {
                for (const building of property.buildings) {
                    if (!building.id) {
                        isModified = true;
                        break;
                    }
                    if (building.floors) {
                        for (const floor of building.floors) {
                            if (!floor.id) {
                                isModified = true;
                                break;
                            }
                            if (floor.units) {
                                for (const unit of floor.units) {
                                    if (!unit.id) {
                                        isModified = true;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            const structureTable = this.template.querySelector('.structure-table');
            const footer = this.template.querySelector('.footer');
            if (isModified) {
                structureTable.classList.add('structure-table-padding-bottom');
                footer.classList.remove('slds-hide');
            }
            else {
                structureTable.classList.remove('structure-table-padding-bottom');
                footer.classList.add('slds-hide');
            }
        }
    }


    async handleRowAction(event) {
        const { action, id, propertyIndex, buildingIndex, floorIndex, unitIndex } = event.currentTarget.dataset;
        console.log(action, propertyIndex, buildingIndex, floorIndex, unitIndex);

        if (action == 'add') {
            // console.log('handleRowAction add before', JSON.stringify(this.data));
            if (propertyIndex && !buildingIndex && !floorIndex && !unitIndex) {
                const property = this.data[propertyIndex];
                if (!property.isExpanded) {
                    property.isExpanded = true;
                }
                if (!property.buildings) {
                    property.buildings = [];
                }
                property.buildings.push({
                    isVisible: true,
                    propertyIndex: propertyIndex,
                    buildingIndex: property.buildings.length,
                    propertyId: property.id
                });
            }
            else if (propertyIndex && buildingIndex && !floorIndex && !unitIndex) {
                const building = this.data[propertyIndex].buildings[buildingIndex];
                if (!building.isExpanded) {
                    building.isExpanded = true;
                }
                if (!building.floors) {
                    building.floors = [];
                }
                building.floors.push({
                    isVisible: true,
                    propertyIndex: propertyIndex,
                    buildingIndex: buildingIndex,
                    floorIndex: building.floors.length,
                    buildingId: building.id
                });
            }
            else if (propertyIndex && buildingIndex && floorIndex && !unitIndex) {
                const floor = this.data[propertyIndex].buildings[buildingIndex].floors[floorIndex];
                if (!floor.isExpanded) {
                    floor.isExpanded = true;
                }
                if (!floor.units) {
                    floor.units = [];
                }
                floor.units.push({
                    isVisible: true,
                    propertyIndex: propertyIndex,
                    buildingIndex: buildingIndex,
                    floorIndex: floorIndex,
                    unitIndex: floor.units.length,
                    floorId: floor.id
                });
            }
            // console.log('handleRowAction add after', JSON.stringify(this.data));
        }

        else if (action == 'delete') {
            if (propertyIndex && buildingIndex && !floorIndex && !unitIndex) {
                const buildings = this.data[propertyIndex].buildings;
                if (buildings[buildingIndex].id) {
                    const result = await this.deleteItem(buildings[buildingIndex].id);
                    if (result == true) {
                        buildings[buildingIndex].isVisible = false;
                    }
                }
                else {
                    buildings[buildingIndex].isVisible = false;
                }
            }
            else if (propertyIndex && buildingIndex && floorIndex && !unitIndex) {
                const floors = this.data[propertyIndex].buildings[buildingIndex].floors;
                if (floors[floorIndex].id) {
                    const result = await this.deleteItem(floors[floorIndex].id);
                    if (result == true) {
                        floors[floorIndex].isVisible = false;
                    }
                }
                else {
                    floors[floorIndex].isVisible = false;
                }
            }
            else if (propertyIndex && buildingIndex && floorIndex && unitIndex) {
                const units = this.data[propertyIndex].buildings[buildingIndex].floors[floorIndex].units;
                if (units[unitIndex].id) {
                    const result = await this.deleteItem(units[unitIndex].id);
                    if (result == true) {
                        units[unitIndex].isVisible = false;
                    }
                }
                else {
                    units[unitIndex].isVisible = false;
                }
            }
        }

        else if (action == 'preview') {
            // navigate to recordPage
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: id,
                    actionName: 'view'
                }
            });

        }

        this.handleFooterVisibility();
    }


    async deleteItem(idToDelete) {
        const result = await LightningConfirm.open({
            variant: 'header',
            label: 'Delete Confirmation',
            message: 'Are you sure you want to delete this item?'
        });
        if (result) {
            this.showSpinner = true;
            return new Promise((resolve, reject) => {
                deleteRecord(idToDelete)
                    .then((result) => {
                        console.log('delete result then', idToDelete, result);
                        this.showSpinner = false;
                        resolve(true);
                    })
                    .catch(error => {
                        console.log('delete result catch', idToDelete, error);
                        reject(error);
                    });
            })
        }
        else {
            return null;
        }
    }


    handleInput(event) {
        const { propertyIndex, buildingIndex, floorIndex, unitIndex } = event.currentTarget.dataset;
        const { name, value } = event.target;

        if (propertyIndex && !buildingIndex && !floorIndex && !unitIndex) {
            this.data[propertyIndex][name] = value;
        }
        else if (propertyIndex && buildingIndex && !floorIndex && !unitIndex) {
            this.data[propertyIndex].buildings[buildingIndex][name] = value;
        }
        else if (propertyIndex && buildingIndex && floorIndex && !unitIndex) {
            this.data[propertyIndex].buildings[buildingIndex].floors[floorIndex][name] = value;
        }
        else if (propertyIndex && buildingIndex && floorIndex && unitIndex) {
            this.data[propertyIndex].buildings[buildingIndex].floors[floorIndex].units[unitIndex][name] = value;
        }
    }


    async handleSave() {
        this.showSpinner = true;
        let dataToSave = [];
        for (const property of this.data) {
            for (const building of property.buildings) {
                console.log('building', building, building.id);
                if (!building.id) {
                    dataToSave.push(building);
                }
                if (building.floors) {
                    for (const floor of building.floors) {
                        console.log('floor', floor, floor.id);
                        if (!floor.id) {
                            dataToSave.push(floor);
                        }
                        if (floor.units) {
                            for (const unit of floor.units) {
                                console.log('unit', unit, unit.id);
                                if (!unit.id) {
                                    dataToSave.push(unit);
                                }
                            }
                        }
                    }
                }
            }
        }

        console.log('dataToSave', dataToSave, JSON.stringify(dataToSave));

        if (dataToSave.length > 0) {
            // create multiple promises to create the records with createRecord LDS method
            const promises = [];
            for (const item of dataToSave) {
                console.log('item', item, JSON.stringify(item));
                let recordInput = {};
                if (item.propertyId) {
                    recordInput = {
                        apiName: 'Building__c',
                        fields: {
                            Name: item.name,
                            Building_Description__c: item.description,
                            Property__c: item.propertyId
                        }
                    }
                    console.log('building recordInput', recordInput, JSON.stringify(recordInput));
                }
                else if (item.buildingId) {
                    recordInput = {
                        apiName: 'Floor__c',
                        fields: {
                            Name: item.name,
                            Floor_Description__c: item.description,
                            Building__c: item.buildingId
                        }
                    }
                    console.log('floor recordInput', recordInput, JSON.stringify(recordInput));
                }
                else if (item.floorId) {
                    recordInput = {
                        apiName: 'Unit__c',
                        fields: {
                            Name: item.name,
                            Unit_Description__c: item.description,
                            Floor__c: item.floorId
                        }
                    }
                    console.log('unit recordInput', recordInput, JSON.stringify(recordInput));
                }

                promises.push(
                    new Promise((resolve, reject) => {
                        setTimeout(() => {
                            // console.log('create recordInput', recordInput, JSON.stringify(recordInput));
                            createRecord(recordInput)
                                .then((result) => {
                                    console.log('create result', result);
                                    resolve(result);
                                })
                                .catch(error => {
                                    console.log('create error', error, JSON.stringify(result));
                                    this.showToast('Error', error, 'error', error);
                                    reject(error);
                                })
                        });
                    })
                );

                // complete all promises
                Promise.all(promises)
                    .then(result => {
                        console.log('createAll result', result);
                        this.getStructureData();
                    })
                    .catch(error => {
                        console.log('createAll error', error);
                        this.showSpinner = false;
                    })
            }


        }
    }


    async handleCancel() {
        this.getStructureData();
    }


    showToast(title, message, variant, error) {
        if (error) {
            let msg = error;
            if (error.message) msg = error.message;
            else if (error.body && error.body.message) msg = error.body.message;
            message = msg;
        }

        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant,
            })
        );
    }


}