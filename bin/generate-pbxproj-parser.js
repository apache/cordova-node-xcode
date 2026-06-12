/*
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

const fs = require('node:fs');
const path = require('node:path');
const peg = require('pegjs');

const ROOT_DIR = path.join(__dirname, '..');
const parserDir = path.join(ROOT_DIR, 'lib/parser');

// Path to grammar file
const grammarFilePath = path.join(parserDir, 'pbxproj.pegjs');
// Path to where the parser file is outputted
const outputFilePath = path.join(parserDir, 'pbxproj.js');

// Fetches the grammar file content and builds the output data.
const grammarData = fs.readFileSync(grammarFilePath, 'utf8');
const outputData = peg.generate(grammarData, {
    output: 'source',
    format: 'commonjs'
});

const asfLicenseHeader = `/*
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
`;

// Append the Apache license header to the top of the built file.
fs.writeFileSync(outputFilePath, `${asfLicenseHeader}${outputData}`);
