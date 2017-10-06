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

var PEG = require('pegjs'),
    fs = require('fs'),
    pbx = fs.readFileSync('test/parser/projects/dots-in-names.pbxproj', 'utf-8'),
    grammar = fs.readFileSync('lib/parser/pbxproj.pegjs', 'utf-8'),
    parser = PEG.generate(grammar),
    rawProj = parser.parse(pbx),
    project = rawProj.project;

exports['should parse com.apple.BackgroundModes'] = function (test) {
    var targets = project.attributes.TargetAttributes['1D6058900D05DD3D006BFB54'],
        backgroundModes = targets.SystemCapabilities['com.apple.BackgroundModes'];

    test.deepEqual(backgroundModes, {enabled: 1});
    test.done()
}
