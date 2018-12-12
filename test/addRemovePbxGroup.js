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

var fullProject = require('./fixtures/full-project')
    fullProjectStr = JSON.stringify(fullProject),
    pbx = require('../lib/pbxProject'),
    proj = new pbx('.');

function cleanHash() {
    return JSON.parse(fullProjectStr);
}

exports.setUp = function (callback) {
    proj.hash = cleanHash();
    callback();
}

exports.addRemovePbxGroup = {
    'should return a pbxGroup': function (test) {
        var pbxGroup = proj.addPbxGroup(['file.m'], 'MyGroup', 'Application', 'Application', '"<group>"');

        test.ok(typeof pbxGroup === 'object');
        test.done()
    },
    'should set a uuid on the pbxGroup': function (test) {
        var pbxGroup = proj.addPbxGroup(['file.m'], 'MyGroup', 'Application', 'Application', '"<group>"');

        test.ok(pbxGroup.uuid);
        test.done()
    },
    'should add all files to pbxGroup': function (test) {
        var pbxGroup = proj.addPbxGroup(['file.m'], 'MyGroup', 'Application', 'Application', '"<group>"');
        for (var index = 0; index < pbxGroup.pbxGroup.children.length; index++) {
            var file = pbxGroup.pbxGroup.children[index];
            test.ok(file.value);
        }

        test.done()
    },
    'should add the PBXGroup object correctly': function (test) {
        var pbxGroup = proj.addPbxGroup(['file.m'], 'MyGroup', 'Application', '"<group>"');
            pbxGroupInPbx = proj.pbxGroupByName('MyGroup');

        test.equal(pbxGroupInPbx.children, pbxGroup.pbxGroup.children);
        test.equal(pbxGroupInPbx.isa, 'PBXGroup');
        test.equal(pbxGroupInPbx.path, 'Application');
        test.equal(pbxGroupInPbx.sourceTree, '"<group>"');
        test.done();
    },
    'should add <group> sourceTree if no other specified': function (test) {
        var pbxGroup = proj.addPbxGroup(['file.m'], 'MyGroup', 'Application');
            pbxGroupInPbx = proj.pbxGroupByName('MyGroup');

        test.equal(pbxGroupInPbx.sourceTree, '"<group>"');
        test.done();
    },
    'should add each of the files to PBXBuildFile section': function (test) {
        var buildFileSection = proj.pbxBuildFileSection();
        for (var key in buildFileSection) {
            test.notEqual(buildFileSection[key].fileRef_comment, 'file.m');
            test.notEqual(buildFileSection[key].fileRef_comment, 'assets.bundle');
        }

        var initialBuildFileSectionItemsCount = Object.keys(buildFileSection),
            pbxGroup = proj.addPbxGroup(['file.m', 'assets.bundle'], 'MyGroup', 'Application', '"<group>"'),
            afterAdditionBuildFileSectionItemsCount = Object.keys(buildFileSection);

        // for each file added in the build file section two keyes are added - one for the object and one for the comment
        test.equal(initialBuildFileSectionItemsCount.length, afterAdditionBuildFileSectionItemsCount.length - 4);
        test.done();
    },
    'should not add any of the files to PBXBuildFile section if already added': function (test) {
        var buildFileSection = proj.pbxBuildFileSection(),
            initialBuildFileSectionItemsCount = Object.keys(buildFileSection),
            pbxGroup = proj.addPbxGroup(['AppDelegate.m', 'AppDelegate.h'], 'MyGroup', 'Application', '"<group>"'),
            afterAdditionBuildFileSectionItemsCount = Object.keys(buildFileSection);

        test.deepEqual(initialBuildFileSectionItemsCount, afterAdditionBuildFileSectionItemsCount);
        test.done();
    },
    'should not add any of the files to PBXBuildFile section when they contain special symbols and are already added': function (test) {
        var buildFileSection = proj.pbxBuildFileSection(),
            initialBuildFileSectionItemsCount = Object.keys(buildFileSection),
            pbxGroup = proj.addPbxGroup(['KitchenSinktablet.app'], 'MyGroup', 'Application', '"<group>"'),
            afterAdditionBuildFileSectionItemsCount = Object.keys(buildFileSection);

        test.deepEqual(initialBuildFileSectionItemsCount, afterAdditionBuildFileSectionItemsCount);
        test.done();
    },
    'should add all files which are not added and not add files already added to PBXBuildFile section': function (test) {
        var buildFileSection = proj.pbxBuildFileSection();
        for (var key in buildFileSection) {
            test.notEqual(buildFileSection[key].fileRef_comment, 'file.m');
            test.notEqual(buildFileSection[key].fileRef_comment, 'assets.bundle');
        }

        var initialBuildFileSectionItemsCount = Object.keys(buildFileSection),
            pbxGroup = proj.addPbxGroup(['AppDelegate.m', 'AppDelegate.h', 'file.m', 'assets.bundle'], 'MyGroup', 'Application', '"<group>"'),
            afterAdditionBuildFileSectionItemsCount = Object.keys(buildFileSection);

        // for each file added in the build file section two keyes are added - one for the object and one for the comment
        test.equal(initialBuildFileSectionItemsCount.length, afterAdditionBuildFileSectionItemsCount.length - 4);
        test.done();
    },
    'should add each of the files to PBXFileReference section': function (test) {
        var fileReference = proj.pbxFileReferenceSection();
        for (var key in fileReference) {
            test.notEqual(fileReference[key].fileRef_comment, 'file.m');
            test.notEqual(fileReference[key].fileRef_comment, 'assets.bundle');
        }
        var pbxGroup = proj.addPbxGroup(['file.m', 'assets.bundle'], 'MyGroup', 'Application', '"<group>"');
        for (var index = 0; index < pbxGroup.pbxGroup.children.length; index++) {
            var file = pbxGroup.pbxGroup.children[index];
            test.ok(fileReference[file.value]);
        }

        test.done();
    },
    'should not add any of the files to PBXFileReference section if already added': function (test) {
        var fileReference = proj.pbxFileReferenceSection (),
            initialBuildFileSectionItemsCount = Object.keys(fileReference),
            pbxGroup = proj.addPbxGroup(['AppDelegate.m', 'AppDelegate.h'], 'MyGroup', 'Application', '"<group>"'),
            afterAdditionBuildFileSectionItemsCount = Object.keys(fileReference);

        test.deepEqual(initialBuildFileSectionItemsCount, afterAdditionBuildFileSectionItemsCount);
        test.done();
    },
    'should not add any of the files to PBXFileReference section when they contain special symbols and are already added': function (test) {
        var fileReference = proj.pbxFileReferenceSection (),
            initialBuildFileSectionItemsCount = Object.keys(fileReference),
            pbxGroup = proj.addPbxGroup(['KitchenSinktablet.app'], 'MyGroup', 'Application', '"<group>"'),
            afterAdditionBuildFileSectionItemsCount = Object.keys(fileReference);

        test.deepEqual(initialBuildFileSectionItemsCount, afterAdditionBuildFileSectionItemsCount);
        test.done();
    },
    'should add all files which are not added and not add files already added to PBXFileReference section': function (test) {
        var fileReference = proj.pbxFileReferenceSection ();
        for (var key in fileReference) {
            test.notEqual(fileReference[key].fileRef_comment, 'file.m');
            test.notEqual(fileReference[key].fileRef_comment, 'assets.bundle');
        }

        var initialBuildFileSectionItemsCount = Object.keys(fileReference),
            pbxGroup = proj.addPbxGroup(['AppDelegate.m', 'AppDelegate.h', 'file.m', 'assets.bundle'], 'MyGroup', 'Application', '"<group>"'),
            afterAdditionBuildFileSectionItemsCount = Object.keys(fileReference);

        // for each file added in the file reference section two keyes are added - one for the object and one for the comment
        test.equal(initialBuildFileSectionItemsCount.length, afterAdditionBuildFileSectionItemsCount.length - 4);
        test.done();
    },
    'should remove a pbxGroup': function (test) {
        var groupName = 'MyGroup';
        proj.addPbxGroup(['file.m'], groupName, 'Application', 'Application', '"<group>"');
        proj.removePbxGroup(groupName);

        var pbxGroupInPbx = proj.pbxGroupByName(groupName);
        console.log(pbxGroupInPbx);

        test.ok(!pbxGroupInPbx);
        test.done()
    }
}
