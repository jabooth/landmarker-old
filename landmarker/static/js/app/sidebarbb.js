/**
 * Created by jab08 on 27/02/2014.
 */

define(['jquery', 'underscore', 'backbone'], function ($, _, Backbone) {

    "use strict";

    function pad(n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }

    var LandmarkView = Backbone.View.extend({

        template: _.template($("#trTemplate").html()),

        events: {
            "click" : "select"
        },

        id: function () {
            return 'lm' + this.model.get('index');
        },

        initialize: function() {
            this.listenTo(this.model, 'change', this.render);
        },

        render: function() {

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

        select: function() {
            console.log('selected!');
            this.model.select();
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
                    {collection: this.model.landmarks()})
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


    var ModelPagerView = Backbone.View.extend({

        el: '#modelPager',

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

    var ModelInfoView = Backbone.View.extend({

        el: '#modelInfo',

        initialize : function() {
            _.bindAll(this, 'render');
            this.listenTo(this.model, "all", this.render);
            this.render();
        },

        render: function () {
            this.$el.find('#modelName').html(this.model.get('model').id);
            var n_str = pad(this.model.get('models').length, 2);
            var i_str = pad(this.model.modelIndex() + 1, 2);
            this.$el.find('#modelIndex').html(i_str + "/" + n_str);
            return this;
        },

        events: {
            'click #modelName' : "chooseModelId",
            'click #modelIndex' : "chooseModelNumber"
        },

        chooseModelNumber: function () {
            console.log('choose model number called');
        },

        chooseModelId: function () {
            console.log('choose model id called');
        },

        revert: function () {
            console.log('revert called');
        }
    });


    var Sidebar = Backbone.View.extend({

        initialize : function() {
            new SaveRevertView({model: this.model.get('landmarks')});
            new ModelPagerView({model: this.model.get('modelSrc')});
            new ModelInfoView({model: this.model.get('modelSrc')});
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
        ModelPagerView: ModelPagerView,
        SaveRevertView: SaveRevertView,
        Sidebar: Sidebar
    }
});
