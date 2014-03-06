/**
 * Created by jab08 on 27/02/2014.
 */

define(['jquery', 'underscore', 'backbone'], function ($, _, Backbone) {

    "use strict";

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
            this.$el.html(this.model.label());
            this.$el.toggleClass("Button-LandmarkGroup-Active", this.model.get('active'));
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
            //this.listenTo(this.model, "all", this.render);
        },

        events: {
            'click #next' : "next",
            'click #previous' : "previous"
        },

        render: function () {
            this.$el.html(this.model.label());
            return this;
        },

        next: function () {
            console.log('next called');
        },

        previous: function () {
            console.log('previous called');
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
            this.$el.html(this.model.label());
            return this;
        },

        save: function () {
            console.log('save called');
        },

        revert: function () {
            console.log('revert called');
        }
    });


    var Sidebar = Backbone.View.extend({

        initialize : function() {
            new SaveRevertView({model: this.model.get('landmarks')});
            new ModelPagerView({model: this.model.get('models')});
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
