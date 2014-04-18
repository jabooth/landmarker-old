/**
 * Created by jab08 on 27/02/2014.
 */

define(['jquery', 'underscore', 'backbone'], function ($, _, Backbone) {

    "use strict";

    function pad(n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n :
            new Array(width - n.length + 1).join(z) + n;
    }

    var LandmarkView = Backbone.View.extend({

        template: _.template($("#trTemplate").html()),

        events: {
            "click": "select"
        },

        id: function () {
            return 'lm' + this.model.get('index');
        },

        initialize: function () {
            this.listenTo(this.model, 'change', this.render);
        },

        render: function () {

            function xyziForLandmark(lm) {
                var p;
                if (lm.isEmpty()) {
                    return {
                        x: '-',
                        y: '-',
                        z: '-',
                        i: lm.get('index')
                    };
                } else {
                    p = lm.point();
                    return {
                        x: p.x.toPrecision(4),
                        y: p.y.toPrecision(4),
                        z: p.z.toPrecision(4),
                        i: lm.get('index')
                    };
                }
            }

            var html = $(this.template(xyziForLandmark(this.model)));
            html.toggleClass("Table-Row-Odd", this.model.get('index') % 2 === 1);
            html.toggleClass("Table-Cell-Selected", this.model.isSelected());

            // in case our element is already live replace the content
            this.$el.replaceWith(html);
            // now set the element back so we have a handle. If this is the
            // first time then we have gotten a handle for the future
            this.setElement(html);
            return this;
        },

        select: function (event) {
            if (event.shiftKey) {
                // shift takes precedence.
            } else if ((event.ctrlKey || event.metaKey)) {
                if (this.model.isSelected()) {
                    this.model.deselect();
                } else {
                    this.model.select();
                }
            } else {
                this.model.collection.deselectAll();
                this.model.select();
            }
        }
    });


    // TODO listen to subview selections, deselect rest
    var LandmarkListView = Backbone.View.extend({

        template: _.template($("#tableHeader").html()),

        tagName: 'table',

        initialize : function() {
            _.bindAll(this, 'render', 'renderOne');
            this.listenTo(this.collection, "reset", this.render);
        },

        render: function() {
            this.$el.empty();
            this.$el.append(this.template());
            this.collection.each(this.renderOne);
            return this;
        },

        renderOne : function(model) {
            var row = new LandmarkView({model:model});
            // reset the view's element to it's template
            this.$el.append(row.render().$el);
            return this;
        }

    });


    var LandmarkGroupButtonView = Backbone.View.extend({

        tagName: "button",

        className: "Button-LandmarkGroup",

        events: {
            'click' : "makeActive"
        },

        makeActive: function () {
            this.model.makeActive();
        },

        initialize : function() {
            _.bindAll(this, 'render');
            this.listenTo(this.model, "all", this.render);
            this.listenTo(this.model.get('landmarks'), "all", this.render);
        },

        render: function () {
            var lms = this.model.get('landmarks');
            var nonempty_str = pad(lms.nonempty().length, 2);
            var lms_str = pad(lms.length, 2);
            var label = this.model.label();
            this.$el.html(label + " (" + nonempty_str + "/" + lms_str + ")");
            this.$el.toggleClass("Button-LandmarkGroup-Active",
                this.model.get("active"));
            return this;
        }
    });


    var LandmarkGroupView = Backbone.View.extend({

        // TODO make this a useful div
        tagName: 'div',

        initialize : function() {
            _.bindAll(this, 'render');
            this.listenTo(this.model, "all", this.render);
        },

        render: function () {
            var button = new LandmarkGroupButtonView({model:this.model});
            var landmarkTable;
            this.$el.empty();
            this.$el.append(button.render().$el);
            if (this.model.get('active')) {
                landmarkTable = new LandmarkListView(
                    {collection: this.model.landmarks()});
                this.$el.append(landmarkTable.render().$el);
            }
            return this;
        }
    });


    var LandmarkGroupListView = Backbone.View.extend({

        // TODO make this a useful div

        initialize : function() {
            _.bindAll(this, 'render', 'renderOne');
            this.listenTo(this.collection, "reset", this.render);
        },

        render: function() {
            this.$el.empty();
            this.collection.each(this.renderOne);
            return this;
        },

        renderOne : function(model) {
            var group = new LandmarkGroupView({model:model});
            // reset the view's element to it's template
            this.$el.append(group.render().$el);
            return this;
        }

    });


    var MeshPagerView = Backbone.View.extend({

        el: '#meshPager',

        initialize : function() {
            _.bindAll(this, 'render');
            this.listenTo(this.model, "all", this.render);
            this.render();
        },

        events: {
            'click #next' : "next",
            'click #previous' : "previous"
        },

        render: function () {
            this.$el.find('#next').toggleClass('Button--Disabled',
                !this.model.hasSuccessor());
            this.$el.find('#previous').toggleClass('Button--Disabled',
                !this.model.hasPredecessor());
            return this;
        },

        next: function () {
            this.model.next();
        },

        previous: function () {
            this.model.previous();
        }

    });


    var SaveRevertView = Backbone.View.extend({

        el: '#saveRevert',

        initialize : function() {
            _.bindAll(this, 'render');
            //this.listenTo(this.model, "all", this.render);
        },

        events: {
            'click #save' : "save",
            'click #revert' : "revert"
        },

        render: function () {
            // TODO grey out save and revert as required
            return this;
        },

        save: function () {
            console.log('save called');
            this.model.save(null, {parse: false});
        },

        revert: function () {
            console.log('revert called');
        }
    });

    var MeshInfoView = Backbone.View.extend({

        el: '#meshInfo',

        initialize : function() {
            _.bindAll(this, 'render');
            this.listenTo(this.model, "change:mesh", this.render);
        },

        render: function () {
            console.log("MeshInfoView: meshSource:mesh has a change");
            this.$el.find('#meshName').html(this.model.mesh().id);
            var n_str = pad(this.model.meshes().length, 2);
            var i_str = pad(this.model.meshIndex() + 1, 2);
            this.$el.find('#meshIndex').html(i_str + "/" + n_str);
            return this;
        },

        events: {
            "click #meshName" : "chooseMeshName",
            'click #meshIndex' : "chooseMeshNumber"
        },

        chooseMeshNumber: function () {
            console.log('Sidebar:chooseMeshNumber called');
        },

        chooseMeshName: function () {
            console.log('Sidebar:chooseMeshName called');
        },

        revert: function () {
            console.log('Sidebar:revert called');
        }
    });


    var Sidebar = Backbone.View.extend({

        initialize : function() {
            _.bindAll(this, "renderLandmarks", "renderMeshSrc");
            this.listenTo(this.model, "change:landmarks", this.renderLandmarks);
            this.listenTo(this.model, "change:meshSource", this.renderMeshSrc);
            this.renderMeshSrc();
        },

        renderMeshSrc: function () {
            new MeshPagerView({model: this.model.get('meshSource')});
            new MeshInfoView({model: this.model.get('meshSource')});
        },

        renderLandmarks: function () {
            // TODO inconsistency in binding - manual or hardcoded? not both.
            new SaveRevertView({model: this.model.get('landmarks')});
            var lmView = new LandmarkGroupListView({
                collection: this.model.get('landmarks').get('groups')
            });
            $('.Sidebar-LandmarksPanel').html(lmView.render().$el)
        }

    });

    return {
        LandmarkView: LandmarkView,
        LandmarkListView: LandmarkListView,
        LandmarkGroupButtonView: LandmarkGroupButtonView,
        LandmarkGroupView: LandmarkGroupView,
        LandmarkGroupListView: LandmarkGroupListView,
        ModelPagerView: MeshPagerView,
        SaveRevertView: SaveRevertView,
        Sidebar: Sidebar
    }
});
