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
const proj = new pbx('.');

function cleanHash () {
    return JSON.parse(fullProjectStr);
}

exports.setUp = function (callback) {
    proj.hash = cleanHash();
    callback();
};

exports.addTargetDependency = {
    'should return undefined when no target specified': function (test) {
        const buildPhase = proj.addTargetDependency();

        test.ok(typeof buildPhase === 'undefined');
        test.done();
    },
    'should throw when target not found in nativeTargetsSection': function (
        test
    ) {
        test.throws(function () {
            proj.addTargetDependency('invalidTarget');
        });
        test.done();
    },
    'should throw when any dependency target not found in nativeTargetsSection': function (
        test
    ) {
        test.throws(function () {
            proj.addTargetDependency('1D6058900D05DD3D006BFB54', [
                'invalidTarget'
            ]);
        });
        test.done();
    },
    'should return the pbxTarget': function (test) {
        const target = proj.addTargetDependency('1D6058900D05DD3D006BFB54', [
            '1D6058900D05DD3D006BFB54'
        ]);

        test.ok(typeof target == 'object');
        test.ok(target.uuid);
        test.ok(target.target);
        test.done();
    },
    'should add targetDependencies to target': function (test) {
        const targetInPbxProj = proj.pbxNativeTargetSection()[
            '1D6058900D05DD3D006BFB55'
        ];
        test.deepEqual(targetInPbxProj.dependencies, []);

        const target = proj.addTargetDependency('1D6058900D05DD3D006BFB55', [
            '1D6058900D05DD3D006BFB54',
            '1D6058900D05DD3D006BFB55'
        ]).target;
        test.deepEqual(targetInPbxProj.dependencies, target.dependencies);
        test.done();
    },
    'should create a PBXTargetDependency for each dependency target': function (
        test
    ) {
        const pbxTargetDependencySection =
                proj.hash.project.objects['PBXTargetDependency'];
        const target = proj.addTargetDependency('1D6058900D05DD3D006BFB54', [
            '1D6058900D05DD3D006BFB54',
            '1D6058900D05DD3D006BFB55'
        ]).target;

        for (let index = 0; index < target.dependencies.length; index++) {
            const dependency = target.dependencies[index].value;
            test.ok(pbxTargetDependencySection[dependency]);
        }

        test.done();
    },
    'should set right comment for each dependency target': function (test) {
        const pbxTargetDependencySection =
                proj.hash.project.objects['PBXTargetDependency'];
        const target = proj.addTargetDependency('1D6058900D05DD3D006BFB54', [
            '1D6058900D05DD3D006BFB54',
            '1D6058900D05DD3D006BFB55'
        ]).target;

        for (let index = 0; index < target.dependencies.length; index++) {
            const dependencyCommentKey =
                target.dependencies[index].value + '_comment';
            test.equal(
                pbxTargetDependencySection[dependencyCommentKey],
                'PBXTargetDependency'
            );
        }

        test.done();
    },
    'should create a PBXContainerItemProxy for each PBXTargetDependency': function (
        test
    ) {
        const pbxTargetDependencySection =
                proj.hash.project.objects['PBXTargetDependency'];
        const pbxContainerItemProxySection =
                proj.hash.project.objects['PBXContainerItemProxy'];
        const target = proj.addTargetDependency('1D6058900D05DD3D006BFB54', [
            '1D6058900D05DD3D006BFB54',
            '1D6058900D05DD3D006BFB55'
        ]).target;

        for (let index = 0; index < target.dependencies.length; index++) {
            const dependency = target.dependencies[index].value;
            const targetProxy =
                    pbxTargetDependencySection[dependency]['targetProxy'];

            test.ok(pbxContainerItemProxySection[targetProxy]);
        }

        test.done();
    },
    'should set each PBXContainerItemProxy`s remoteGlobalIDString correctly': function (
        test
    ) {
        const pbxTargetDependencySection =
                proj.hash.project.objects['PBXTargetDependency'];
        const pbxContainerItemProxySection =
                proj.hash.project.objects['PBXContainerItemProxy'];
        const target = proj.addTargetDependency('1D6058900D05DD3D006BFB55', [
            '1D6058900D05DD3D006BFB54',
            '1D6058900D05DD3D006BFB55'
        ]).target;
        const remoteGlobalIDStrings = [];

        for (let index = 0; index < target.dependencies.length; index++) {
            const dependency = target.dependencies[index].value;
            const targetProxy =
                    pbxTargetDependencySection[dependency]['targetProxy'];

            remoteGlobalIDStrings.push(
                pbxContainerItemProxySection[targetProxy][
                    'remoteGlobalIDString'
                ]
            );
        }

        test.deepEqual(remoteGlobalIDStrings, [
            '1D6058900D05DD3D006BFB54',
            '1D6058900D05DD3D006BFB55'
        ]);
        test.done();
    },
    'should set each PBXContainerItemProxy`s remoteInfo correctly': function (
        test
    ) {
        const pbxTargetDependencySection =
                proj.hash.project.objects['PBXTargetDependency'];
        const pbxContainerItemProxySection =
                proj.hash.project.objects['PBXContainerItemProxy'];
        const target = proj.addTargetDependency('1D6058900D05DD3D006BFB55', [
            '1D6058900D05DD3D006BFB54',
            '1D6058900D05DD3D006BFB55'
        ]).target;
        const remoteInfoArray = [];

        for (let index = 0; index < target.dependencies.length; index++) {
            const dependency = target.dependencies[index].value;
            const targetProxy =
                    pbxTargetDependencySection[dependency]['targetProxy'];

            remoteInfoArray.push(
                pbxContainerItemProxySection[targetProxy]['remoteInfo']
            );
        }

        test.deepEqual(remoteInfoArray, ['"KitchenSinktablet"', '"TestApp"']);
        test.done();
    },
    'should set each PBXContainerItemProxy`s containerPortal correctly': function (
        test
    ) {
        const pbxTargetDependencySection =
                proj.hash.project.objects['PBXTargetDependency'];
        const pbxContainerItemProxySection =
                proj.hash.project.objects['PBXContainerItemProxy'];
        const target = proj.addTargetDependency('1D6058900D05DD3D006BFB55', [
            '1D6058900D05DD3D006BFB54',
            '1D6058900D05DD3D006BFB55'
        ]).target;

        for (let index = 0; index < target.dependencies.length; index++) {
            const dependency = target.dependencies[index].value;
            const targetProxy =
                    pbxTargetDependencySection[dependency]['targetProxy'];

            test.equal(
                pbxContainerItemProxySection[targetProxy]['containerPortal'],
                proj.hash.project['rootObject']
            );
        }

        test.done();
    },
    'should set each PBXContainerItemProxy`s proxyType correctly': function (
        test
    ) {
        const pbxTargetDependencySection =
                proj.hash.project.objects['PBXTargetDependency'];
        const pbxContainerItemProxySection =
                proj.hash.project.objects['PBXContainerItemProxy'];
        const target = proj.addTargetDependency('1D6058900D05DD3D006BFB55', [
            '1D6058900D05DD3D006BFB54',
            '1D6058900D05DD3D006BFB55'
        ]).target;

        for (let index = 0; index < target.dependencies.length; index++) {
            const dependency = target.dependencies[index].value;
            const targetProxy =
                    pbxTargetDependencySection[dependency]['targetProxy'];

            test.equal(
                pbxContainerItemProxySection[targetProxy]['proxyType'],
                1
            );
        }

        test.done();
    }
};
