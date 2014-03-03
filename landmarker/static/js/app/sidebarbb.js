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
            this.model.set({selected: true});
        }
    });

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

    var LandmarkGroupView = Backbone.View.extend({

    });

    return {
        LandmarkView: LandmarkView,
        LandmarkListView: LandmarkListView
    }
});
