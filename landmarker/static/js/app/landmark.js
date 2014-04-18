define(['backbone', 'three'], function(Backbone, THREE) {

    "use strict";

    var Landmark = Backbone.Model.extend({

        defaults: function () {
            return {
                point: null,
                selected: false,
                index: 0
            }
        },

        point: function() {
            return this.get('point');
        },

        select: function () {
            return this.set('selected', true);
        },

        deselect: function () {
            return this.set('selected', false);
        },

        isSelected: function () {
            return this.get('selected');
        },

//        validate: function(attrs, options) {
//            var x  = 1;
//            console.log(attrs);
//            if (attrs.hasOwnProperty('point') &&
//                attrs.point !== null &&
//                !(attrs.point instanceof THREE.Vector3)) {
//                return "didn't pass a valid point";
//            }
//        },

        isEmpty: function () {
            return !this.has('point');
        },

        clear: function() {
            this.set({
                point: null,
                selected: false
            });
        },

        toJSON: function () {
            var pointJSON = [null, null, null];
            var point;
            if (!this.isEmpty()) {
                point = this.point();
                pointJSON = [point.x, point.y, point.z];
            }
            return {
                point: pointJSON
            }
        }

    });

    var LandmarkList = Backbone.Collection.extend({

        t_mesh: Landmark,

        comparator: 'index',

        initEmpty: function (n) {
            var landmarks = [];
            var landmark;
            for (var i = 0; i < n; i++) {
                landmark = new Landmark;
                landmark.set('index', i);
                landmarks.push(landmark);
            }
            this.reset(landmarks);
        },

        selected: function () {
            return this.where({selected: true});
        },

        empty: function () {
            return this.filter(function(landmark) {
                return landmark.isEmpty();
            });
        },

        nonempty: function () {
            return this.filter(function(landmark) {
                return !landmark.isEmpty();
            });
        },

        nSelected: function () {
            return this.selected().length;
        },

        selectAll: function () {
            this.forEach(function(landmark) {
                landmark.select();
            });
        },

        deselectAll: function () {
            this.forEach(function(landmark) {
                landmark.deselect();
            });
        }

    });

    var LandmarkGroup = Backbone.Model.extend({

        defaults : function () {
            return {
                landmarks: new LandmarkList,
                label: 'group_label',
                active: false
            };
        },

        makeActive: function () {
            this.collection.deactivateAll();
            this.set('active', true);
        },

        label: function () {
            return this.get('label');
        },

        landmarks: function () {
            return this.get('landmarks');
        },

        initEmpty: function (label, n) {
            this.set('label', label);
            this.landmarks().initEmpty(n);
        },

        toJSON: function () {
            return {
                landmarks: this.landmarks()
            };
        }

    });

    var LandmarkGroupList = Backbone.Collection.extend({

        t_mesh: LandmarkGroup,

        active: function () {
            return this.findWhere({active: true});
        },

        withLabel: function (label) {
            return this.findWhere({label: label});
        },

        toJSON: function () {
            var result = {};
            this.each(function (group) {
                result[group.label()] = group;
            });
            return result;
        },

        initEmpty: function (labels, ns) {
            this.reset();  // clear any existing groups
            var group;
            var groups = [];
            if (labels.length !== ns.length) {
                throw("labels and ns need to be the same length");
            }
            for (var i = 0; i < labels.length; i++) {
                group = new LandmarkGroup;
                group.initEmpty(labels[i], ns[i]);
                groups.push(group)
            }
            this.reset(groups);
            this.activeIndex(0);
        },

        deactivateAll: function () {
            this.each(function(group) {
                group.set('active', false);
            });
        },

        deselectAll: function () {
            this.each(function(group) {
                group.landmarks().deselectAll();
            });
        },

        nonempty: function () {
            return _.flatten(this.map(function(group) {
                return group.landmarks().nonempty();
            }));
        },

        activeIndex: function (i) {
            // firstly, deactivate everything
            this.each(function(group) {
                group.set('active', false);
            });
            // then, enable the requested index
            this.at(i).set('active', true);
        },

        activeLabel: function (label) {
            // firstly, deactivate everything
            this.each(function(group) {
                group.set('active', false);
            });
            // then, enable the requested index
            this.withLabel(label).set('active', true);
        },

        advanceActiveGroup: function () {
            var activeIndex = this.indexOf(this.active());
            if (activeIndex < this.length - 1) {
                // we can advance!
                this.activeIndex(activeIndex + 1);
            }
        }

    });

    var LandmarkSet = Backbone.Model.extend({

        urlRoot: "api/v1/landmarks",

        url: function () {
            return this.urlRoot + '/' + this.id + '/' + this.get('type');
        },

        defaults: function () {
            return {
                groups: new LandmarkGroupList
            };
        },

        groups: function () {
            return this.get('groups');
        },

        insertNew: function (v) {
            var activeGroup = this.groups().active();
            var insertedLandmark = null;
            if (activeGroup.landmarks().empty().length !== 0) {
                // get rid of current selection
                activeGroup.landmarks().deselectAll();
                // get the first empty landmark and set it
                insertedLandmark = activeGroup.landmarks().empty()[0];
                insertedLandmark.set('point', v.clone());
                if (activeGroup.landmarks().empty().length === 0) {
                    // depleted this group! Auto-advance to the next if we can
                    this.groups().advanceActiveGroup();
                }
            }
            return insertedLandmark;
        },

        deleteSelected: function () {
            var lms = this.groups().active().landmarks().selected();
            _.each(lms, function (lm) {
                lm.clear();
            });
        },

        parse: function (json, options) {
            if (!options.parse) {
                return;
            }
            var landmarkGroupList = new LandmarkGroupList(
                _.map(json.groups, function (lmks, label) {
                var lmList = new LandmarkList(
                    _.map(lmks.landmarks, function (point) {
                    var index = _.indexOf(lmks.landmarks, point);
                    if (point.point[0] === null) {
                        return new Landmark({index: index});
                    } else {
                        var x, y, z;
                        x = point.point[0];
                        y = point.point[1];
                        z = point.point[2];
                        // TODO handle index here
                        return new Landmark({
                            point: new THREE.Vector3(x, y, z),
                            index: index
                        });
                    }
                }));
                return new LandmarkGroup({landmarks: lmList, label: label});
            }));
            landmarkGroupList.at(0).makeActive();
            return {groups: landmarkGroupList};
        },

        toJSON: function () {
            return {
                groups: this.get('groups'),
                version: 1};
        }
    });

    return {
        Landmark: Landmark,
        LandmarkList: LandmarkList,
        LandmarkGroup: LandmarkGroup,
        LandmarkGroupList: LandmarkGroupList,
        LandmarkSet: LandmarkSet
    }
});

// TODO implement history
