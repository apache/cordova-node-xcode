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

var PEG = require('pegjs');

var fs = require('fs');
var pbx = fs.readFileSync('test/parser/projects/two-sections.pbxproj', 'utf-8');
var grammar = fs.readFileSync('lib/parser/pbxproj.pegjs', 'utf-8');
var parser = PEG.generate(grammar);
var rawProj = parser.parse(pbx);
var project = rawProj.project;

exports['should parse a project with two sections'] = function (test) {
    // if it gets this far it's worked
    test.done();
}

exports['should have both sections on the project object'] = function (test) {
    test.ok(project.objects['PBXTargetDependency']);
    test.ok(project.objects['PBXSourcesBuildPhase']);
    test.done();
}
