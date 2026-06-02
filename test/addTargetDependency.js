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
const PBXProject = require('../lib/pbxProject');
const proj = new PBXProject('.');

function cleanHash () {
    return JSON.parse(fullProjectStr);
}

describe('addTargetDependency', () => {
    beforeEach(() => {
        proj.hash = cleanHash();
    });
    it('should return undefined when no target specified', () => {
        const buildPhase = proj.addTargetDependency();

        assert.ok(typeof buildPhase === 'undefined');
    });

    it('should throw when target not found in nativeTargetsSection', () => {
        assert.throws(function () {
            proj.addTargetDependency('invalidTarget');
        }, function (error) {
            return (error instanceof Error) && /Invalid target/i.test(error);
        });
    });

    it('should throw when any dependency target not found in nativeTargetsSection', () => {
        assert.throws(function () {
            proj.addTargetDependency('1D6058900D05DD3D006BFB54', ['invalidTarget']);
        }, function (error) {
            return (error instanceof Error) && /Invalid target/i.test(error);
        });
    });

    it('should return the pbxTarget', () => {
        const target = proj.addTargetDependency('1D6058900D05DD3D006BFB54', ['1D6058900D05DD3D006BFB54']);

        assert.ok(typeof target === 'object');
        assert.ok(target.uuid);
        assert.ok(target.target);
    });

    it('should add targetDependencies to target', () => {
        const targetInPbxProj = proj.pbxNativeTargetSection()['1D6058900D05DD3D006BFB55'];
        assert.deepEqual(targetInPbxProj.dependencies, []);

        const target = proj.addTargetDependency('1D6058900D05DD3D006BFB55', ['1D6058900D05DD3D006BFB54', '1D6058900D05DD3D006BFB55']).target;
        assert.deepEqual(targetInPbxProj.dependencies, target.dependencies);
    });

    it('should not modify native target dependencies if PBXTargetDependency object does not exist', () => {
        delete proj.hash.project.objects.PBXTargetDependency;

        const numDependenciesBefore = proj.pbxNativeTargetSection()['1D6058900D05DD3D006BFB54'].dependencies.length;
        proj.addTargetDependency('1D6058900D05DD3D006BFB54', ['1D6058900D05DD3D006BFB54']);
        const numDependenciesAfter = proj.pbxNativeTargetSection()['1D6058900D05DD3D006BFB54'].dependencies.length;

        assert.equal(numDependenciesBefore, numDependenciesAfter);
    });

    it('should not modify native target dependencies if PBXContainerItemProxy object does not exist', () => {
        delete proj.hash.project.objects.PBXContainerItemProxy;

        const numDependenciesBefore = proj.pbxNativeTargetSection()['1D6058900D05DD3D006BFB54'].dependencies.length;
        proj.addTargetDependency('1D6058900D05DD3D006BFB54', ['1D6058900D05DD3D006BFB54']);
        const numDependenciesAfter = proj.pbxNativeTargetSection()['1D6058900D05DD3D006BFB54'].dependencies.length;

        assert.equal(numDependenciesBefore, numDependenciesAfter);
    });

    it('should create a PBXTargetDependency for each dependency target', () => {
        const pbxTargetDependencySection = proj.hash.project.objects.PBXTargetDependency;
        const target = proj.addTargetDependency('1D6058900D05DD3D006BFB54', ['1D6058900D05DD3D006BFB54', '1D6058900D05DD3D006BFB55']).target;

        for (let index = 0; index < target.dependencies.length; index++) {
            const dependency = target.dependencies[index].value;
            assert.ok(pbxTargetDependencySection[dependency]);
        }
    });

    it('should set right comment for each target dependency', () => {
        const pbxTargetDependencySection = proj.hash.project.objects.PBXTargetDependency;
        const target = proj.addTargetDependency('1D6058900D05DD3D006BFB54', ['1D6058900D05DD3D006BFB54', '1D6058900D05DD3D006BFB55']).target;

        for (let index = 0; index < target.dependencies.length; index++) {
            const dependencyCommentKey = target.dependencies[index].value + '_comment';
            assert.equal(pbxTargetDependencySection[dependencyCommentKey], 'PBXTargetDependency');
        }
    });

    it('should set right comment for each dependency target', () => {
        const pbxTargetDependencySection = proj.hash.project.objects.PBXTargetDependency;
        const target = proj.addTargetDependency('1D6058900D05DD3D006BFB54', ['1D6058900D05DD3D006BFB54', '1D6058900D05DD3D006BFB55']).target;

        for (let index = 0; index < target.dependencies.length; index++) {
            const dependencyTargetUuid = target.dependencies[index].value;
            const targetDependencyUuid = pbxTargetDependencySection[dependencyTargetUuid].target;

            if (pbxTargetDependencySection[dependencyTargetUuid].target) {
                const targetCommentKey = targetDependencyUuid + '_comment';
                assert.equal(pbxTargetDependencySection[dependencyTargetUuid].target_comment, proj.pbxNativeTargetSection()[targetCommentKey]);
            }
        }
    });

    it('should create a PBXContainerItemProxy for each PBXTargetDependency', () => {
        const pbxTargetDependencySection = proj.hash.project.objects.PBXTargetDependency;
        const pbxContainerItemProxySection = proj.hash.project.objects.PBXContainerItemProxy;
        const target = proj.addTargetDependency('1D6058900D05DD3D006BFB54', ['1D6058900D05DD3D006BFB54', '1D6058900D05DD3D006BFB55']).target;

        for (let index = 0; index < target.dependencies.length; index++) {
            const dependency = target.dependencies[index].value;
            const targetProxy = pbxTargetDependencySection[dependency].targetProxy;

            assert.ok(pbxContainerItemProxySection[targetProxy]);
        }
    });

    it('should set right comment for each container item proxy', () => {
        const pbxTargetDependencySection = proj.hash.project.objects.PBXTargetDependency;
        const pbxContainerItemProxySection = proj.hash.project.objects.PBXContainerItemProxy;
        const target = proj.addTargetDependency('1D6058900D05DD3D006BFB54', ['1D6058900D05DD3D006BFB54', '1D6058900D05DD3D006BFB55']).target;

        for (let index = 0; index < target.dependencies.length; index++) {
            const dependencyTargetUuid = target.dependencies[index].value;

            const proxyUuid = pbxTargetDependencySection[dependencyTargetUuid].targetProxy;

            if (proxyUuid) {
                assert.ok(pbxTargetDependencySection[dependencyTargetUuid].targetProxy_comment, 'PBXContainerItemProxy');
                assert.ok(pbxContainerItemProxySection[proxyUuid]);
                const proxyCommentKey = proxyUuid + '_comment';
                assert.ok(pbxContainerItemProxySection[proxyCommentKey]);
            }
        }
    });

    it('should set each PBXContainerItemProxy`s remoteGlobalIDString correctly', () => {
        const pbxTargetDependencySection = proj.hash.project.objects.PBXTargetDependency;
        const pbxContainerItemProxySection = proj.hash.project.objects.PBXContainerItemProxy;
        const target = proj.addTargetDependency('1D6058900D05DD3D006BFB55', ['1D6058900D05DD3D006BFB54', '1D6058900D05DD3D006BFB55']).target;
        const remoteGlobalIDStrings = [];

        for (let index = 0; index < target.dependencies.length; index++) {
            const dependency = target.dependencies[index].value;
            const targetProxy = pbxTargetDependencySection[dependency].targetProxy;

            remoteGlobalIDStrings.push(pbxContainerItemProxySection[targetProxy].remoteGlobalIDString);
        }

        assert.deepEqual(remoteGlobalIDStrings, ['1D6058900D05DD3D006BFB54', '1D6058900D05DD3D006BFB55']);
    });

    it('should set each PBXContainerItemProxy`s remoteInfo correctly', () => {
        const pbxTargetDependencySection = proj.hash.project.objects.PBXTargetDependency;
        const pbxContainerItemProxySection = proj.hash.project.objects.PBXContainerItemProxy;
        const target = proj.addTargetDependency('1D6058900D05DD3D006BFB55', ['1D6058900D05DD3D006BFB54', '1D6058900D05DD3D006BFB55']).target;
        const remoteInfoArray = [];

        for (let index = 0; index < target.dependencies.length; index++) {
            const dependency = target.dependencies[index].value;
            const targetProxy = pbxTargetDependencySection[dependency].targetProxy;

            remoteInfoArray.push(pbxContainerItemProxySection[targetProxy].remoteInfo);
        }

        assert.deepEqual(remoteInfoArray, ['"KitchenSinktablet"', '"TestApp"']);
    });

    it('should set each PBXContainerItemProxy`s containerPortal correctly', () => {
        const pbxTargetDependencySection = proj.hash.project.objects.PBXTargetDependency;
        const pbxContainerItemProxySection = proj.hash.project.objects.PBXContainerItemProxy;
        const target = proj.addTargetDependency('1D6058900D05DD3D006BFB55', ['1D6058900D05DD3D006BFB54', '1D6058900D05DD3D006BFB55']).target;

        for (let index = 0; index < target.dependencies.length; index++) {
            const dependency = target.dependencies[index].value;
            const targetProxy = pbxTargetDependencySection[dependency].targetProxy;

            assert.equal(pbxContainerItemProxySection[targetProxy].containerPortal, proj.hash.project.rootObject);
        }
    });

    it('should set each PBXContainerItemProxy`s containerPortal_comment correctly', () => {
        const pbxTargetDependencySection = proj.hash.project.objects.PBXTargetDependency;
        const pbxContainerItemProxySection = proj.hash.project.objects.PBXContainerItemProxy;
        const target = proj.addTargetDependency('1D6058900D05DD3D006BFB55', ['1D6058900D05DD3D006BFB54', '1D6058900D05DD3D006BFB55']).target;

        for (let index = 0; index < target.dependencies.length; index++) {
            const dependency = target.dependencies[index].value;
            const targetProxy = pbxTargetDependencySection[dependency].targetProxy;

            assert.equal(pbxContainerItemProxySection[targetProxy].containerPortal_comment, proj.hash.project.rootObject_comment);
        }
    });

    it('should set each PBXContainerItemProxy`s proxyType correctly', () => {
        const pbxTargetDependencySection = proj.hash.project.objects.PBXTargetDependency;
        const pbxContainerItemProxySection = proj.hash.project.objects.PBXContainerItemProxy;
        const target = proj.addTargetDependency('1D6058900D05DD3D006BFB55', ['1D6058900D05DD3D006BFB54', '1D6058900D05DD3D006BFB55']).target;

        for (let index = 0; index < target.dependencies.length; index++) {
            const dependency = target.dependencies[index].value;
            const targetProxy = pbxTargetDependencySection[dependency].targetProxy;

            assert.equal(pbxContainerItemProxySection[targetProxy].proxyType, 1);
        }
    });
});
