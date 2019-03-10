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

const PEG = require('pegjs');
const fs = require('fs');
const pbx = fs.readFileSync(
    'test/parser/projects/build-config.pbxproj',
    'utf-8'
);
const grammar = fs.readFileSync('lib/parser/pbxproj.pegjs', 'utf-8');
const parser = PEG.generate(grammar);
const rawProj = parser.parse(pbx);
const util = require('util');
const project = rawProj.project;

exports['should parse the build config section'] = function (test) {
    // if it gets this far it's worked
    test.done();
};

exports['should read a decimal value correctly'] = function (test) {
    const xcbConfig = project.objects['XCBuildConfiguration'];
    const debugSettings = xcbConfig['1D6058950D05DD3E006BFB54'].buildSettings;

    test.strictEqual(debugSettings['IPHONEOS_DEPLOYMENT_TARGET'], '3.0');
    test.done();
};

exports['should read an escaped value correctly'] = function (test) {
    const xcbConfig = project.objects['XCBuildConfiguration'];
    const debugSettings = xcbConfig['C01FCF4F08A954540054247B'].buildSettings;
    const expt =
            '"\\"$(PHONEGAPLIB)/Classes/JSON\\" \\"$(PHONEGAPLIB)/Classes\\""';

    test.strictEqual(debugSettings['USER_HEADER_SEARCH_PATHS'], expt);
    test.done();
};
