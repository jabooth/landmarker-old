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
            for (var i = 0; i < lmGroup.nLandmarks(); i++) {
                table += tableRowForLandmark(lmGroup.getLandmark(i), i);
            }
            return tableTemplate({table: table});
        }

        function tableRowForLandmark(lm, i) {
            var template = xyziForLandmark(lm, i);
            if (i % 2) {
                return trOddTemplate(template);
            } else {
                return trEvenTemplate(template);
            }
        }

        function xyziForLandmark(lm, i) {
            var p;
            if (lm.isEmpty()) {
                return {
                    x: '-',
                    y: '-',
                    z: '-',
                    i: i
                };
            } else {
                p = lm.getPoint();
                return {
                    x: p.x.toPrecision(4),
                    y: p.y.toPrecision(4),
                    z: p.z.toPrecision(4),
                    i: i
                };
            }
        }

        function updateTable(lmGroup) {
            clearTable();
            $('.Button-LandmarkGroup-Active').removeClass('Button-LandmarkGroup-Active');
            $('.Button-LandmarkGroup#' + lmGroup.getLabel()).addClass('Button-LandmarkGroup-Active');
            $('.Button-LandmarkGroup#' + lmGroup.getLabel()).after(tableForLandmarkGroup(lmGroup));
            updateLandmarkLabelAndCount(lmGroup);
        }

        function updateLandmarkLabelAndCount(lmGroup) {
            $(".LabelName").html(lmGroup.getLabel());
            var n = lmGroup.nLandmarks();
            var c = n - lmGroup.nEmptyLandmarks();
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
                label: lmGroup.getLabel(),
                labelFormatted: lmGroup.getLabel()
            });
        }

        signals.landmarkChanged.add(function (lm, i, lmGroup) {
            var id = "#lm" + i.toString();
            var p = xyziForLandmark(lm, i);
            $(id + " .x").html(p.x);
            $(id + " .y").html(p.y);
            $(id + " .z").html(p.z);
            if (lm.isSelected()) {
                $(id).addClass("Table-Cell-Selected");
            } else {
                $(id).removeClass("Table-Cell-Selected");
            }
            updateLandmarkLabelAndCount(lmGroup)
        });

        signals.landmarkSetChanged.add(function (lmSet) {
            _lmSet = lmSet;  // get a handle on the lmSet..
            $(".Sidebar-LandmarksPanel").html("") // clear the landmarks panel
            var lmGroupButton;
            // add on all the landmark group buttons
            _.each(lmSet.groups, function (group, label) {
                lmGroupButton = landmarkGroupButton(group);
                $(".Sidebar-LandmarksPanel").append(lmGroupButton);
            });
            // update insert the table for the active group
            updateTable(lmSet.getActiveGroup());
            // add the event listeners for the table
            $("tr").click(function () {
                console.log('row clicked');
                var i = parseInt(this.id.substring(2),10);
                if (!keyboard.shift) {
                    lmSet.deselectAll();
                }
                var active = lmSet.getActiveGroup();
                var lm = active.getLandmark(i);
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


