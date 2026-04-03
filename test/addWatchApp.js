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
const pbxFile = require('../lib/pbxFile');
const proj = new pbx('.');

function cleanHash () {
    return JSON.parse(fullProjectStr);
}

const TARGET_NAME = 'TestWatchApp';
const TARGET_TYPE = 'watch_app';
const TARGET_SUBFOLDER_NAME = 'TestWatchAppFiles';

describe('addWatchApp', () => {
    beforeEach(() => {
        proj.hash = cleanHash();
    });
    it('should create a new watch app target with the correct product type', () => {
        const target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME);

        assert.ok(typeof target === 'object');
        assert.ok(target.uuid);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.isa);
        assert.ok(target.pbxNativeTarget.name);
        assert.ok(target.pbxNativeTarget.productName);
        assert.ok(target.pbxNativeTarget.productReference);
        assert.ok(target.pbxNativeTarget.productType);
        assert.ok(target.pbxNativeTarget.buildConfigurationList);
        assert.ok(target.pbxNativeTarget.buildPhases);
        assert.ok(target.pbxNativeTarget.buildRules);
        assert.ok(target.pbxNativeTarget.dependencies);

        assert.equal(target.pbxNativeTarget.productType, '"com.apple.product-type.application.watchapp"');
    });

    it('should create a new watch app target with the correct product type, without needing a subfolder name', () => {
        const target = proj.addTarget(TARGET_NAME, TARGET_TYPE);

        assert.ok(typeof target === 'object');
        assert.ok(target.uuid);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.isa);
        assert.ok(target.pbxNativeTarget.name);
        assert.ok(target.pbxNativeTarget.productName);
        assert.ok(target.pbxNativeTarget.productReference);
        assert.ok(target.pbxNativeTarget.productType);
        assert.ok(target.pbxNativeTarget.buildConfigurationList);
        assert.ok(target.pbxNativeTarget.buildPhases);
        assert.ok(target.pbxNativeTarget.buildRules);
        assert.ok(target.pbxNativeTarget.dependencies);

        assert.equal(target.pbxNativeTarget.productType, '"com.apple.product-type.application.watchapp"');
    });

    it('should create a new watch app target and add source, framework, resource and header files and the corresponding build phases', () => {
        const target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME);
        const options = { target: target.uuid };

        const sourceFile = proj.addSourceFile('Plugins/file.m', options);
        const sourcePhase = proj.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', target.uuid);
        const resourceFile = proj.addResourceFile('assets.bundle', options);
        const resourcePhase = proj.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid);
        const frameworkFile = proj.addFramework('libsqlite3.dylib', options);
        const frameworkPhase = proj.addBuildPhase([], 'PBXFrameworkBuildPhase', 'Frameworks', target.uuid);
        const headerFile = proj.addHeaderFile('file.h', options);

        assert.ok(sourcePhase);
        assert.ok(resourcePhase);
        assert.ok(frameworkPhase);

        assert.equal(sourceFile.constructor, pbxFile);
        assert.equal(resourceFile.constructor, pbxFile);
        assert.equal(frameworkFile.constructor, pbxFile);
        assert.equal(headerFile.constructor, pbxFile);

        assert.ok(typeof target === 'object');
        assert.ok(target.uuid);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.isa);
        assert.ok(target.pbxNativeTarget.name);
        assert.ok(target.pbxNativeTarget.productName);
        assert.ok(target.pbxNativeTarget.productReference);
        assert.ok(target.pbxNativeTarget.productType);
        assert.ok(target.pbxNativeTarget.buildConfigurationList);
        assert.ok(target.pbxNativeTarget.buildPhases);
        assert.ok(target.pbxNativeTarget.buildRules);
        assert.ok(target.pbxNativeTarget.dependencies);
    });
});
