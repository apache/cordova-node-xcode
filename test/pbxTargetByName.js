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

exports.pbxTargetByName = {
    'should return PBXNativeTarget': function (test) {
        var pbxTarget = proj.pbxTargetByName('KitchenSinktablet');

        test.ok(pbxTarget);
        test.equals(pbxTarget.isa, 'PBXNativeTarget');
        test.done()
    },
    'should return null when PBXNativeTarget not found': function (test) {
        var pbxTarget = proj.pbxTargetByName('Invalid');

        test.equal(pbxTarget, null);
        test.done()
    }
}
