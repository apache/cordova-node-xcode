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
    'test/parser/projects/header-search.pbxproj',
    'utf-8'
);
const grammar = fs.readFileSync('lib/parser/pbxproj.pegjs', 'utf-8');
const parser = PEG.generate(grammar);
const rawProj = parser.parse(pbx);
const project = rawProj.project;

exports['should read a decimal value correctly'] = function (test) {
    const debug =
            project.objects['XCBuildConfiguration'][
                'C01FCF4F08A954540054247B'
            ];
    const hsPaths = debug.buildSettings['HEADER_SEARCH_PATHS'];
    const expected = '"\\"$(TARGET_BUILD_DIR)/usr/local/lib/include\\""';

    test.equal(hsPaths[0], expected);
    test.done();
};
