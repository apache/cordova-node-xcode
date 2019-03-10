/**
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 'License'); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

const pbx = require('../lib/pbxProject');
let project;
let projectHash;

const findChildInGroup = function (obj, target) {
    let found = false;

    for (let i = 0, j = obj.children.length; i < j; i++) {
        if (obj.children[i].value === target) {
            found = true;
            break;
        }
    }

    return found;
};

const findFileByUUID = function (obj, target) {
    let found = false;

    for (let k = 0, l = obj.files.length; k < l; k++) {
        if (obj.files[k].value === target) {
            found = true;
            break;
        }
    }

    return found;
};

const findByFileRef = function (obj, target) {
    let found = false;

    for (const property in obj) {
        if (!/comment/.test(property)) {
            if (obj[property].fileRef === target) {
                found = true;
                break;
            }
        }
    }
    return found;
};

const findByName = function (obj, target) {
    let found = false;
    for (const property in obj) {
        if (!/comment/.test(property)) {
            const value = obj[property];
            if (value.name === target) {
                found = true;
            }
        }
    }
    return found;
};

exports.setUp = function (callback) {
    project = new pbx('test/parser/projects/variantgroup.pbxproj');
    projectHash = project.parseSync();
    callback();
};

exports.getVariantGroupByKey = {
    'should return PBXVariantGroup for Localizable.strings': function (test) {
        const groupKey = project.findPBXVariantGroupKey({
            name: 'Localizable.strings'
        });
        const group = project.getPBXVariantGroupByKey(groupKey);
        test.ok(group.name === 'Localizable.strings');
        test.done();
    }
};

exports.createVariantGroup = {
    'should create a new Test Variant Group': function (test) {
        delete project.getPBXObject('PBXVariantGroup');

        let found = false;
        let groups = project.getPBXObject('PBXVariantGroup');

        found = findByName(groups, 'Test');
        test.ok(found === false);

        let group = project.findPBXVariantGroupKey({ name: 'Test' });
        test.ok(group === undefined);

        project.pbxCreateVariantGroup('Test');

        groups = project.getPBXObject('PBXVariantGroup');
        found = findByName(groups, 'Test');
        test.ok(found === true);

        group = project.findPBXVariantGroupKey({ name: 'Test' });
        test.ok(typeof group === 'string');
        test.done();
    }
};

exports.findVariantGroupKey = {
    'should return a valid group key': function (test) {
        const keyByName = project.findPBXVariantGroupKey({
            name: 'Localizable.strings'
        });
        const nonExistingKey = project.findPBXVariantGroupKey({ name: 'Foo' });

        test.ok(keyByName === '07E3BDBC1DF1DEA500E49912');
        test.ok(nonExistingKey === undefined);

        test.done();
    }
};

exports.createLocalisationVariantGroup = {
    'should create a new localisation variationgroup then add group to Resources group': function (
        test
    ) {
        delete project.getPBXObject('PBXVariantGroup');

        const localizationVariantGp = project.addLocalizationVariantGroup(
            'InfoPlist.strings'
        );

        const resourceGroupKey = project.findPBXGroupKey({ name: 'Resources' });
        const resourceGroup = project.getPBXGroupByKey(resourceGroupKey);
        const foundInResourcesGroup = findChildInGroup(
            resourceGroup,
            localizationVariantGp.fileRef
        );
        test.ok(foundInResourcesGroup);

        let foundInResourcesBuildPhase = false;
        const sources = project.pbxResourcesBuildPhaseObj();
        for (let i = 0, j = sources.files.length; i < j; i++) {
            const file = sources.files[i];
            if (file.value === localizationVariantGp.uuid) {
                foundInResourcesBuildPhase = true;
            }
        }
        test.ok(foundInResourcesBuildPhase);

        test.done();
    }
};

exports.addResourceFileToLocalisationGroup = {
    'should add resource file to the TestVariantGroup group': function (test) {
        const infoPlistVarGp = project.addLocalizationVariantGroup(
            'InfoPlist.strings'
        );
        const testKey = infoPlistVarGp.fileRef;
        const file = project.addResourceFile(
            'Resources/en.lproj/Localization.strings',
            { variantGroup: true },
            testKey
        );

        const foundInLocalisationVariantGroup = findChildInGroup(
            project.getPBXVariantGroupByKey(testKey),
            file.fileRef
        );
        test.ok(foundInLocalisationVariantGroup);

        let foundInResourcesBuildPhase = false;
        const sources = project.pbxResourcesBuildPhaseObj();
        for (let i = 0, j = sources.files.length; i < j; i++) {
            const sourceFile = sources.files[i];
            if (sourceFile.value === file.fileRef) {
                foundInResourcesBuildPhase = true;
            }
        }
        test.ok(!foundInResourcesBuildPhase);

        const buildFileSection = project.pbxBuildFileSection();
        test.ok(buildFileSection[file.uuid] === undefined);

        test.done();
    }
};

exports.removeResourceFileFromGroup = {
    'should add resource file then remove resource file from Localizable.strings group': function (
        test
    ) {
        const testKey = project.findPBXVariantGroupKey({
            name: 'Localizable.strings'
        });
        const file = project.addResourceFile(
            'Resources/zh.lproj/Localization.strings',
            {},
            testKey
        );

        let foundInGroup = findChildInGroup(
            project.getPBXVariantGroupByKey(testKey),
            file.fileRef
        );
        test.ok(foundInGroup);

        project.removeResourceFile(
            'Resources/zh.lproj/Localization.strings',
            {},
            testKey
        );

        foundInGroup = findChildInGroup(
            project.getPBXVariantGroupByKey(testKey),
            file.fileRef
        );
        test.ok(!foundInGroup);

        test.done();
    }
};
