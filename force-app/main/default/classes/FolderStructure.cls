public with sharing class FolderStructure {
    
    @AuraEnabled(cacheable=true)
    public static String getObjectName(String recordId) {
        try {
            Schema.SObjectType objectType = Id.valueOf(recordId).getSObjectType();
            return String.valueOf(objectType);
        }
        catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<Map<String, Object>> getStructureData(String recordId) {
        try {
            Schema.SObjectType objectType = Id.valueOf(recordId).getSObjectType();

            List<Property__c> properties;
            List<Building__c> buildings;
            List<Floor__c> floors;
            List<Unit__c> units;

            Map<Id, Property__c> propertyMap = new Map<Id, Property__c>();
            Map<Id, List<Building__c>> propertyWiseBuildingMap = new Map<Id, List<Building__c>>();
            Map<Id, List<Floor__c>> buildingWiseFloorMap = new Map<Id, List<Floor__c>>();
            Map<Id, List<Unit__c>> floorWiseUnitMap = new Map<Id, List<Unit__c>>();

            switch on String.valueOf(objectType) {
                when 'Property__c' {
                    properties = [SELECT Id, Name FROM Property__c WHERE Id = :recordId];
                    buildings = [SELECT Id, Name, Building_Description__c, Property__c FROM Building__c WHERE Property__c = :recordId];
                    floors = [SELECT Id, Name, Floor_Description__c, Building__c FROM Floor__c WHERE Building__r.Property__c = :recordId];
                    units = [SELECT Id, Name, Unit_Description__c, Floor__c FROM Unit__c WHERE Floor__r.Building__r.Property__c = :recordId];
                }
                when 'Building__c' {
                    buildings = [SELECT Id, Name, Building_Description__c, Property__c FROM Building__c WHERE Id = :recordId];
                    properties = new List<Property__c>{new Property__c(Id = buildings[0].Property__c)};
                    floors = [SELECT Id, Name, Floor_Description__c, Building__c FROM Floor__c WHERE Building__c = :recordId];
                    units = [SELECT Id, Name, Unit_Description__c, Floor__c FROM Unit__c WHERE Floor__r.Building__c = :recordId];
                }
                when 'Floor__c' {
                    floors = [SELECT Id, Name, Floor_Description__c, Building__c, Building__r.Property__c FROM Floor__c WHERE Id = :recordId];
                    properties = new List<Property__c>{new Property__c(Id = floors[0].Building__r.Property__c)};
                    buildings = new List<Building__c>{new Building__c(Id = floors[0].Building__c, Property__c = properties[0].Id)};
                    units = [SELECT Id, Name, Unit_Description__c, Floor__c FROM Unit__c WHERE Floor__c = :recordId];
                }
                when 'Unit__c' {
                    units = [SELECT Id, Name, Unit_Description__c, Floor__c, Floor__r.Building__c, Floor__r.Building__r.Property__c FROM Unit__c WHERE Id = :recordId];
                    properties = new List<Property__c>{new Property__c(Id = units[0].Floor__r.Building__r.Property__c)};
                    buildings = new List<Building__c>{new Building__c(Id = units[0].Floor__r.Building__c, Property__c = properties[0].Id)};
                    floors = new List<Floor__c>{new Floor__c(Id = units[0].Floor__c, Building__c = buildings[0].Id)};
                }
            }

            for(Property__c property : properties) {
                propertyMap.put(property.Id, property);
            }
            for(Building__c building : buildings) {
                if(propertyWiseBuildingMap.containsKey(building.Property__c)) {
                    propertyWiseBuildingMap.get(building.Property__c).add(building);
                } else {
                    propertyWiseBuildingMap.put(building.Property__c, new List<Building__c>{building});
                }
            }
            for(Floor__c floor : floors) {
                if(buildingWiseFloorMap.containsKey(floor.Building__c)) {
                    buildingWiseFloorMap.get(floor.Building__c).add(floor);
                } else {
                    buildingWiseFloorMap.put(floor.Building__c, new List<Floor__c>{floor});
                }
            }
            for(Unit__c unit : units) {
                if(floorWiseUnitMap.containsKey(unit.Floor__c)) {
                    floorWiseUnitMap.get(unit.Floor__c).add(unit);
                } else {
                    floorWiseUnitMap.put(unit.Floor__c, new List<Unit__c>{unit});
                }
            }



            List<Map<String, Object>> structureData = new List<Map<String, Object>>();

            for (Property__c property : properties) {
                Map<String, Object> propertyStructureMap = new Map<String, Object>();
                propertyStructureMap.put('id', property.Id);
                propertyStructureMap.put('name', property.Name);
                propertyStructureMap.put('description', '');
                // propertyStructureMap.put('isVisible', buildings);
                // propertyStructureMap.put('isExpanded', true);
                // propertyStructureMap.put('isActionAvailable', true);

                List<Map<String, Object>> buildingsStructureList = new List<Map<String, Object>>();
                if(propertyWiseBuildingMap.containsKey(property.Id)) {
                    for (Building__c building : propertyWiseBuildingMap.get(property.Id)) {
                        Map<String, Object> buildingStructureMap = new Map<String, Object>();
                        buildingStructureMap.put('id', building.Id);
                        buildingStructureMap.put('name', building.Name);
                        buildingStructureMap.put('description', building.Building_Description__c);
                        // buildingStructureMap.put('isVisible', true);
                        // buildingStructureMap.put('isExpanded', true);
                        // buildingStructureMap.put('isActionAvailable', true);

                        List<Map<String, Object>> floorsStructureList = new List<Map<String, Object>>();
                        if(buildingWiseFloorMap.containsKey(building.Id)) {
                            for (Floor__c floor : buildingWiseFloorMap.get(building.Id)) {
                                Map<String, Object> floorStructureMap = new Map<String, Object>();
                                floorStructureMap.put('id', floor.Id);
                                floorStructureMap.put('name', floor.Name);
                                floorStructureMap.put('description', floor.Floor_Description__c);
                                // floorStructureMap.put('isVisible', buildings);
                                // floorStructureMap.put('isExpanded', true);
                                // floorStructureMap.put('isActionAvailable', true);

                                List<Map<String, Object>> unitsStructureList = new List<Map<String, Object>>();
                                if(floorWiseUnitMap.containsKey(floor.Id)) {
                                    for (Unit__c unit : floorWiseUnitMap.get(floor.Id)) {
                                        Map<String, Object> unitStructureMap = new Map<String, Object>();
                                        unitStructureMap.put('id', unit.Id);
                                        unitStructureMap.put('name', unit.Name);
                                        unitStructureMap.put('description', unit.Unit_Description__c);
                                        // unitStructureMap.put('isVisible', buildings);
                                        // unitStructureMap.put('isExpanded', true);
                                        // unitStructureMap.put('isActionAvailable', true);

                                        unitsStructureList.add(unitStructureMap);
                                    }
                                }

                                floorStructureMap.put('units', unitsStructureList);
                                floorsStructureList.add(floorStructureMap);
                            }
                        }

                        buildingStructureMap.put('floors', floorsStructureList);
                        buildingsStructureList.add(buildingStructureMap);
                    }
                }

                propertyStructureMap.put('buildings', buildingsStructureList);
                structureData.add(propertyStructureMap);
            }

            return structureData;


        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
}