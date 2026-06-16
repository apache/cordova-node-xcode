/*
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
const PBXProject = require('../lib/pbxProject');
const proj = new PBXProject('.');

function cleanHash () {
    return JSON.parse(fullProjectStr);
}

describe('pbxItemByComment', () => {
    beforeEach(() => {
        proj.hash = cleanHash();
    });

    it('should return PBXTargetDependency', () => {
        const pbxItem = proj.pbxItemByComment('PBXTargetDependency', 'PBXTargetDependency');

        assert.ok(pbxItem);
        assert.equal(pbxItem.isa, 'PBXTargetDependency');
    });

    it('should return PBXContainerItemProxy', () => {
        const pbxItem = proj.pbxItemByComment('libPhoneGap.a', 'PBXReferenceProxy');

        assert.ok(pbxItem);
        assert.equal(pbxItem.isa, 'PBXReferenceProxy');
    });

    it('should return PBXResourcesBuildPhase', () => {
        const pbxItem = proj.pbxItemByComment('Resources', 'PBXResourcesBuildPhase');

        assert.ok(pbxItem);
        assert.equal(pbxItem.isa, 'PBXResourcesBuildPhase');
    });

    it('should return PBXShellScriptBuildPhase', () => {
        const pbxItem = proj.pbxItemByComment('Touch www folder', 'PBXShellScriptBuildPhase');

        assert.ok(pbxItem);
        assert.equal(pbxItem.isa, 'PBXShellScriptBuildPhase');
    });

    it('should return null when PBXNativeTarget not found', () => {
        const pbxItem = proj.pbxItemByComment('Invalid', 'PBXTargetDependency');

        assert.equal(pbxItem, null);
    });
});
