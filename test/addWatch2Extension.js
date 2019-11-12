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
    pbxFile = require('../lib/pbxFile'),
    proj = new pbx('.');

function cleanHash() {
    return JSON.parse(fullProjectStr);
}

var TARGET_NAME = 'TestWatchExtension',
    TARGET_TYPE = 'watch2_extension',
    TARGET_SUBFOLDER_NAME = 'TestWatchExtensionFiles';

exports.setUp = function (callback) {
    proj.hash = cleanHash();
    callback();
}

exports.addWatchExtension = {
    'should create a new watch2 extension target with the correct product type': function (test) {
        var target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME);

        test.ok(typeof target == 'object');
        test.ok(target.uuid);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.isa);
        test.ok(target.pbxNativeTarget.name);
        test.ok(target.pbxNativeTarget.productName);
        test.ok(target.pbxNativeTarget.productReference);
        test.ok(target.pbxNativeTarget.productType);
        test.ok(target.pbxNativeTarget.buildConfigurationList);
        test.ok(target.pbxNativeTarget.buildPhases);
        test.ok(target.pbxNativeTarget.buildRules);
        test.ok(target.pbxNativeTarget.dependencies);
        test.equal(target.pbxNativeTarget.productType, '"com.apple.product-type.watchkit2-extension"');

        test.done();
    },
    'should create a new watch2 extension target and add source, framework, resource and header files and the corresponding build phases': function (test) {
        var target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME),
            options = { 'target' : target.uuid };

        var sourceFile = proj.addSourceFile('Plugins/file.m', options),
            sourcePhase = proj.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', target.uuid),
            resourceFile = proj.addResourceFile('assets.bundle', options),
            resourcePhase = proj.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid),
            frameworkFile = proj.addFramework('libsqlite3.dylib', options);
            frameworkPhase = proj.addBuildPhase([], 'PBXFrameworkBuildPhase', 'Frameworks', target.uuid),
            headerFile = proj.addHeaderFile('file.h', options);

        test.ok(sourcePhase);
        test.ok(resourcePhase);
        test.ok(frameworkPhase);

        test.equal(sourceFile.constructor, pbxFile);
        test.equal(resourceFile.constructor, pbxFile);
        test.equal(frameworkFile.constructor, pbxFile);
        test.equal(headerFile.constructor, pbxFile);

        test.ok(typeof target == 'object');
        test.ok(target.uuid);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.isa);
        test.ok(target.pbxNativeTarget.name);
        test.ok(target.pbxNativeTarget.productName);
        test.ok(target.pbxNativeTarget.productReference);
        test.ok(target.pbxNativeTarget.productType);
        test.ok(target.pbxNativeTarget.buildConfigurationList);
        test.ok(target.pbxNativeTarget.buildPhases);
        test.ok(target.pbxNativeTarget.buildRules);
        test.ok(target.pbxNativeTarget.dependencies);

        test.done();
    },
    'should not create a new watch2 extension build phase if no watch2 app exists': function (test) {
        var target = proj.addTarget(TARGET_NAME, TARGET_TYPE);

        test.ok(typeof target == 'object');
        test.ok(target.uuid);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.isa);
        test.ok(target.pbxNativeTarget.name);
        test.ok(target.pbxNativeTarget.productName);
        test.ok(target.pbxNativeTarget.productReference);
        test.ok(target.pbxNativeTarget.productType);
        test.ok(target.pbxNativeTarget.buildConfigurationList);
        test.ok(target.pbxNativeTarget.buildPhases);
        test.ok(target.pbxNativeTarget.buildRules);
        test.ok(target.pbxNativeTarget.dependencies);

        var buildPhase = proj.buildPhaseObject('PBXCopyFilesBuildPhase', 'Embed App Extensions', target.uuid)

        test.ok(!buildPhase);

        test.done();
    },
    'should create a new watch2 extension build phase if watch2 app exists': function (test) {
        proj.addTarget('TestWatchApp', 'watch2_app');
        var target = proj.addTarget(TARGET_NAME, TARGET_TYPE);

        var buildPhase = proj.buildPhaseObject('PBXCopyFilesBuildPhase', 'Embed App Extensions', target.uuid)

        test.ok(buildPhase);
        test.ok(buildPhase.files);
        test.equal(buildPhase.files.length, 1);
        test.ok(buildPhase.dstPath);
        test.equal(buildPhase.dstSubfolderSpec, 13);

        test.done();
    },
    'should create a new watch2 extension and add to existing watch2 app build phase and dependency': function (test) {
        var watchApp = proj.addTarget('TestWatchApp', 'watch2_app');

        var nativeTargets = proj.pbxNativeTargetSection();

        test.equal(nativeTargets[watchApp.uuid].buildPhases.length, 0);
        test.equal(nativeTargets[watchApp.uuid].dependencies.length, 0);

        proj.addTarget(TARGET_NAME, TARGET_TYPE);

        test.equal(nativeTargets[watchApp.uuid].buildPhases.length, 1);
        test.equal(nativeTargets[watchApp.uuid].dependencies.length, 1);

        test.done();
    },
    'should not modify watch2 target unless adding watch2 extension': function (test) {
        var watchApp = proj.addTarget('TestWatchApp', 'watch2_app');

        var nativeTargets = proj.pbxNativeTargetSection();

        test.equal(nativeTargets[watchApp.uuid].buildPhases.length, 0);
        test.equal(nativeTargets[watchApp.uuid].dependencies.length, 0);

        proj.addTarget(TARGET_NAME, "app_extension");

        test.equal(nativeTargets[watchApp.uuid].buildPhases.length, 0);
        test.equal(nativeTargets[watchApp.uuid].dependencies.length, 0);

        proj.addTarget(TARGET_NAME, "watch_extension");

        test.equal(nativeTargets[watchApp.uuid].buildPhases.length, 0);
        test.equal(nativeTargets[watchApp.uuid].dependencies.length, 0);

        test.done();
    },
    'should create a new watch2 extension with appropriate target extension': function (test) {
        proj.addTarget('TestWatchApp', 'watch2_app');
        var target = proj.addTarget(TARGET_NAME, TARGET_TYPE);

        var buildPhase = proj.buildPhaseObject('PBXCopyFilesBuildPhase', 'Embed App Extensions', target.uuid)

        var buildPhaseFile = buildPhase.files[0];
        test.ok(buildPhaseFile.value);
        var buildPhaseFileSection = proj.pbxBuildFileSection()[buildPhaseFile.value];
        test.ok(buildPhaseFileSection);
        test.ok(buildPhaseFileSection.fileRef);

        var buildPhaseFileRef = proj.pbxFileReferenceSection()[buildPhaseFileSection.fileRef];
        test.ok(buildPhaseFileRef);
        test.ok(buildPhaseFileRef.name);
        test.ok(buildPhaseFileRef.path);

        var quotedTargetPath = "\"" + TARGET_NAME + ".appex\"";
        test.equal(buildPhaseFileRef.name, quotedTargetPath);
        test.equal(buildPhaseFileRef.path, quotedTargetPath);

        test.done();
    }
}
