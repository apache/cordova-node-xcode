/**
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const fullProject = require('./fixtures/full-project');
const fullProjectStr = JSON.stringify(fullProject);
const pbx = require('../lib/pbxProject');
const proj = new pbx('.');

function cleanHash () {
    return JSON.parse(fullProjectStr);
}

describe('addRemovePbxGroup', () => {
    beforeEach(() => {
        proj.hash = cleanHash();
    });

    it('should return a pbxGroup', () => {
        const pbxGroup = proj.addPbxGroup(['file.m'], 'MyGroup', 'Application', 'Application', '"<group>"');
        assert.ok(typeof pbxGroup === 'object');
    });

    it('should set a uuid on the pbxGroup', () => {
        const pbxGroup = proj.addPbxGroup(['file.m'], 'MyGroup', 'Application', 'Application', '"<group>"');
        assert.ok(pbxGroup.uuid);
    });

    it('should add all files to pbxGroup', () => {
        const pbxGroup = proj.addPbxGroup(['file.m'], 'MyGroup', 'Application', 'Application', '"<group>"');
        for (let index = 0; index < pbxGroup.pbxGroup.children.length; index++) {
            const file = pbxGroup.pbxGroup.children[index];
            assert.ok(file.value);
        }
    });

    it('should add the PBXGroup object correctly', () => {
        const pbxGroup = proj.addPbxGroup(['file.m'], 'MyGroup', 'Application', '"<group>"');
        const pbxGroupInPbx = proj.pbxGroupByName('MyGroup');

        assert.equal(pbxGroupInPbx.children, pbxGroup.pbxGroup.children);
        assert.equal(pbxGroupInPbx.isa, 'PBXGroup');
        assert.equal(pbxGroupInPbx.path, 'Application');
        assert.equal(pbxGroupInPbx.sourceTree, '"<group>"');
    });

    it('should add <group> sourceTree if no other specified', () => {
        proj.addPbxGroup(['file.m'], 'MyGroup', 'Application');

        const pbxGroupInPbx = proj.pbxGroupByName('MyGroup');

        assert.equal(pbxGroupInPbx.sourceTree, '"<group>"');
    });

    it('should add each of the files to PBXBuildFile section', () => {
        const buildFileSection = proj.pbxBuildFileSection();
        for (const key in buildFileSection) {
            assert.notEqual(buildFileSection[key].fileRef_comment, 'file.m');
            assert.notEqual(buildFileSection[key].fileRef_comment, 'assets.bundle');
        }

        const initialBuildFileSectionItemsCount = Object.keys(buildFileSection);
        const pbxGroup = proj.addPbxGroup(['file.m', 'assets.bundle'], 'MyGroup', 'Application', '"<group>"');
        const afterAdditionBuildFileSectionItemsCount = Object.keys(buildFileSection);

        assert.equal(initialBuildFileSectionItemsCount.length, afterAdditionBuildFileSectionItemsCount.length - 4);
    });

    it('should not add any of the files to PBXBuildFile section if already added', () => {
        const buildFileSection = proj.pbxBuildFileSection();
        const initialBuildFileSectionItemsCount = Object.keys(buildFileSection);
        const pbxGroup = proj.addPbxGroup(['AppDelegate.m', 'AppDelegate.h'], 'MyGroup', 'Application', '"<group>"');
        const afterAdditionBuildFileSectionItemsCount = Object.keys(buildFileSection);

        assert.deepEqual(initialBuildFileSectionItemsCount, afterAdditionBuildFileSectionItemsCount);
    });

    it('should not add any of the files to PBXBuildFile section when they contain special symbols and are already added', () => {
        const buildFileSection = proj.pbxBuildFileSection();
        const initialBuildFileSectionItemsCount = Object.keys(buildFileSection);
        const pbxGroup = proj.addPbxGroup(['KitchenSinktablet.app'], 'MyGroup', 'Application', '"<group>"');
        const afterAdditionBuildFileSectionItemsCount = Object.keys(buildFileSection);

        assert.deepEqual(initialBuildFileSectionItemsCount, afterAdditionBuildFileSectionItemsCount);
    });

    it('should add all files which are not added and not add files already added to PBXBuildFile section', () => {
        const buildFileSection = proj.pbxBuildFileSection();
        for (const key in buildFileSection) {
            assert.notEqual(buildFileSection[key].fileRef_comment, 'file.m');
            assert.notEqual(buildFileSection[key].fileRef_comment, 'assets.bundle');
        }

        const initialBuildFileSectionItemsCount = Object.keys(buildFileSection);
        const pbxGroup = proj.addPbxGroup(['AppDelegate.m', 'AppDelegate.h', 'file.m', 'assets.bundle'], 'MyGroup', 'Application', '"<group>"');
        const afterAdditionBuildFileSectionItemsCount = Object.keys(buildFileSection);

        assert.equal(initialBuildFileSectionItemsCount.length, afterAdditionBuildFileSectionItemsCount.length - 4);
    });

    it('should add each of the files to PBXFileReference section', () => {
        const fileReference = proj.pbxFileReferenceSection();
        for (const key in fileReference) {
            assert.notEqual(fileReference[key].fileRef_comment, 'file.m');
            assert.notEqual(fileReference[key].fileRef_comment, 'assets.bundle');
        }

        const pbxGroup = proj.addPbxGroup(['file.m', 'assets.bundle'], 'MyGroup', 'Application', '"<group>"');
        for (let index = 0; index < pbxGroup.pbxGroup.children.length; index++) {
            const file = pbxGroup.pbxGroup.children[index];
            assert.ok(fileReference[file.value]);
        }
    });

    it('should not add any of the files to PBXFileReference section if already added', () => {
        const fileReference = proj.pbxFileReferenceSection();
        const initialBuildFileSectionItemsCount = Object.keys(fileReference);
        const pbxGroup = proj.addPbxGroup(['AppDelegate.m', 'AppDelegate.h'], 'MyGroup', 'Application', '"<group>"');
        const afterAdditionBuildFileSectionItemsCount = Object.keys(fileReference);

        assert.deepEqual(initialBuildFileSectionItemsCount, afterAdditionBuildFileSectionItemsCount);
    });

    it('should not add any of the files to PBXFileReference section when they contain special symbols and are already added', () => {
        const fileReference = proj.pbxFileReferenceSection();
        const initialBuildFileSectionItemsCount = Object.keys(fileReference);
        const pbxGroup = proj.addPbxGroup(['KitchenSinktablet.app'], 'MyGroup', 'Application', '"<group>"');
        const afterAdditionBuildFileSectionItemsCount = Object.keys(fileReference);

        assert.deepEqual(initialBuildFileSectionItemsCount, afterAdditionBuildFileSectionItemsCount);
    });

    it('should add all files which are not added and not add files already added to PBXFileReference section', () => {
        const fileReference = proj.pbxFileReferenceSection();
        for (const key in fileReference) {
            assert.notEqual(fileReference[key].fileRef_comment, 'file.m');
            assert.notEqual(fileReference[key].fileRef_comment, 'assets.bundle');
        }

        const initialBuildFileSectionItemsCount = Object.keys(fileReference);
        const pbxGroup = proj.addPbxGroup(['AppDelegate.m', 'AppDelegate.h', 'file.m', 'assets.bundle'], 'MyGroup', 'Application', '"<group>"');
        const afterAdditionBuildFileSectionItemsCount = Object.keys(fileReference);

        assert.equal(initialBuildFileSectionItemsCount.length, afterAdditionBuildFileSectionItemsCount.length - 4);
    });

    it('should remove a pbxGroup', () => {
        const groupName = 'MyGroup';
        proj.addPbxGroup(['file.m'], groupName, 'Application', 'Application', '"<group>"');
        proj.removePbxGroup(groupName);

        const pbxGroupInPbx = proj.pbxGroupByName(groupName);
        console.log(pbxGroupInPbx);

        assert.ok(!pbxGroupInPbx);
    });
});
