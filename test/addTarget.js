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

const fullProject = require('./fixtures/full-project');
const fullProjectStr = JSON.stringify(fullProject);
const pbx = require('../lib/pbxProject');
const pbxFile = require('../lib/pbxFile');
const proj = new pbx('.');

function cleanHash () {
    return JSON.parse(fullProjectStr);
}

const TARGET_NAME = 'TestExtension';
const TARGET_TYPE = 'app_extension';
const TARGET_SUBFOLDER_NAME = 'TestExtensionFiles';

exports.setUp = function (callback) {
    proj.hash = cleanHash();
    callback();
};

exports.addTarget = {
    'should throw when target name is missing': function (test) {
        test.throws(function () {
            proj.addTarget(null, TARGET_TYPE);
        });

        test.done();
    },
    'should throw when target type missing': function (test) {
        test.throws(function () {
            proj.addTarget(TARGET_NAME, null);
        });

        test.done();
    },
    'should create a new target': function (test) {
        const target = proj.addTarget(
            TARGET_NAME,
            TARGET_TYPE,
            TARGET_SUBFOLDER_NAME
        );

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
    'should create a new target and add source, framework, resource and header files and the corresponding build phases': function (
        test
    ) {
        const target = proj.addTarget(
            TARGET_NAME,
            TARGET_TYPE,
            TARGET_SUBFOLDER_NAME
        );
        const options = { target: target.uuid };

        const sourceFile = proj.addSourceFile('Plugins/file.m', options);
        const sourcePhase = proj.addBuildPhase(
            [],
            'PBXSourcesBuildPhase',
            'Sources',
            target.uuid
        );
        const resourceFile = proj.addResourceFile('assets.bundle', options);
        const resourcePhase = proj.addBuildPhase(
            [],
            'PBXResourcesBuildPhase',
            'Resources',
            target.uuid
        );
        const frameworkFile = proj.addFramework('libsqlite3.dylib', options);
        (frameworkPhase = proj.addBuildPhase(
            [],
            'PBXFrameworkBuildPhase',
            'Frameworks',
            target.uuid
        )),
        (headerFile = proj.addHeaderFile('file.h', options));

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
    }
};
