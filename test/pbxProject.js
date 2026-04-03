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

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert');

const pbx = require('../lib/pbxProject');
const buildConfig = require('./fixtures/buildFiles');
const jsonProject = require('./fixtures/full-project');
const fs = require('fs');
let project;

describe('pbxProject', () => {
    describe('creation', () => {
        it('should create a pbxProject with the new operator', () => {
            const myProj = new pbx('test/parser/projects/hash.pbxproj');

            assert.ok(myProj instanceof pbx);
        });

        it('should create a pbxProject without the new operator', () => {
            const myProj = pbx('test/parser/projects/hash.pbxproj');

            assert.ok(myProj instanceof pbx);
        });
    });

    describe('parseSync function', () => {
        it('should return the hash object', () => {
            const myProj = new pbx('test/parser/projects/hash.pbxproj');
            const projHash = myProj.parseSync();
            assert.ok(projHash);
        });
        it('should contain valid data in the returned objects hash', () => {
            const myProj = new pbx('test/parser/projects/hash.pbxproj');
            const projHash = myProj.parseSync();
            assert.ok(projHash);

            assert.equal(projHash.hash.project.archiveVersion, 1);
            assert.equal(projHash.hash.project.objectVersion, 45);
            assert.equal(projHash.hash.project.nonObject, '29B97313FDCFA39411CA2CEF');
        });
    });

    describe('parse function', () => {
        it('should emit an "end" event', () => {
            const myProj = new pbx('test/parser/projects/hash.pbxproj');

            myProj.parse().on('end', function (err, projHash) {
            });
        });
        it('should take the end callback as a parameter', () => {
            const myProj = new pbx('test/parser/projects/hash.pbxproj');

            myProj.parse(function (err, projHash) {
            });
        });
        it('should allow evented error handling', () => {
            const myProj = new pbx('NotARealPath.pbxproj');

            myProj.parse().on('error', function (err) {
                assert.equal(typeof err, 'object');
            });
        });
        it('should pass the hash object to the callback function', () => {
            const myProj = new pbx('test/parser/projects/hash.pbxproj');

            myProj.parse(function (err, projHash) {
                assert.ok(projHash);
            });
        });
        it('should handle projects with comments in the header', () => {
            const myProj = new pbx('test/parser/projects/comments.pbxproj');

            myProj.parse(function (err, projHash) {
                assert.ok(projHash);
            });
        });
        it('should attach the hash object to the pbx object', () => {
            const myProj = new pbx('test/parser/projects/hash.pbxproj');

            myProj.parse(function (err, projHash) {
                assert.ok(myProj.hash);
            });
        });
        it('it should pass an error object back when the parsing fails', () => {
            const myProj = new pbx('test/parser/projects/fail.pbxproj');

            myProj.parse(function (err, projHash) {
                assert.ok(err);
            });
        });
    });

    describe('allUuids function', () => {
        it('should return the right amount of uuids', () => {
            const project = new pbx('.');
            let uuids;

            project.hash = buildConfig;
            uuids = project.allUuids();

            assert.equal(uuids.length, 4);
        });
    });

    describe('generateUuid function', () => {
        it('should return a 24 character string', () => {
            const project = new pbx('.');
            let newUUID;

            project.hash = buildConfig;
            newUUID = project.generateUuid();

            assert.equal(newUUID.length, 24);
        });
        it('should be an uppercase hex string', () => {
            const project = new pbx('.');
            const uHex = /^[A-F0-9]{24}$/;
            let newUUID;

            project.hash = buildConfig;
            newUUID = project.generateUuid();

            assert.ok(uHex.test(newUUID));
        });
    });

    const bcpbx = 'test/parser/projects/build-config.pbxproj';
    const original_pbx = fs.readFileSync(bcpbx, 'utf-8');

    describe('updateProductName function', () => {
        afterEach(() => {
            fs.writeFileSync(bcpbx, original_pbx, 'utf-8');
        });
        it('should change the PRODUCT_NAME field in the .pbxproj file', () => {
            const myProj = new pbx('test/parser/projects/build-config.pbxproj');
            myProj.parse(function (err, hash) {
                myProj.updateProductName('furious anger');
                const newContents = myProj.writeSync();
                assert.ok(newContents.match(/PRODUCT_NAME\s*=\s*"furious anger"/));
            });
        });
    });

    describe('updateBuildProperty function', () => {
        afterEach(() => {
            fs.writeFileSync(bcpbx, original_pbx, 'utf-8');
        });
        it('should change build properties in the .pbxproj file', () => {
            const myProj = new pbx('test/parser/projects/build-config.pbxproj');
            myProj.parse(function (err, hash) {
                myProj.updateBuildProperty('TARGETED_DEVICE_FAMILY', '"arm"');
                let newContents = myProj.writeSync();
                assert.ok(newContents.match(/TARGETED_DEVICE_FAMILY\s*=\s*"arm"/));
                myProj.updateBuildProperty('OTHER_LDFLAGS', ['T', 'E', 'S', 'T']);
                newContents = myProj.writeSync();
                assert.ok(newContents.match(/OTHER_LDFLAGS\s*=\s*\(\s*T,\s*E,\s*S,\s*T,\s*\)/));
            });
        });
        it('should change all targets in .pbxproj with multiple targets', () => {
            const myProj = new pbx('test/parser/projects/multitarget.pbxproj');
            myProj.parse(function (err, hash) {
                myProj.updateBuildProperty('PRODUCT_BUNDLE_IDENTIFIER', 'comcompanytest');
                const newContents = myProj.writeSync();
                // Should be 10 times = 5 targets, debug and release each
                assert.ok(newContents.match(/PRODUCT_BUNDLE_IDENTIFIER\s*=\s*comcompanytest/g).length === 10);
            });
        });
        it('should change only one target in .pbxproj with multiple targets', () => {
            const myProj = new pbx('test/parser/projects/multitarget.pbxproj');
            myProj.parse(function (err, hash) {
                myProj.updateBuildProperty('PRODUCT_BUNDLE_IDENTIFIER', 'comcompanytest', null, 'MultiTargetTest');
                const newContents = myProj.writeSync();
                // should be 2 times = one target debug and release
                assert.ok(newContents.match(/PRODUCT_BUNDLE_IDENTIFIER\s*=\s*comcompanytest/g).length === 2);
            });
        });
    });

    describe('getBuildProperty function', () => {
        afterEach(() => {
            fs.writeFileSync(bcpbx, original_pbx, 'utf-8');
        });
        it('should change all targets in .pbxproj with multiple targets', () => {
            const myProj = new pbx('test/parser/projects/multitarget.pbxproj');
            myProj.parse(function (err, hash) {
                myProj.updateBuildProperty('PRODUCT_BUNDLE_IDENTIFIER', 'comcompanytest');
                myProj.writeSync();
                assert.ok(myProj.getBuildProperty('PRODUCT_BUNDLE_IDENTIFIER') === 'comcompanytest');
            });
        });
        it('should change only one target in .pbxproj with multiple targets', () => {
            const myProj = new pbx('test/parser/projects/multitarget.pbxproj');
            myProj.parse(function (err, hash) {
                myProj.updateBuildProperty('PRODUCT_BUNDLE_IDENTIFIER', 'comcompanytest', null, 'MultiTargetTest');
                myProj.writeSync();
                assert.ok(myProj.getBuildProperty('PRODUCT_BUNDLE_IDENTIFIER', undefined, 'MultiTargetTest') === 'comcompanytest');
            });
        });
    });

    describe('addBuildProperty function', () => {
        afterEach(() => {
            fs.writeFileSync(bcpbx, original_pbx, 'utf-8');
        });
        it('should add 4 build properties in the .pbxproj file', () => {
            const myProj = new pbx('test/parser/projects/build-config.pbxproj');
            myProj.parse(function (err, hash) {
                myProj.addBuildProperty('ENABLE_BITCODE', 'NO');
                const newContents = myProj.writeSync();
                assert.equal(newContents.match(/ENABLE_BITCODE\s*=\s*NO/g).length, 4);
            });
        });
        it('should add 2 build properties in the .pbxproj file for specific build', () => {
            const myProj = new pbx('test/parser/projects/build-config.pbxproj');
            myProj.parse(function (err, hash) {
                myProj.addBuildProperty('ENABLE_BITCODE', 'NO', 'Release');
                const newContents = myProj.writeSync();
                assert.equal(newContents.match(/ENABLE_BITCODE\s*=\s*NO/g).length, 2);
            });
        });
        it('should not add build properties in the .pbxproj file for nonexist build', () => {
            const myProj = new pbx('test/parser/projects/build-config.pbxproj');
            myProj.parse(function (err, hash) {
                myProj.addBuildProperty('ENABLE_BITCODE', 'NO', 'nonexist');
                const newContents = myProj.writeSync();
                assert.ok(!newContents.match(/ENABLE_BITCODE\s*=\s*NO/g));
            });
        });
    });

    describe('removeBuildProperty function', () => {
        afterEach(() => {
            fs.writeFileSync(bcpbx, original_pbx, 'utf-8');
        });
        it('should remove all build properties in the .pbxproj file', () => {
            const myProj = new pbx('test/parser/projects/build-config.pbxproj');
            myProj.parse(function (err, hash) {
                myProj.removeBuildProperty('IPHONEOS_DEPLOYMENT_TARGET');
                const newContents = myProj.writeSync();
                assert.ok(!newContents.match(/IPHONEOS_DEPLOYMENT_TARGET/));
            });
        });
        it('should remove specific build properties in the .pbxproj file', () => {
            const myProj = new pbx('test/parser/projects/build-config.pbxproj');
            myProj.parse(function (err, hash) {
                myProj.removeBuildProperty('IPHONEOS_DEPLOYMENT_TARGET', 'Debug');
                const newContents = myProj.writeSync();
                assert.equal(newContents.match(/IPHONEOS_DEPLOYMENT_TARGET/g).length, 2);
            });
        });
        it('should not remove any build properties in the .pbxproj file', () => {
            const myProj = new pbx('test/parser/projects/build-config.pbxproj');
            myProj.parse(function (err, hash) {
                myProj.removeBuildProperty('IPHONEOS_DEPLOYMENT_TARGET', 'notexist');
                const newContents = myProj.writeSync();
                assert.equal(newContents.match(/IPHONEOS_DEPLOYMENT_TARGET/g).length, 4);
            });
        });
        it('should fine with remove inexist build properties in the .pbxproj file', () => {
            const myProj = new pbx('test/parser/projects/build-config.pbxproj');
            myProj.parse(function (err, hash) {
                myProj.removeBuildProperty('ENABLE_BITCODE');
                const newContents = myProj.writeSync();
                assert.ok(!newContents.match(/ENABLE_BITCODE/));
            });
        });
    });

    describe('productName field', () => {
        it('should return the product name', () => {
            const newProj = new pbx('.');
            newProj.hash = jsonProject;

            assert.equal(newProj.productName, 'KitchenSinktablet');
        });
    });

    describe('addPluginFile function', () => {
        it('should strip the Plugin path prefix', () => {
            const myProj = new pbx('test/parser/projects/full.pbxproj');

            myProj.parse(function (err, hash) {
                assert.equal(myProj.addPluginFile('Plugins/testMac.m').path, 'testMac.m');
                assert.equal(myProj.addPluginFile('Plugins\\testWin.m').path, 'testWin.m');
            });
        });
        it('should add files to the .pbxproj file using the / path seperator', () => {
            const myProj = new pbx('test/parser/projects/full.pbxproj');

            myProj.parse(function (err, hash) {
                const file = myProj.addPluginFile('myPlugin\\newFile.m');

                assert.equal(myProj.pbxFileReferenceSection()[file.fileRef].path, '"myPlugin/newFile.m"');
            });
        });
    });

    describe('hasFile', () => {
        it('should return true if the file is in the project', () => {
            const newProj = new pbx('.');
            newProj.hash = jsonProject;

            //  sourceTree: '"<group>"'
            assert.ok(newProj.hasFile('AppDelegate.m'));
        });

        it('should return false if the file is not in the project', () => {
            const newProj = new pbx('.');
            newProj.hash = jsonProject;

            //  sourceTree: '"<group>"'
            assert.ok(!newProj.hasFile('NotTheAppDelegate.m'));
        });
    });
});
