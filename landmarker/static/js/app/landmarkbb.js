define(['backbone'], function(Backbone) {

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
                point: null
            });
        },

//        equalTo: function (lm) {
//            if (lm.isEmpty() === this.isEmpty() &&
//                lm.get('selected') === this.get('selected')) {
//                if (!lm.isEmpty() && this.get('point').equals(lm.get('point'))) {
//                    return true;
//                }
//            }
//            return false;
//        },

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

        model: Landmark,

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
                landmark.set({selected: true});
            });
        },

        deselectAll: function () {
            this.forEach(function(landmark) {
                landmark.set({selected: false});
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

        model: LandmarkGroup,

        active: function () {
            return this.findWhere({active: true});
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
        },

        deselectAll: function () {
            this.each(function(group) {
                group.landmarks().deselectAll();
            });
        }

    });

    var LandmarkSet = Backbone.Model.extend({

        defaults: function () {
            return {
                groups: new LandmarkGroupList
            };
        },

        groups: function () {
            return this.get('groups');
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

// TODO implement parse
// TODO implement history
