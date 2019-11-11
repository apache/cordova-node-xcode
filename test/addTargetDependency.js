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

exports.addTargetDependency = {
    'should return undefined when no target specified': function (test) {
        var buildPhase = proj.addTargetDependency();

        test.ok(typeof buildPhase === 'undefined');
        test.done()
    },
    'should throw when target not found in nativeTargetsSection': function (test) {
        test.throws(function() {
            proj.addTargetDependency('invalidTarget');
        }, function (error) {
            return (error instanceof Error) && /Invalid target/i.test(error);
        });
        test.done()
    },
    'should throw when any dependency target not found in nativeTargetsSection': function (test) {
        test.throws(function() {
            proj.addTargetDependency('1D6058900D05DD3D006BFB54', ['invalidTarget']);
        }, function (error) {
            return (error instanceof Error) && /Invalid target/i.test(error);
        });
        test.done()
    },
    'should return the pbxTarget': function (test) {
        var target = proj.addTargetDependency('1D6058900D05DD3D006BFB54', ['1D6058900D05DD3D006BFB54']);

        test.ok(typeof target == 'object');
        test.ok(target.uuid);
        test.ok(target.target);
        test.done();
    },
    'should add targetDependencies to target': function (test) {
        var targetInPbxProj = proj.pbxNativeTargetSection()['1D6058900D05DD3D006BFB55'];
        test.deepEqual(targetInPbxProj.dependencies, []);

        var target = proj.addTargetDependency('1D6058900D05DD3D006BFB55', ['1D6058900D05DD3D006BFB54', '1D6058900D05DD3D006BFB55']).target;
        test.deepEqual(targetInPbxProj.dependencies, target.dependencies)
        test.done()
    },
    'should not modify native target dependencies if PBXTargetDependency object does not exist': function (test) {
        delete proj.hash.project.objects['PBXTargetDependency'];

        var numDependenciesBefore = proj.pbxNativeTargetSection()['1D6058900D05DD3D006BFB54'].dependencies.length;
        proj.addTargetDependency('1D6058900D05DD3D006BFB54', ['1D6058900D05DD3D006BFB54']);
        var numDependenciesAfter = proj.pbxNativeTargetSection()['1D6058900D05DD3D006BFB54'].dependencies.length;

        test.equal(numDependenciesBefore, numDependenciesAfter);

        test.done();
    },
    'should not modify native target dependencies if PBXContainerItemProxy object does not exist': function (test) {
        delete proj.hash.project.objects['PBXContainerItemProxy'];

        var numDependenciesBefore = proj.pbxNativeTargetSection()['1D6058900D05DD3D006BFB54'].dependencies.length;
        proj.addTargetDependency('1D6058900D05DD3D006BFB54', ['1D6058900D05DD3D006BFB54']);
        var numDependenciesAfter = proj.pbxNativeTargetSection()['1D6058900D05DD3D006BFB54'].dependencies.length;

        test.equal(numDependenciesBefore, numDependenciesAfter);

        test.done();
    },
    'should create a PBXTargetDependency for each dependency target': function (test) {
        var pbxTargetDependencySection = proj.hash.project.objects['PBXTargetDependency'],
            target = proj.addTargetDependency('1D6058900D05DD3D006BFB54', ['1D6058900D05DD3D006BFB54', '1D6058900D05DD3D006BFB55']).target;

        for (var index = 0; index < target.dependencies.length; index++) {
            var dependency = target.dependencies[index].value;
            test.ok(pbxTargetDependencySection[dependency]);
        }

        test.done()
    },
    'should set right comment for each target dependency': function (test) {
        var pbxTargetDependencySection = proj.hash.project.objects['PBXTargetDependency'],
            target = proj.addTargetDependency('1D6058900D05DD3D006BFB54', ['1D6058900D05DD3D006BFB54', '1D6058900D05DD3D006BFB55']).target;

        for (var index = 0; index < target.dependencies.length; index++) {
            var dependencyCommentKey = target.dependencies[index].value + '_comment';
            test.equal(pbxTargetDependencySection[dependencyCommentKey], 'PBXTargetDependency');
        }

        test.done()
    },
    'should set right comment for each dependency target': function (test) {
        var pbxTargetDependencySection = proj.hash.project.objects['PBXTargetDependency'],
            target = proj.addTargetDependency('1D6058900D05DD3D006BFB54', ['1D6058900D05DD3D006BFB54', '1D6058900D05DD3D006BFB55']).target;

        for (var index = 0; index < target.dependencies.length; index++) {
            var dependencyTargetUuid = target.dependencies[index].value;
            var targetDependencyUuid = pbxTargetDependencySection[dependencyTargetUuid].target;

            if (pbxTargetDependencySection[dependencyTargetUuid].target) {
                var targetCommentKey = targetDependencyUuid + '_comment';
                test.equal(pbxTargetDependencySection[dependencyTargetUuid].target_comment, proj.pbxNativeTargetSection()[targetCommentKey]);
            }
        }

        test.done();
    },
    'should create a PBXContainerItemProxy for each PBXTargetDependency': function (test) {
        var pbxTargetDependencySection = proj.hash.project.objects['PBXTargetDependency'],
            pbxContainerItemProxySection = proj.hash.project.objects['PBXContainerItemProxy'],
            target = proj.addTargetDependency('1D6058900D05DD3D006BFB54', ['1D6058900D05DD3D006BFB54', '1D6058900D05DD3D006BFB55']).target;

        for (var index = 0; index < target.dependencies.length; index++) {
            var dependency = target.dependencies[index].value,
                targetProxy = pbxTargetDependencySection[dependency]['targetProxy'];

            test.ok(pbxContainerItemProxySection[targetProxy]);
        }

        test.done()
    },
    'should set right comment for each container item proxy': function (test) {
        var pbxTargetDependencySection = proj.hash.project.objects['PBXTargetDependency'],
            pbxContainerItemProxySection = proj.hash.project.objects['PBXContainerItemProxy'],
            target = proj.addTargetDependency('1D6058900D05DD3D006BFB54', ['1D6058900D05DD3D006BFB54', '1D6058900D05DD3D006BFB55']).target;

        for (var index = 0; index < target.dependencies.length; index++) {
            var dependencyTargetUuid = target.dependencies[index].value;

            var proxyUuid = pbxTargetDependencySection[dependencyTargetUuid].targetProxy;

            if (proxyUuid) {
                test.ok(pbxTargetDependencySection[dependencyTargetUuid].targetProxy_comment, 'PBXContainerItemProxy');
                test.ok(pbxContainerItemProxySection[proxyUuid]);
                var proxyCommentKey = proxyUuid + '_comment';
                test.ok(pbxContainerItemProxySection[proxyCommentKey]);
            }
        }

        test.done();
    },
    'should set each PBXContainerItemProxy`s remoteGlobalIDString correctly': function (test) {
        var pbxTargetDependencySection = proj.hash.project.objects['PBXTargetDependency'],
            pbxContainerItemProxySection = proj.hash.project.objects['PBXContainerItemProxy'],
            target = proj.addTargetDependency('1D6058900D05DD3D006BFB55', ['1D6058900D05DD3D006BFB54', '1D6058900D05DD3D006BFB55']).target,
            remoteGlobalIDStrings = [];

        for (var index = 0; index < target.dependencies.length; index++) {
            var dependency = target.dependencies[index].value,
                targetProxy = pbxTargetDependencySection[dependency]['targetProxy'];

            remoteGlobalIDStrings.push(pbxContainerItemProxySection[targetProxy]['remoteGlobalIDString']);
        }

        test.deepEqual(remoteGlobalIDStrings, ['1D6058900D05DD3D006BFB54', '1D6058900D05DD3D006BFB55']);
        test.done()
    },
    'should set each PBXContainerItemProxy`s remoteInfo correctly': function (test) {
        var pbxTargetDependencySection = proj.hash.project.objects['PBXTargetDependency'],
            pbxContainerItemProxySection = proj.hash.project.objects['PBXContainerItemProxy'],
            target = proj.addTargetDependency('1D6058900D05DD3D006BFB55', ['1D6058900D05DD3D006BFB54', '1D6058900D05DD3D006BFB55']).target,
            remoteInfoArray = [];

        for (var index = 0; index < target.dependencies.length; index++) {
            var dependency = target.dependencies[index].value,
                targetProxy = pbxTargetDependencySection[dependency]['targetProxy'];

            remoteInfoArray.push(pbxContainerItemProxySection[targetProxy]['remoteInfo']);
        }

        test.deepEqual(remoteInfoArray, ['"KitchenSinktablet"', '"TestApp"']);
        test.done()
    },
    'should set each PBXContainerItemProxy`s containerPortal correctly': function (test) {
        var pbxTargetDependencySection = proj.hash.project.objects['PBXTargetDependency'],
            pbxContainerItemProxySection = proj.hash.project.objects['PBXContainerItemProxy'],
            target = proj.addTargetDependency('1D6058900D05DD3D006BFB55', ['1D6058900D05DD3D006BFB54', '1D6058900D05DD3D006BFB55']).target;

        for (var index = 0; index < target.dependencies.length; index++) {
            var dependency = target.dependencies[index].value,
                targetProxy = pbxTargetDependencySection[dependency]['targetProxy'];

            test.equal(pbxContainerItemProxySection[targetProxy]['containerPortal'], proj.hash.project['rootObject']);
        }

        test.done()
    },
    'should set each PBXContainerItemProxy`s containerPortal_comment correctly': function (test) {
        var pbxTargetDependencySection = proj.hash.project.objects['PBXTargetDependency'],
            pbxContainerItemProxySection = proj.hash.project.objects['PBXContainerItemProxy'],
            target = proj.addTargetDependency('1D6058900D05DD3D006BFB55', ['1D6058900D05DD3D006BFB54', '1D6058900D05DD3D006BFB55']).target;

        for (var index = 0; index < target.dependencies.length; index++) {
            var dependency = target.dependencies[index].value,
                targetProxy = pbxTargetDependencySection[dependency]['targetProxy'];

            test.equal(pbxContainerItemProxySection[targetProxy]['containerPortal_comment'], proj.hash.project['rootObject_comment']);
        }

        test.done()
    },
    'should set each PBXContainerItemProxy`s proxyType correctly': function (test) {
        var pbxTargetDependencySection = proj.hash.project.objects['PBXTargetDependency'],
            pbxContainerItemProxySection = proj.hash.project.objects['PBXContainerItemProxy'],
            target = proj.addTargetDependency('1D6058900D05DD3D006BFB55', ['1D6058900D05DD3D006BFB54', '1D6058900D05DD3D006BFB55']).target;

        for (var index = 0; index < target.dependencies.length; index++) {
            var dependency = target.dependencies[index].value,
                targetProxy = pbxTargetDependencySection[dependency]['targetProxy'];

            test.equal(pbxContainerItemProxySection[targetProxy]['proxyType'], 1);
        }

        test.done()
    }
}
