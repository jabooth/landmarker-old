/**
 * Created by jab08 on 27/02/2014.
 */

define(['jquery', 'underscore'], function ($, _) {

    "use strict";

    function Sidebar (signals, keyboard) {
        var _lmSet;
        var trOddTemplate = _.template($("#trTemplateOdd").html());
        var trEvenTemplate = _.template($("#trTemplateEven").html());
        var tableTemplate = _.template($("#tableTemplate").html());
        var landmarkGroupTemplate = _.template($("#landmarkGroupLabel").html());

        function tableForLandmarkGroup(lmGroup) {
            var table = "";
            for (var i = 0; i < lmGroup.landmarks().length; i++) {
                table += tableRowForLandmark(lmGroup.landmarks().at(i));
            }
            return tableTemplate({table: table});
        }

        function tableRowForLandmark(lm) {
            var template = xyziForLandmark(lm);
            if (lm.get('index') % 2) {
                return trOddTemplate(template);
            } else {
                return trEvenTemplate(template);
            }
        }

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

        function updateTable(lmGroup) {
            clearTable();
            $('.Button-LandmarkGroup-Active').removeClass('Button-LandmarkGroup-Active');
            $('.Button-LandmarkGroup#' + lmGroup.label()).addClass('Button-LandmarkGroup-Active');
            $('.Button-LandmarkGroup#' + lmGroup.label()).after(tableForLandmarkGroup(lmGroup));
            updateLandmarkLabelAndCount(lmGroup);
        }

        function updateLandmarkLabelAndCount(lmGroup) {
            $(".LabelName").html(lmGroup.label());
            var n = lmGroup.landmarks().length;
            var c = n - lmGroup.landmarks().empty().length;
            var n_str = pad(n, 2);
            var c_str = pad(c, 2);
            $(".LabelCount").html(c_str + "/" + n_str);

            function pad(n, width, z) {
                z = z || '0';
                n = n + '';
                return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
            }
        }

        function landmarkGroupButton(lmGroup) {
            return landmarkGroupTemplate({
                label: lmGroup.label(),
                labelFormatted: lmGroup.label()
            });
        }

        signals.landmarkChanged.add(function (lm) {
            var id = "#lm" + i.toString();
            var p = xyziForLandmark(lm);
            $(id + " .x").html(p.x);
            $(id + " .y").html(p.y);
            $(id + " .z").html(p.z);
            if (lm.isSelected()) {
                $(id).addClass("Table-Cell-Selected");
            } else {
                $(id).removeClass("Table-Cell-Selected");
            }
        });

        signals.landmarkSetChanged.add(function (lmSet) {
            _lmSet = lmSet;  // get a handle on the lmSet..
            $(".Sidebar-LandmarksPanel").html("") // clear the landmarks panel
            var lmGroupButton;
            // add on all the landmark group buttons
            _.each(lmSet.groups(), function (group) {
                lmGroupButton = landmarkGroupButton(group);
                $(".Sidebar-LandmarksPanel").append(lmGroupButton);
            });
            // update insert the table for the active group
            updateTable(lmSet.groups().active());
            // add the event listeners for the table
            $("tr").click(function () {
                console.log('row clicked');
                var i = parseInt(this.id.substring(2),10);
                if (!keyboard.shift) {
                    lmSet.groups().deselectAll();
                }
                var active = lmSet.groups().active();
                var lm = active.landmarks().at(i);
                if (!lm.isEmpty()) {
                    lm.select();
                }
                // TODO this should be more granular (lmGroupChanged)
                signals.landmarkSetChanged.dispatch(lmSet);
            });
        });

        signals.meshChanged.add(function (mesh) {
           $('.MeshName').html(mesh.getModelId());
        });

        function clearTable() {
            $("table").remove();
        }

        return {
            tableForLandmarkGroup: tableForLandmarkGroup,
            updateTable: updateTable
        };
    }

    return {
        Sidebar: Sidebar
    }
});
