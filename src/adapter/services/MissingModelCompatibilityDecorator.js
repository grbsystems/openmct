/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define([
    '../../api/objects/object-utils'
], function (
    objectUtils
) {

    function MissingModelCompatibilityDecorator(api, modelService) {
        this.api = api;
        this.modelService = modelService;
        this.apiFetching = {}; // to prevent loops, if we have already
    }

    MissingModelCompatibilityDecorator.prototype.apiFetch = function (ids) {
        var results = {},
            promises = ids.map(function (id) {
                if (this.apiFetching[id]) {
                    return Promise.resolve();
                }
                this.apiFetching[id] = true;

                return this.api.objects.get(objectUtils.parseKeyString(id))
                    .then(function (newDO) {
                        results[id] = objectUtils.toOldFormat(newDO);
                    });
            }, this);

        return Promise.all(promises).then(function () {
                return results;
            });
    };

    MissingModelCompatibilityDecorator.prototype.getModels = function (ids) {
        return this.modelService.getModels(ids)
            .then(function (models) {
                var missingIds = ids.filter(function (id) {
                        return !models[id];
                    });

                if (!missingIds.length) {
                    return models;
                }

                return this.apiFetch(missingIds)
                    .then(function (apiResults) {
                        Object.keys(apiResults).forEach(function (k) {
                            models[k] = apiResults[k];
                        });
                        return models;
                    });
            }.bind(this));
    };

    return MissingModelCompatibilityDecorator;
});

