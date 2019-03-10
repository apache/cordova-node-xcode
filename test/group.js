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
const pbxFile = require('../lib/pbxFile');
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
    project = new pbx('test/parser/projects/group.pbxproj');
    projectHash = project.parseSync();
    callback();
};

exports.getGroupByKey = {
    'should return PBXGroup for Classes': function (test) {
        const groupKey = project.findPBXGroupKey({ name: 'Classes' });
        const group = project.getPBXGroupByKey(groupKey);
        test.ok(group.name === 'Classes');
        test.done();
    },
    'should return PBXGroup for Plugins': function (test) {
        const groupKey = project.findPBXGroupKey({ name: 'Plugins' });
        const group = project.getPBXGroupByKey(groupKey);
        test.ok(group.name === 'Plugins');
        test.done();
    }
};

exports.createGroup = {
    'should create a new Test Group': function (test) {
        let found = false;
        let groups = project.getPBXObject('PBXGroup');

        found = findByName(groups, 'Test');
        test.ok(found === false);

        let group = project.findPBXGroupKey({ name: 'Test' });
        test.ok(group === undefined);

        project.pbxCreateGroup('Test', 'Test');

        groups = project.getPBXObject('PBXGroup');
        found = findByName(groups, 'Test');
        test.ok(found === true);

        group = project.findPBXGroupKey({ name: 'Test' });
        test.ok(typeof group === 'string');
        test.done();
    }
};

exports.findGroupKey = {
    'should return a valid group key': function (test) {
        const keyByName = project.findPBXGroupKey({ name: 'Classes' });
        const keyByPath = project.findPBXGroupKey({ path: 'icons' });
        const keyByPathName = project.findPBXGroupKey({
            path: '"HelloCordova/Plugins"',
            name: 'Plugins'
        });
        const nonExistingKey = project.findPBXGroupKey({ name: 'Foo' });

        test.ok(keyByName === '080E96DDFE201D6D7F000001');
        test.ok(keyByPath === '308D052D1370CCF300D202BF');
        test.ok(keyByPathName === '307C750510C5A3420062BCA9');
        test.ok(nonExistingKey === undefined);

        test.done();
    }
};

exports.addGroupToGroup = {
    'should create a new test group then add group to Classes group': function (
        test
    ) {
        const testKey = project.pbxCreateGroup('Test', 'Test');
        const classesKey = project.findPBXGroupKey({ name: 'Classes' });
        project.addToPbxGroup(testKey, classesKey);

        const classesGroup = project.getPBXGroupByKey(classesKey);
        let foundTestGroup = false;
        for (let i = 0, j = classesGroup.children.length; i < j; i++) {
            const child = classesGroup.children[i];
            if (child.value === testKey && child.comment === 'Test') {
                foundTestGroup = true;
            }
        }

        test.ok(foundTestGroup);

        test.done();
    }
};

exports.predefinedPbxGroups = {
    setUp: function (callback) {
        project = new pbx(
            'test/parser/projects/empty-groups.pbxproj'
        ).parseSync();

        this.file = new pbxFile('some-file.m');
        this.file.fileRef = project.generateUuid();
        project.addToPbxFileReferenceSection(this.file);

        callback();
    },

    'should add a file to "Plugins" group': function (test) {
        project.addToPluginsPbxGroup(this.file);
        const foundInGroup = findChildInGroup(
            project.pbxGroupByName('Plugins'),
            this.file.fileRef
        );
        test.ok(foundInGroup);
        test.done();
    },

    'should remove a file from "Plugins" group': function (test) {
        project.addToPluginsPbxGroup(this.file);
        project.removeFromPluginsPbxGroup(this.file);

        const foundInGroup = findChildInGroup(
            project.pbxGroupByName('Plugins'),
            this.file.fileRef
        );
        test.ok(!foundInGroup);
        test.done();
    },

    'should add a file to "Resources" group': function (test) {
        project.addToResourcesPbxGroup(this.file);

        const foundInGroup = findChildInGroup(
            project.pbxGroupByName('Resources'),
            this.file.fileRef
        );
        test.ok(foundInGroup);
        test.done();
    },

    'should remove a file from "Resources" group': function (test) {
        project.addToResourcesPbxGroup(this.file);
        project.removeFromResourcesPbxGroup(this.file);

        const foundInGroup = findChildInGroup(
            project.pbxGroupByName('Resources'),
            this.file.fileRef
        );
        test.ok(!foundInGroup);
        test.done();
    },

    'should add a file to "Frameworks" group': function (test) {
        project.addToFrameworksPbxGroup(this.file);

        const foundInGroup = findChildInGroup(
            project.pbxGroupByName('Frameworks'),
            this.file.fileRef
        );
        test.ok(foundInGroup);
        test.done();
    },

    'should remove a file from "Frameworks" group': function (test) {
        project.addToFrameworksPbxGroup(this.file);
        project.removeFromFrameworksPbxGroup(this.file);

        const foundInGroup = findChildInGroup(
            project.pbxGroupByName('Frameworks'),
            this.file.fileRef
        );
        test.ok(!foundInGroup);
        test.done();
    },

    'should add a file to "Products" group': function (test) {
        project.addToProductsPbxGroup(this.file);

        const foundInGroup = findChildInGroup(
            project.pbxGroupByName('Products'),
            this.file.fileRef
        );
        test.ok(foundInGroup);
        test.done();
    },

    'should remove a file from "Products" group': function (test) {
        project.addToProductsPbxGroup(this.file);
        project.removeFromProductsPbxGroup(this.file);

        const foundInGroup = findChildInGroup(
            project.pbxGroupByName('Products'),
            this.file.fileRef
        );
        test.ok(!foundInGroup);
        test.done();
    }
};

exports.addSourceFileToGroup = {
    'should create group + add source file': function (test) {
        const testKey = project.pbxCreateGroup('Test', 'Test');
        const file = project.addSourceFile('Notifications.m', {}, testKey);

        const foundInGroup = findChildInGroup(
            project.getPBXGroupByKey(testKey),
            file.fileRef
        );
        test.ok(foundInGroup);

        const foundInBuildFileSection = findByFileRef(
            project.pbxBuildFileSection(),
            file.fileRef
        );
        test.ok(foundInBuildFileSection);

        const foundInBuildPhase = findFileByUUID(
            project.pbxSourcesBuildPhaseObj(),
            file.uuid
        );
        test.ok(foundInBuildPhase);

        test.done();
    }
};

exports.removeSourceFileFromGroup = {
    'should create group + add source file then remove source file': function (
        test
    ) {
        const testKey = project.pbxCreateGroup('Test', 'Test');
        const file = project.addSourceFile('Notifications.m', {}, testKey);

        let foundInGroup = findChildInGroup(
            project.getPBXGroupByKey(testKey),
            file.fileRef
        );
        test.ok(foundInGroup);

        let foundInBuildFileSection = findByFileRef(
            project.pbxBuildFileSection(),
            file.fileRef
        );
        test.ok(foundInBuildFileSection);

        let foundInBuildPhase = findFileByUUID(
            project.pbxSourcesBuildPhaseObj(),
            file.uuid
        );
        test.ok(foundInBuildPhase);

        project.removeSourceFile('Notifications.m', {}, testKey);

        foundInGroup = findChildInGroup(
            project.getPBXGroupByKey(testKey),
            file.fileRef
        );
        test.ok(!foundInGroup);

        foundInBuildFileSection = findByFileRef(
            project.pbxBuildFileSection(),
            file.fileRef
        );
        test.ok(!foundInBuildFileSection);

        foundInBuildPhase = findFileByUUID(
            project.pbxSourcesBuildPhaseObj(),
            file.uuid
        );
        test.ok(!foundInBuildPhase);

        test.done();
    }
};

exports.addHeaderFileToGroup = {
    'should create group + add header file': function (test) {
        const testKey = project.pbxCreateGroup('Test', 'Test');
        const file = project.addHeaderFile('Notifications.h', {}, testKey);

        const foundInGroup = findChildInGroup(
            project.getPBXGroupByKey(testKey),
            file.fileRef
        );
        test.ok(foundInGroup);

        test.done();
    }
};

exports.removeHeaderFileFromGroup = {
    'should create group + add source file then remove header file': function (
        test
    ) {
        const testKey = project.pbxCreateGroup('Test', 'Test');
        const file = project.addHeaderFile('Notifications.h', {}, testKey);

        let foundInGroup = findChildInGroup(
            project.getPBXGroupByKey(testKey),
            file.fileRef
        );
        test.ok(foundInGroup);

        project.removeHeaderFile('Notifications.h', {}, testKey);

        foundInGroup = findChildInGroup(
            project.getPBXGroupByKey(testKey),
            file.fileRef
        );
        test.ok(!foundInGroup);

        test.done();
    }
};

exports.addResourceFileToGroup = {
    'should add resource file (PNG) to the splash group': function (test) {
        const testKey = project.findPBXGroupKey({ path: 'splash' });
        const file = project.addResourceFile(
            'DefaultTest-667h.png',
            {},
            testKey
        );

        const foundInGroup = findChildInGroup(
            project.getPBXGroupByKey(testKey),
            file.fileRef
        );
        test.ok(foundInGroup);

        test.done();
    }
};

exports.removeResourceFileFromGroup = {
    'should add resource file (PNG) then remove resource file from splash group': function (
        test
    ) {
        const testKey = project.findPBXGroupKey({ path: 'splash' });
        const file = project.addResourceFile(
            'DefaultTest-667h.png',
            {},
            testKey
        );

        let foundInGroup = findChildInGroup(
            project.getPBXGroupByKey(testKey),
            file.fileRef
        );
        test.ok(foundInGroup);

        project.removeResourceFile('DefaultTest-667h.png', {}, testKey);

        foundInGroup = findChildInGroup(
            project.getPBXGroupByKey(testKey),
            file.fileRef
        );
        test.ok(!foundInGroup);

        test.done();
    }
};

exports.retrieveBuildPropertyForBuild = {
    'should retrieve valid build property ': function (test) {
        const releaseTargetedDeviceFamily = project.getBuildProperty(
            'TARGETED_DEVICE_FAMILY',
            'Release'
        );
        const debugTargetedDeviceFamily = project.getBuildProperty(
            'TARGETED_DEVICE_FAMILY',
            'Debug'
        );
        const nonExistingProperty = project.getBuildProperty('FOO', 'Debug');
        const nonExistingBuild = project.getBuildProperty(
            'TARGETED_DEVICE_FAMILY',
            'Foo'
        );

        test.equal(releaseTargetedDeviceFamily, '"1,2"');
        test.equal(debugTargetedDeviceFamily, '"1"');
        test.equal(nonExistingProperty, undefined);
        test.equal(nonExistingBuild, undefined);

        test.done();
    }
};

exports.retrieveBuildConfigByName = {
    'should retrieve valid build config': function (test) {
        const releaseBuildConfig = project.getBuildConfigByName('Release');
        for (const property in releaseBuildConfig) {
            const value = releaseBuildConfig[property];
            test.ok(value.name === 'Release');
        }

        const debugBuildConfig = project.getBuildConfigByName('Debug');
        for (const property in debugBuildConfig) {
            const value = debugBuildConfig[property];
            test.ok(value.name === 'Debug');
        }

        const nonExistingBuildConfig = project.getBuildConfigByName('Foo');
        test.deepEqual(nonExistingBuildConfig, {});

        test.done();
    }
};

/* This proves the issue in 0.6.7
exports.validatePropReplaceException = {
    'should throw TypeError for updateBuildProperty VALID_ARCHS when none existed' : function(test) {
        test.throws(
            function() {
                project.updateBuildProperty('VALID_ARCHS', '"armv7 armv7s');
            },
            TypeError,
            "Object object has no method 'hasOwnProperty'"
        );
        test.done();
    }
}
*/

exports.validatePropReplaceFix = {
    'should create build configuration for VALID_ARCHS when none existed': function (
        test
    ) {
        project.updateBuildProperty('VALID_ARCHS', '"armv7 armv7s"', 'Debug');
        test.done();
    }
};

exports.validateHasFile = {
    'should return true for has file MainViewController.m': function (test) {
        const result = project.hasFile('MainViewController.m');
        test.ok(result.path == 'MainViewController.m');
        test.done();
    }
};

exports.testWritingPBXProject = {
    'should successfully write to PBXProject TargetAttributes': function (
        test
    ) {
        const pbxProjectObj = project.getPBXObject('PBXProject');
        let pbxProject;
        for (const property in pbxProjectObj) {
            if (!/comment/.test(property)) {
                pbxProject = pbxProjectObj[property];
            }
        }

        let target;
        const projectTargets = pbxProject.targets;
        for (let i = 0, j = pbxProject.targets.length; i < j; i++) {
            target = pbxProject.targets[i].value;
        }

        pbxProject.attributes.TargetAttributes = {};
        pbxProject.attributes.TargetAttributes[target] = {
            DevelopmentTeam: 'N6X4RJZZ5D',
            SystemCapabilities: {
                'com.apple.BackgroundModes': {
                    enabled: 0
                },
                'com.apple.DataProtection': {
                    enabled: 0
                },
                'com.apple.Keychain': {
                    enabled: 1
                }
            }
        };

        const output = project.writeSync();

        test.done();
    },
    'should add target attribute to PBXProject TargetAttributes': function (
        test
    ) {
        project.addTargetAttribute('ProvisioningStyle', 'Manual');
        const output = project.writeSync();
        test.equal(output.match(/ProvisioningStyle\s*=\s*Manual/g).length, 1);

        test.done();
    },
    'should change target attribute at PBXProject TargetAttributes': function (
        test
    ) {
        project.addTargetAttribute('ProvisioningStyle', 'Manual');
        let output = project.writeSync();
        test.equal(output.match(/ProvisioningStyle\s*=\s*Manual/g).length, 1);

        project.addTargetAttribute('ProvisioningStyle', 'Automatic');
        output = project.writeSync();
        test.equal(output.match(/ProvisioningStyle\s*=\s*Manual/g), null);
        test.equal(
            output.match(/ProvisioningStyle\s*=\s*Automatic/g).length,
            1
        );

        test.done();
    },
    'should remove target attribute from PBXProject TargetAttributes': function (
        test
    ) {
        project.addTargetAttribute('ProvisioningStyle', 'Manual');
        let output = project.writeSync();
        test.equal(output.match(/ProvisioningStyle\s*=\s*Manual/g).length, 1);

        project.removeTargetAttribute('ProvisioningStyle');
        output = project.writeSync();
        test.equal(output.match(/ProvisioningStyle\s*=\s*Manual/g), null);

        test.done();
    }
};
